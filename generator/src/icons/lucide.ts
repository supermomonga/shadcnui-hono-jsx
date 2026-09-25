/**
 * Lucide icon data for generation time. Upstream shadcn/ui renders icons with
 * `lucide-react`; generated components inline the same SVG instead of adding a
 * runtime dependency (docs/adr/0016). Only the React-free `lucide` package is
 * read, from the pinned devDependency.
 */
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { ROOT } from "../paths"

export type LucideIconNode = [tag: string, attributes: Record<string, string>][]

export interface LucideIcon {
  /** Canonical kebab-case name (`ellipsis`). */
  name: string
  /** Deprecated kebab-case aliases lucide-react adds as classes (`more-horizontal`). */
  aliases: string[]
  node: LucideIconNode
}

const LUCIDE_DIR = path.join(ROOT, "node_modules", "lucide")
const EXPORT_LINE =
  /^export \{ ([^}]+) \} from '\.\/icons\/([a-z0-9-]+)\.mjs';$/

/** `MoreHorizontal` -> `more-horizontal`, `Loader2` -> `loader-2`. */
export function toKebabCase(pascal: string): string {
  return pascal
    .replace(/([a-z])([A-Z0-9])/g, "$1-$2")
    .replace(/([0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
}

/** `ellipsis` -> `Ellipsis`, `loader-circle` -> `LoaderCircle`. */
export function toPascalCase(kebab: string): string {
  return kebab.replace(/(^|-)([a-z0-9])/g, (_, _dash, c: string) =>
    c.toUpperCase()
  )
}

interface IndexEntry {
  file: string
  exportNames: string[]
}

let index: Map<string, IndexEntry> | undefined

/** Export name (`MoreHorizontal`) -> icon module and all names exported from it. */
function loadIndex(): Map<string, IndexEntry> {
  if (index) return index
  index = new Map()
  const source = readFileSync(
    path.join(LUCIDE_DIR, "dist", "esm", "iconsAndAliases.mjs"),
    "utf8"
  )
  for (const line of source.split("\n")) {
    const match = line.match(EXPORT_LINE)
    if (!match) continue
    const [, exports = "", file = ""] = match
    const exportNames = exports
      .split(",")
      .map((e) => e.trim().replace(/^default as /, ""))
    const entry = { file, exportNames }
    for (const name of exportNames) index.set(name, entry)
  }
  return index
}

const require = createRequire(import.meta.url)

/** Resolves an upstream `IconPlaceholder lucide="…Icon"` name, or null if Lucide has no such icon. */
export function resolveLucideIcon(placeholderName: string): LucideIcon | null {
  const exportName = placeholderName.replace(/Icon$/, "")
  const entry = loadIndex().get(exportName)
  if (!entry) return null
  const canonical = toPascalCase(entry.file)
  const module = require(
    path.join(LUCIDE_DIR, "dist", "esm", "icons", `${entry.file}.mjs`)
  ) as {
    default: LucideIconNode
  }
  return {
    name: entry.file,
    aliases: entry.exportNames.filter((n) => n !== canonical).map(toKebabCase),
    node: module.default,
  }
}

/** Version of the pinned `lucide` package, recorded in generated headers. */
export function lucideVersion(): string {
  const pkg = JSON.parse(
    readFileSync(path.join(LUCIDE_DIR, "package.json"), "utf8")
  ) as {
    version: string
  }
  return pkg.version
}
