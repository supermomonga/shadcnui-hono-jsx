export interface UpstreamFile {
  path: string
  type: string
  content: string
  target?: string
}

/** A built registry item as served by ui.shadcn.com (`/r/styles/<style>/<name>.json`). */
export interface UpstreamItem {
  name: string
  type: string
  dependencies?: string[]
  devDependencies?: string[]
  registryDependencies?: string[]
  /** Absent for placeholder items (e.g. `form`). */
  files?: UpstreamFile[]
  [key: string]: unknown
}

export interface IndexEntry {
  name: string
  type: string
}

/** The tracked subset of the upstream style index. */
export interface UpstreamIndex {
  style: string
  items: IndexEntry[]
}

export type CssVars = Record<string, string>

/** The upstream `registry:base` theme item for a style. */
export interface ThemeItem {
  name: string
  type: string
  cssVars: { theme?: CssVars; light?: CssVars; dark?: CssVars }
  css?: Record<string, unknown>
  [key: string]: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string")
}

export function assertUpstreamItem(
  value: unknown,
  source: string
): asserts value is UpstreamItem {
  const fail = (reason: string): never => {
    throw new Error(`Invalid upstream item from ${source}: ${reason}`)
  }
  if (!isRecord(value)) fail("not an object")
  const item = value as Record<string, unknown>
  if (typeof item.name !== "string") fail("missing name")
  if (typeof item.type !== "string") fail("missing type")
  for (const key of [
    "dependencies",
    "devDependencies",
    "registryDependencies",
  ]) {
    if (item[key] !== undefined && !isStringArray(item[key])) {
      fail(`${key} is not a string array`)
    }
  }
  if (item.files !== undefined && !Array.isArray(item.files)) {
    fail("files is not an array")
  }
  for (const file of (item.files ?? []) as unknown[]) {
    if (
      !isRecord(file) ||
      typeof file.path !== "string" ||
      typeof file.type !== "string" ||
      typeof file.content !== "string"
    ) {
      fail("file entry without path/type/content")
    }
  }
}

export function assertThemeItem(
  value: unknown,
  source: string
): asserts value is ThemeItem {
  const fail = (reason: string): never => {
    throw new Error(`Invalid upstream theme from ${source}: ${reason}`)
  }
  if (!isRecord(value)) fail("not an object")
  const item = value as Record<string, unknown>
  if (typeof item.name !== "string") fail("missing name")
  if (!isRecord(item.cssVars)) fail("missing cssVars")
  for (const [mode, vars] of Object.entries(item.cssVars as object)) {
    if (
      !isRecord(vars) ||
      !Object.values(vars).every((v) => typeof v === "string")
    ) {
      fail(`cssVars.${mode} is not a string map`)
    }
  }
  if (item.css !== undefined && !isRecord(item.css))
    fail("css is not an object")
}

export function parseIndex(value: unknown, source: string): IndexEntry[] {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error(`Invalid upstream index from ${source}: missing items`)
  }
  return value.items.map((entry, i) => {
    if (
      !isRecord(entry) ||
      typeof entry.name !== "string" ||
      typeof entry.type !== "string"
    ) {
      throw new Error(`Invalid upstream index from ${source}: items[${i}]`)
    }
    return { name: entry.name, type: entry.type }
  })
}
