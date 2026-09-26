import {
  DEFAULT_VARIANT,
  type Variant,
  variantDir,
} from "../../cli/src/variants"
import { COMPONENT_ADAPTERS } from "./adapters/components"
import { behaviorsOf } from "./adapters/families"
import { type Classification, classify } from "./analyzer/classify"
import { collectFacts } from "./analyzer/facts"
import { reasonKey } from "./analyzer/reasons"
import { type GeneratorConfig, itemUrl } from "./config"
import { formatWithBiome } from "./emit/format"
import { renderHeader } from "./emit/header"
import type { OutputFile } from "./emit/write"
import { lucideVersion } from "./icons/lucide"
import { transformSource } from "./transformers/pipeline"
import type { UpstreamLock } from "./upstream/lock"
import type { UpstreamStore } from "./upstream/store"
import type { UpstreamItem } from "./upstream/types"

/** Templates of every style, installed by the CLI (docs/adr/0030). */
export const TEMPLATES_DIR = "cli/generated/templates"

export interface GeneratedComponent {
  name: string
  classification: Classification
  /** `lite`: a hand-written lite alternative (docs/adr/0028). */
  mode: "generated" | "adapter" | "lite"
  file: OutputFile
  log: string[]
}

export class GenerationError extends Error {}

export function templatePath(
  style: string,
  name: string,
  variant: Variant = DEFAULT_VARIANT
): string {
  const dir = variantDir(variant)
  return `${TEMPLATES_DIR}/${style}/${dir ? `${dir}/` : ""}${name}.tsx`
}

/**
 * Translates one snapshotted upstream component into a formatted Hono JSX
 * template. For a variant, `source` is the upstream source transformed for it
 * (`applyVariant`).
 */
export function generateComponent(
  name: string,
  deps: { config: GeneratorConfig; store: UpstreamStore; lock: UpstreamLock },
  variant?: { variant: Variant; source: string }
): GeneratedComponent {
  const snapshot = deps.store.readItem(name)
  const item: UpstreamItem = variant
    ? {
        ...snapshot,
        files: (snapshot.files ?? []).map((f, i) =>
          i === 0 ? { ...f, content: variant.source } : f
        ),
      }
    : snapshot
  const facts = collectFacts(item)
  const adapter = COMPONENT_ADAPTERS[name]
  const classification = classify(facts, COMPONENT_ADAPTERS, {
    available: new Set(deps.config.components),
  })
  if (classification.kind === "unsupported") {
    const blocking = classification.reasons
      .filter((r) => r.blocking)
      .map(reasonKey)
    throw new GenerationError(`${name} is unsupported: ${blocking.join(", ")}`)
  }
  const [file] = item.files ?? []
  const [fileFacts] = facts.files
  if (!file || !fileFacts) throw new GenerationError(`${name} has no files`)
  const lockEntry = deps.lock.styles[deps.config.style]?.items[name]
  if (!lockEntry)
    throw new GenerationError(`${name} is missing from upstream/lock.json`)

  const mode = adapter === undefined ? "generated" : "adapter"
  const output = transformSource({
    name,
    source: file.content,
    facts: fileFacts,
    adapter,
  })
  const header = renderHeader({
    name,
    style: deps.config.style,
    url: itemUrl(deps.config, name),
    contentSha256: lockEntry.contentSha256,
    upstreamCommit: lockEntry.upstreamCommit,
    mode,
    icons: { names: output.icons, version: lucideVersion() },
    scripts: behaviorsOf(classification.reasons.map(reasonKey), adapter).filter(
      (script) => script !== "core"
    ),
    variant: variant ? variantDir(variant.variant) : undefined,
  })
  const path = templatePath(deps.config.style, name, variant?.variant)
  return {
    name,
    classification,
    mode,
    file: { path, text: formatWithBiome(`${header}\n${output.text}`, path) },
    log: output.log,
  }
}
