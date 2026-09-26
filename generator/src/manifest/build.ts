import { readFileSync } from "node:fs"
import path from "node:path"
import { BROWSER_SPECS, VISUAL_CASES } from "../../../tests/visual/cases"
import { COMPONENT_ADAPTERS } from "../adapters/components"
import { behaviorsOf, PRIMITIVE_FAMILIES } from "../adapters/families"
import { BASE_UI_PRIMITIVES } from "../adapters/primitives/base-ui"
import { type ClassificationKind, classify } from "../analyzer/classify"
import { collectFacts } from "../analyzer/facts"
import { reasonKey } from "../analyzer/reasons"
import { type GeneratorConfig, itemUrl } from "../config"
import { LITE_COMPONENTS, LITE_DIR } from "../lite"
import { ROOT } from "../paths"
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

/** A hand-written lite alternative (docs/adr/0028), not a port. */
export interface AlternativeEntry {
  name: string
  kind: "lite"
  status: SupportStatus
  /** Upstream items it approximates, with the reviewed content hashes. */
  basedOn: { name: string; contentSha256: string }[]
  visualParity: "approximate" | "not-compared"
  clientJs: "none"
  knownDifferences: string[]
}

export interface Manifest {
  generatedBy: string
  style: string
  components: ManifestEntry[]
  alternatives: AlternativeEntry[]
}

const COMMON_DIFFERENCES: Record<string, string> = {
  "classname-to-class": "Accepts `class` instead of `className`.",
  "base-ui-use-render":
    "`render` is supported on the server (element or function), like Base UI.",
}

function knownDifferences(
  reasons: string[],
  adapterNotes: readonly string[]
): string[] {
  const notes: string[] = []
  for (const key of reasons) {
    const common = COMMON_DIFFERENCES[key]
    if (common) notes.push(common)
    if (key.startsWith("control-state-class:")) {
      notes.push(
        key.includes("[role=")
          ? "Selectors for checkbox and radio roles (`[role=checkbox]`) match the generated controls by `data-slot`, as their roots carry no role."
          : "Checked-state styles (`has-data-checked:`) follow the native `:checked` state of the generated controls."
      )
    }
    if (key.startsWith("base-ui-primitive-mapped:")) {
      const [module, exportName] = key
        .slice("base-ui-primitive-mapped:".length)
        .split("#")
      const rule =
        BASE_UI_PRIMITIVES.find(
          (r) => r.module === module && r.exportName === exportName
        ) ??
        PRIMITIVE_FAMILIES.find(
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
    const lockEntry = deps.lock.styles[deps.config.style]?.items[name]
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
      clientJs:
        behaviorsOf(reasons, COMPONENT_ADAPTERS[name]).length > 0
          ? "required"
          : "none",
      knownDifferences: knownDifferences(
        reasons,
        COMPONENT_ADAPTERS[name]?.notes ?? []
      ),
      reasons,
    }
  })
  const alternatives = Object.entries(LITE_COMPONENTS).map(
    ([name, lite]): AlternativeEntry => {
      const source = readFileSync(
        path.join(ROOT, LITE_DIR, `${name}.tsx`),
        "utf8"
      )
      const reasons = classify(
        collectFacts({
          name,
          type: "registry:ui",
          files: [
            { path: `${name}.tsx`, type: "registry:ui", content: source },
          ],
        }),
        {},
        { available: new Set(deps.config.components) }
      ).reasons.map(reasonKey)
      return {
        name,
        kind: "lite",
        status: "experimental",
        basedOn: Object.entries(lite.basedOn).map(([base, sha256]) => ({
          name: base,
          contentSha256: sha256,
        })),
        visualParity: lite.visualParity,
        clientJs: "none",
        knownDifferences: [...lite.notes, ...knownDifferences(reasons, [])],
      }
    }
  )
  return {
    generatedBy: "shadcnui-hono-jsx",
    style: deps.config.style,
    components,
    alternatives,
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
    `Generated from \`compatibility.json\` (upstream style \`${manifest.style}\`; every Base UI style is generated from the same sources and compared the same way). Every component is server-rendered Hono JSX; the "Client JS" column names the optional script a component needs for its behavior (see "Client scripts" above). "Visual parity: verified" means screenshots match upstream shadcn/ui (React) in light and dark mode in the \`tests/visual\` CI job.`,
    "",
    "| Component | Status | Conversion | Visual parity | Client JS | Known differences |",
    "| --- | --- | --- | --- | --- | --- |",
    ...generated.map(
      (c) =>
        `| ${c.name} | ${c.status} | ${c.conversion} | ${c.visualParity} | ${
          behaviorsOf(c.reasons, COMPONENT_ADAPTERS[c.name])
            .filter((name) => name !== "core")
            .map((name) => `\`/shadcn/${name}.js\``)
            .join(", ") || "none"
        } | ${cell(c.knownDifferences.join(" "))} |`
    ),
    "",
    ...(manifest.alternatives.length > 0
      ? [
          "Lite alternatives approximate a component that has no port yet, without JavaScript. They are hand-written, not ports, and a port may later take the upstream name ([ADR 0028](docs/adr/0028-offer-hand-written-lite-alternatives-with-a-lite-suffix-for-components-without-a-port.md)).",
          "",
          "| Lite alternative | Based on | Status | Visual parity | Client JS | Known differences |",
          "| --- | --- | --- | --- | --- | --- |",
          ...manifest.alternatives.map(
            (a) =>
              `| ${a.name} | ${a.basedOn.map((b) => b.name).join(", ")} | ${a.status} | ${a.visualParity} | none | ${cell(a.knownDifferences.join(" "))} |`
          ),
          "",
        ]
      : []),
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
