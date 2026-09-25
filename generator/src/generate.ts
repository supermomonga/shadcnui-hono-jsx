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

export const COMPONENTS_DIR = "components/ui"

export interface GeneratedComponent {
  name: string
  classification: Classification
  mode: "generated" | "adapter"
  file: OutputFile
  log: string[]
}

export class GenerationError extends Error {}

export function componentPath(name: string): string {
  return `${COMPONENTS_DIR}/${name}.tsx`
}

/** Translates one snapshotted upstream component into a formatted Hono JSX file. */
export function generateComponent(
  name: string,
  deps: { config: GeneratorConfig; store: UpstreamStore; lock: UpstreamLock }
): GeneratedComponent {
  const item = deps.store.readItem(name)
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
  const lockEntry = deps.lock.items[name]
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
  })
  const path = componentPath(name)
  return {
    name,
    classification,
    mode,
    file: { path, text: formatWithBiome(`${header}\n${output.text}`, path) },
    log: output.log,
  }
}
