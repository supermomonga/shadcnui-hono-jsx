import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { readLock, serializeLock, type UpstreamLock } from "./lock"
import {
  assertThemeItem,
  assertUpstreamItem,
  type ThemeItem,
  type UpstreamIndex,
  type UpstreamItem,
} from "./types"

/** Read/write access to the committed upstream snapshot (`upstream/`). */
export class UpstreamStore {
  readonly dir: string

  constructor(
    root: string,
    readonly style: string
  ) {
    this.dir = path.join(root, "upstream")
  }

  /** A store for another style, sharing the snapshot directory. */
  forStyle(style: string): UpstreamStore {
    return new UpstreamStore(path.dirname(this.dir), style)
  }

  get lockFile(): string {
    return path.join(this.dir, "lock.json")
  }

  get styleDir(): string {
    return path.join(this.dir, this.style)
  }

  get indexFile(): string {
    return path.join(this.styleDir, "index.json")
  }

  get themeFile(): string {
    return path.join(this.styleDir, "theme.json")
  }

  get tailwindCssFile(): string {
    return path.join(this.styleDir, "shadcn-tailwind.css")
  }

  /** The pinned `shadcn` package's `shadcn/preset` module, as one file. */
  get presetModuleFile(): string {
    return path.join(this.dir, "shadcn-package", "preset.js")
  }

  get presetTypesFile(): string {
    return path.join(this.dir, "shadcn-package", "preset.d.ts")
  }

  /** Named presets of the pinned shadcn CLI (`--preset nova`). */
  get namedPresetsFile(): string {
    return path.join(this.dir, "shadcn-package", "named-presets.json")
  }

  /** A `registry:font` item the theme depends on. */
  fontFile(name: string): string {
    return path.join(this.styleDir, "fonts", `${name}.json`)
  }

  /** Upstream repository LICENSE.md (monitored only). */
  get licenseFile(): string {
    return path.join(this.dir, "licenses", "shadcn-ui.LICENSE.md")
  }

  /** LICENSE.md of the vendored npm package (monitored only). */
  get packageLicenseFile(): string {
    return path.join(this.dir, "licenses", "shadcn-package.LICENSE.md")
  }

  /** The license of an icon package (monitored only). */
  iconLicenseFile(library: string): string {
    return path.join(this.dir, "licenses", `${library}.LICENSE`)
  }

  readOptional(file: string): string | null {
    return existsSync(file) ? readFileSync(file, "utf8") : null
  }

  itemFile(name: string): string {
    return path.join(this.styleDir, "items", `${name}.json`)
  }

  readLock(): UpstreamLock | null {
    return readLock(this.lockFile)
  }

  writeLock(lock: UpstreamLock): boolean {
    return this.writeText(this.lockFile, serializeLock(lock))
  }

  hasItem(name: string): boolean {
    return existsSync(this.itemFile(name))
  }

  readItem(name: string): UpstreamItem {
    const file = this.itemFile(name)
    const value: unknown = JSON.parse(readFileSync(file, "utf8"))
    assertUpstreamItem(value, file)
    return value
  }

  listItems(): string[] {
    const dir = path.join(this.styleDir, "items")
    if (!existsSync(dir)) return []
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.slice(0, -".json".length))
      .sort()
  }

  removeItem(name: string): void {
    rmSync(this.itemFile(name), { force: true })
  }

  readIndex(): UpstreamIndex {
    return JSON.parse(readFileSync(this.indexFile, "utf8")) as UpstreamIndex
  }

  readTheme(): ThemeItem {
    const value: unknown = JSON.parse(readFileSync(this.themeFile, "utf8"))
    assertThemeItem(value, this.themeFile)
    return value
  }

  readFont(name: string): unknown {
    return JSON.parse(readFileSync(this.fontFile(name), "utf8"))
  }

  readNamedPresets(): Record<string, Record<string, string>> {
    return JSON.parse(readFileSync(this.namedPresetsFile, "utf8"))
  }

  readTailwindCss(): string {
    return readFileSync(this.tailwindCssFile, "utf8")
  }

  /** Writes `text` if it differs from the current file. Returns whether it wrote. */
  writeText(file: string, text: string): boolean {
    if (existsSync(file) && readFileSync(file, "utf8") === text) return false
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, text)
    return true
  }
}
