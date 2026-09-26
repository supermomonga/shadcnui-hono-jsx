import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { UsageError } from "./errors"
import { CLIENT_DIR, GENERATED_DIR, TEMPLATES_DIR } from "./paths"

export interface CatalogItem {
  name: string
  /** `lite`: a hand-written lite alternative, not a port (docs/adr/0028). */
  kind: "port" | "lite"
  /** Components installed with the item: the item itself, then the siblings it imports. */
  components: string[]
  /** npm packages the components import, besides `hono`. */
  dependencies: string[]
  /** Client scripts installed to public/shadcn/, shared modules such as `core` included. */
  scripts: string[]
}

/** Everything `bun run generate` records for the CLI (`generated/catalog.json`). */
export interface Catalog {
  /** Base UI styles with templates, e.g. `base-nova`. */
  styles: string[]
  items: CatalogItem[]
  /** npm packages the theme imports. */
  themeDependencies: string[]
  /** License lines for the header of files derived from shadcn/ui. */
  noticeLines: string[]
}

export function readCatalog(): Catalog {
  return JSON.parse(
    readFileSync(path.join(GENERATED_DIR, "catalog.json"), "utf8")
  ) as Catalog
}

export function findItem(catalog: Catalog, name: string): CatalogItem {
  const item = catalog.items.find((i) => i.name === name)
  if (!item) {
    throw new UsageError(
      `Unknown component "${name}". Available: ${catalog.items.map((i) => i.name).join(", ")}`
    )
  }
  return item
}

export function readTemplate(style: string, name: string): string {
  const file = path.join(TEMPLATES_DIR, style, `${name}.tsx`)
  if (!existsSync(file)) {
    throw new Error(`No template for ${name} in ${style}`)
  }
  return readFileSync(file, "utf8")
}

export function readClientScript(name: string): string {
  return readFileSync(path.join(CLIENT_DIR, `${name}.js`), "utf8")
}

export function readGenerated(file: string): string {
  return readFileSync(path.join(GENERATED_DIR, file), "utf8")
}
