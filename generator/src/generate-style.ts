/**
 * Generates the templates of one style: every configured component and lite
 * alternative, and their menu color and RTL variants (docs/adr/0030). Run in
 * a worker per style by `bun run generate`.
 */
import { variantDir } from "../../cli/src/variants"
import { config } from "../../generator.config"
import { forStyle } from "./config"
import type { OutputFile } from "./emit/write"
import {
  type GeneratedComponent,
  GenerationError,
  generateComponent,
} from "./generate"
import { generateLite, LITE_COMPONENTS, liteSource } from "./lite"
import { ROOT } from "./paths"
import { UpstreamStore } from "./upstream/store"
import { applyVariant, candidateVariants } from "./variants"

export interface StyleRequest {
  style: string
  /** Components to generate variants for (all are generated for the catalog). */
  selected: string[]
}

export interface StyleResult {
  style: string
  components: GeneratedComponent[]
  variants: OutputFile[]
  errors: string[]
}

const withoutVariantLine = (text: string) =>
  text.replace(/^\/\/ variant: .*\n/m, "")

export async function generateStyle(
  request: StyleRequest
): Promise<StyleResult> {
  const { style } = request
  const store = new UpstreamStore(ROOT, style)
  const lock = store.readLock()
  if (!lock) throw new Error("upstream/lock.json is missing")
  const deps = { config: forStyle(config, style), store, lock }
  const result: StyleResult = {
    style,
    components: [],
    variants: [],
    errors: [],
  }
  const attempt = <T>(label: string, run: () => T): T | undefined => {
    try {
      return run()
    } catch (error) {
      if (!(error instanceof GenerationError)) throw error
      result.errors.push(`${label}: ${error.message}`)
      return undefined
    }
  }

  const lite = new Set(Object.keys(LITE_COMPONENTS))
  for (const name of [...config.components, ...lite]) {
    const component = attempt(style, () =>
      lite.has(name) ? generateLite(name, deps) : generateComponent(name, deps)
    )
    if (!component) continue
    result.components.push(component)
    if (!request.selected.includes(name)) continue

    // Variants from upstream source transformed by the shadcn CLI's
    // transforms. RTL-only variants are kept where they change the
    // component; menu color variants always are.
    const source = lite.has(name)
      ? liteSource(name, store)
      : (store.readItem(name).files?.[0]?.content ?? "")
    for (const variant of candidateVariants(source)) {
      const transformed = await applyVariant(source, variant)
      const menu = variant.menuColor !== "default"
      if (!menu && transformed === source) continue
      const generated = attempt(`${style}/${variantDir(variant)}`, () =>
        lite.has(name)
          ? generateLite(name, deps, { variant, source: transformed })
          : generateComponent(name, deps, { variant, source: transformed })
      )
      if (!generated) continue
      if (
        !menu &&
        withoutVariantLine(generated.file.text) === component.file.text
      ) {
        continue
      }
      result.variants.push(generated.file)
    }
  }
  return result
}
