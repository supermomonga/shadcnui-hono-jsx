import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import type { VendoredSource } from "./sync"

/** Reads `tailwind.css` and its licensing from the installed (pinned) `shadcn` package. */
export function readShadcnTailwindCss(root: string): VendoredSource {
  const dir = path.join(root, "node_modules", "shadcn")
  const pkg = JSON.parse(
    readFileSync(path.join(dir, "package.json"), "utf8")
  ) as {
    version: string
    license?: string
  }
  const file = "dist/tailwind.css"
  const licensePath = path.join(dir, "LICENSE.md")
  return {
    package: "shadcn",
    version: pkg.version,
    file,
    text: readFileSync(path.join(dir, file), "utf8"),
    license: pkg.license ?? null,
    licenseText: existsSync(licensePath)
      ? readFileSync(licensePath, "utf8")
      : null,
  }
}

export interface PackageLicenseSource {
  package: string
  version: string
  license: string | null
  licenseText: string | null
}

/** Reads the licensing of the pinned `lucide` package, whose icons are inlined. */
export function readLucidePackage(root: string): PackageLicenseSource {
  const dir = path.join(root, "node_modules", "lucide")
  const pkg = JSON.parse(
    readFileSync(path.join(dir, "package.json"), "utf8")
  ) as {
    version: string
    license?: string
  }
  const licensePath = path.join(dir, "LICENSE")
  return {
    package: "lucide",
    version: pkg.version,
    license: pkg.license ?? null,
    licenseText: existsSync(licensePath)
      ? readFileSync(licensePath, "utf8")
      : null,
  }
}

/** Fields of a preset configuration (`PresetConfig` of `shadcn/preset`). */
export const PRESET_CONFIG_KEYS = [
  "style",
  "baseColor",
  "theme",
  "chartColor",
  "iconLibrary",
  "font",
  "fontHeading",
  "radius",
  "menuAccent",
  "menuColor",
] as const

export interface PresetModuleSource {
  package: string
  version: string
  /** The browser-safe `shadcn/preset` module as one self-contained file. */
  module: string
  /** Its type declarations (`dist/preset/index.d.ts`). */
  types: string
  /** Named presets of the CLI (`--preset nova`), reduced to their configs. */
  named: Record<string, Record<string, string>>
}

/** Parses `export{a as b,...}` into `[local, exported]` pairs. */
function parseExportClause(clause: string): [string, string][] {
  return clause.split(",").map((entry) => {
    const [local, exported] = entry.trim().split(/\s+as\s+/)
    if (!local) throw new Error(`Unexpected export "${entry}"`)
    return [local, exported ?? local]
  })
}

/**
 * Joins `dist/preset/index.js`, which only re-exports a chunk, with that chunk
 * (which imports nothing) into one module with the public export names.
 */
export function composePresetModule(entry: string, chunk: string): string {
  const reexport = entry.match(/^export\{([^}]*)\}from'\.\.\/([^']+)';?\s*$/)
  if (!reexport?.[1]) {
    throw new Error("shadcn/preset no longer re-exports a single chunk")
  }
  const chunkExport = chunk.match(/export\{([^}]*)\};?\s*$/)
  if (
    !chunkExport?.[1] ||
    /\bimport\b/.test(chunk.slice(0, chunkExport.index))
  ) {
    throw new Error("The shadcn/preset chunk has imports or no export list")
  }
  const internal = new Map(
    parseExportClause(chunkExport[1]).map(([local, exported]) => [
      exported,
      local,
    ])
  )
  const exports = parseExportClause(reexport[1]).map(([letter, name]) => {
    const local = internal.get(letter)
    if (!local) throw new Error(`shadcn/preset export ${name} not found`)
    return `${local} as ${name}`
  })
  return `${chunk.slice(0, chunkExport.index)}export{${exports.join(",")}};\n`
}

/** Extracts the object literal `{nova:{…},vega:{…}}` of named presets from the CLI bundle. */
export function extractNamedPresets(
  cli: string
): Record<string, Record<string, unknown>> {
  const start = cli.search(/\{nova:\{title:"Nova"/)
  if (start < 0) throw new Error("Named presets not found in the shadcn CLI")
  let depth = 0
  let end = start
  let quoted = false
  for (; end < cli.length; end++) {
    const char = cli[end]
    if (quoted) {
      if (char === "\\") end++
      else if (char === '"') quoted = false
    } else if (char === '"') quoted = true
    else if (char === "{") depth++
    else if (char === "}" && --depth === 0) break
  }
  const literal = cli.slice(start, end + 1)
  const json = literal.replace(/([{,])([A-Za-z_$][\w$]*):/g, '$1"$2":')
  return JSON.parse(json) as Record<string, Record<string, unknown>>
}

/** Reads `shadcn/preset` and the CLI's named presets from the pinned `shadcn` package. */
export function readShadcnPreset(root: string): PresetModuleSource {
  const dir = path.join(root, "node_modules", "shadcn")
  const pkg = JSON.parse(
    readFileSync(path.join(dir, "package.json"), "utf8")
  ) as { version: string }
  const entry = readFileSync(path.join(dir, "dist/preset/index.js"), "utf8")
  const chunkFile = entry.match(/from'\.\.\/([^']+)'/)?.[1]
  if (!chunkFile) throw new Error("shadcn/preset has no chunk import")
  const chunk = readFileSync(path.join(dir, "dist", chunkFile), "utf8")
  const named: Record<string, Record<string, string>> = {}
  for (const [name, preset] of Object.entries(
    extractNamedPresets(readFileSync(path.join(dir, "dist/index.js"), "utf8"))
  )) {
    const config: Record<string, string> = {}
    for (const key of PRESET_CONFIG_KEYS) {
      const value = preset[key]
      if (typeof value !== "string") {
        throw new Error(`Named preset ${name} has no ${key}`)
      }
      config[key] = value
    }
    named[name] = config
  }
  return {
    package: "shadcn",
    version: pkg.version,
    module: composePresetModule(entry, chunk),
    types: readFileSync(path.join(dir, "dist/preset/index.d.ts"), "utf8"),
    named,
  }
}
