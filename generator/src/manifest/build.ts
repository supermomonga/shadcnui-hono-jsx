import { BROWSER_SPECS, VISUAL_CASES } from "../../../tests/visual/cases"
import { COMPONENT_ADAPTERS } from "../adapters/components"
import { BASE_UI_PRIMITIVES } from "../adapters/primitives/base-ui"
import { type ClassificationKind, classify } from "../analyzer/classify"
import { collectFacts } from "../analyzer/facts"
import { reasonKey } from "../analyzer/reasons"
import { type GeneratorConfig, itemUrl } from "../config"
import type { UpstreamLock } from "../upstream/lock"
import type { UpstreamStore } from "../upstream/store"

export type SupportStatus =
  | "supported"
  | "experimental"
  | "partial"
  | "unsupported"
export type ConversionMode =
  | "generated"
  | "generated-with-adapter"
  | "hand-written-primitive"

export interface ManifestEntry {
  name: string
  status: SupportStatus
  conversion: ConversionMode | null
  classification: ClassificationKind
  upstream: { url: string; contentSha256: string | null; commit: string | null }
  visualParity: "verified" | "unverified" | "not-applicable"
  apiParity: "full" | "partial" | "none"
  accessibility: "verified" | "static-markup" | "unverified" | "not-applicable"
  clientJs: "none" | "required" | "not-applicable"
  knownDifferences: string[]
  /** Machine-readable classification reasons (`code` or `code:detail`). */
  reasons: string[]
}

export interface Manifest {
  generatedBy: string
  style: string
  components: ManifestEntry[]
}

const COMMON_DIFFERENCES: Record<string, string> = {
  "classname-to-class": "Accepts `class` instead of `className`.",
  "base-ui-use-render": "`render` (element replacement) is not supported.",
}

function knownDifferences(
  reasons: string[],
  adapterNotes: readonly string[]
): string[] {
  const notes: string[] = []
  for (const key of reasons) {
    const common = COMMON_DIFFERENCES[key]
    if (common) notes.push(common)
    if (key.startsWith("base-ui-primitive-mapped:")) {
      const [module, exportName] = key
        .slice("base-ui-primitive-mapped:".length)
        .split("#")
      const rule = BASE_UI_PRIMITIVES.find(
        (r) => r.module === module && r.exportName === exportName
      )
      notes.push(...(rule?.notes ?? []))
    }
  }
  notes.push(...adapterNotes)
  return [...new Set(notes)]
}

/** Builds the compatibility manifest for every snapshotted upstream item. */
export function buildManifest(deps: {
  config: GeneratorConfig
  store: UpstreamStore
  lock: UpstreamLock
}): Manifest {
  const components = deps.store.listItems().map((name): ManifestEntry => {
    const classification = classify(
      collectFacts(deps.store.readItem(name)),
      COMPONENT_ADAPTERS,
      { available: new Set(deps.config.components) }
    )
    const reasons = classification.reasons.map(reasonKey)
    const lockEntry = deps.lock.items[name]
    const upstream = {
      url: itemUrl(deps.config, name),
      contentSha256: lockEntry?.contentSha256 ?? null,
      commit: lockEntry?.upstreamCommit ?? null,
    }
    const generated =
      deps.config.components.includes(name) &&
      classification.kind !== "unsupported"
    if (!generated) {
      return {
        name,
        status: "unsupported",
        conversion: null,
        classification: classification.kind,
        upstream,
        visualParity: "not-applicable",
        apiParity: "none",
        accessibility: "not-applicable",
        clientJs: "not-applicable",
        knownDifferences:
          classification.kind === "unsupported"
            ? []
            : ["Convertible, but not generated yet."],
        reasons: classification.reasons
          .filter((r) => r.blocking)
          .map(reasonKey),
      }
    }
    return {
      name,
      status: "experimental",
      conversion:
        COMPONENT_ADAPTERS[name] !== undefined
          ? "generated-with-adapter"
          : "generated",
      classification: classification.kind,
      upstream,
      // Checked against upstream React by tests/visual (CI `visual` job).
      visualParity:
        VISUAL_CASES.some((c) => c.component === name) || name in BROWSER_SPECS
          ? "verified"
          : "unverified",
      apiParity: "partial",
      // Interactive components are checked for keyboard, focus and ARIA in a browser.
      accessibility: name in BROWSER_SPECS ? "verified" : "static-markup",
      clientJs: "none",
      knownDifferences: knownDifferences(
        reasons,
        COMPONENT_ADAPTERS[name]?.notes ?? []
      ),
      reasons,
    }
  })
  return {
    generatedBy: "shadcnui-hono-jsx",
    style: deps.config.style,
    components,
  }
}

const cell = (text: string) =>
  text
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ")
    .replace(/<(?![^`]*`)/g, "&lt;")

/** Markdown for the README compatibility section. */
export function renderCompatibilityTable(manifest: Manifest): string {
  const generated = manifest.components.filter((c) => c.conversion !== null)
  const others = manifest.components.filter((c) => c.conversion === null)
  const lines = [
    `Generated from \`compatibility.json\` (upstream style \`${manifest.style}\`). Every component is server-rendered Hono JSX with no client JavaScript. "Visual parity: verified" means screenshots match upstream shadcn/ui (React) in light and dark mode in the \`tests/visual\` CI job.`,
    "",
    "| Component | Status | Conversion | Visual parity | Known differences |",
    "| --- | --- | --- | --- | --- |",
    ...generated.map(
      (c) =>
        `| ${c.name} | ${c.status} | ${c.conversion} | ${c.visualParity} | ${cell(c.knownDifferences.join(" "))} |`
    ),
    "",
    "<details>",
    `<summary>Not yet available (${others.length} upstream components)</summary>`,
    "",
    "| Component | Classification | Blocking reasons |",
    "| --- | --- | --- |",
    ...others.map(
      (c) =>
        `| ${c.name} | ${c.classification} | ${cell(c.reasons.map((r) => `\`${r}\``).join(", ") || "not generated yet")} |`
    ),
    "",
    "</details>",
  ]
  return lines.join("\n")
}

const START = "<!-- compatibility-table:start -->"
const END = "<!-- compatibility-table:end -->"

export function replaceReadmeRegion(readme: string, content: string): string {
  const start = readme.indexOf(START)
  const end = readme.indexOf(END)
  if (start === -1 || end === -1 || end < start) {
    throw new Error("README.md is missing the compatibility-table markers")
  }
  return `${readme.slice(0, start + START.length)}\n${content}\n${readme.slice(end)}`
}
