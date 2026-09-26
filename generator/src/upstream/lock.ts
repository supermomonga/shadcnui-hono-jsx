import { existsSync, readFileSync } from "node:fs"
import { toJsonText } from "./hash"

export interface ResourceLock {
  url: string
  /** sha256 of the canonical JSON/CSS text stored in the snapshot. */
  sha256: string
  etag: string | null
  lastModified: string | null
  fetchedAt: string
}

export interface ItemLock extends ResourceLock {
  type: string
  /** sha256 over file paths and contents (see `contentSha256`). */
  contentSha256: string
  /** Best-effort `shadcn-ui/ui` main commit observed when the item last changed. */
  upstreamCommit: string | null
}

export interface VendoredLock {
  package: string
  version: string
  file: string
  sha256: string
  /** `license` field of the package's package.json. */
  license: string | null
  /** sha256 of the package's LICENSE.md. */
  licenseSha256: string | null
}

/** An npm package whose content is inlined into generated sources (monitored licensing). */
export interface PackageLock {
  package: string
  version: string
  license: string | null
  licenseSha256: string | null
}

/** The `shadcn/preset` module and named presets vendored from the pinned package. */
export interface PresetLock {
  package: string
  version: string
  /** sha256 of the module, its types and the named presets as stored. */
  sha256: string
}

/** The snapshot of one style: its index and items. */
export interface StyleLock {
  index: ResourceLock | null
  items: Record<string, ItemLock>
}

export interface UpstreamLock {
  schemaVersion: 2
  registryBaseUrl: string
  /** Snapshotted styles (`base-nova`, …), by name. */
  styles: Record<string, StyleLock>
  /** Theme of the CLI's default preset (docs/adr/0029). */
  theme: ResourceLock | null
  /** `registry:font` items the theme depends on, by name. */
  fonts: Record<string, ResourceLock>
  /** Upstream repository license (monitored, see generator/src/licenses.ts). */
  license: ResourceLock | null
  tailwindCss: VendoredLock | null
  /** Icon packages inlined by the generator, by library (docs/adr/0031). */
  icons: Record<string, PackageLock>
  preset: PresetLock | null
}

export function emptyLock(registryBaseUrl: string): UpstreamLock {
  return {
    schemaVersion: 2,
    registryBaseUrl,
    styles: {},
    theme: null,
    fonts: {},
    license: null,
    tailwindCss: null,
    icons: {},
    preset: null,
  }
}

/** The lock of one style, created empty when the style is new. */
export function styleLock(lock: UpstreamLock, style: string): StyleLock {
  let entry = lock.styles[style]
  if (!entry) {
    entry = { index: null, items: {} }
    lock.styles[style] = entry
  }
  return entry
}

/** The single-style lock written before styles were snapshotted together. */
interface UpstreamLockV1
  extends Omit<UpstreamLock, "schemaVersion" | "styles"> {
  schemaVersion: 1
  style: string
  index: ResourceLock | null
  items: Record<string, ItemLock>
}

export function readLock(file: string): UpstreamLock | null {
  if (!existsSync(file)) return null
  const value = JSON.parse(readFileSync(file, "utf8")) as
    | UpstreamLock
    | UpstreamLockV1
  if (value.schemaVersion === 1) {
    const { style, index, items, schemaVersion: _, ...shared } = value
    return {
      ...shared,
      schemaVersion: 2,
      styles: { [style]: { index, items } },
      fonts: shared.fonts ?? {},
      preset: shared.preset ?? null,
      icons:
        shared.icons && "package" in shared.icons
          ? { lucide: shared.icons as unknown as PackageLock }
          : (shared.icons ?? {}),
    }
  }
  if (value.schemaVersion !== 2) {
    throw new Error(`Unsupported upstream lock schemaVersion in ${file}`)
  }
  // A single icon package (Lucide) before other libraries were inlined.
  const icons = value.icons as unknown as
    | PackageLock
    | Record<string, PackageLock>
    | null
  value.icons =
    icons === null
      ? {}
      : "package" in icons
        ? { lucide: icons as PackageLock }
        : icons
  return value
}

function serializeItems(
  items: Record<string, ItemLock>
): Record<string, ItemLock> {
  const sorted: Record<string, ItemLock> = {}
  for (const name of Object.keys(items).sort()) {
    const item = items[name]
    if (!item) continue
    sorted[name] = {
      url: item.url,
      type: item.type,
      sha256: item.sha256,
      contentSha256: item.contentSha256,
      etag: item.etag,
      lastModified: item.lastModified,
      fetchedAt: item.fetchedAt,
      upstreamCommit: item.upstreamCommit,
    }
  }
  return sorted
}

/** Serializes the lock with a stable key order so unchanged syncs produce no diff. */
export function serializeLock(lock: UpstreamLock): string {
  return toJsonText({
    schemaVersion: lock.schemaVersion,
    registryBaseUrl: lock.registryBaseUrl,
    theme: lock.theme,
    fonts: Object.fromEntries(
      Object.keys(lock.fonts ?? {})
        .sort()
        .map((name) => [name, lock.fonts[name]])
    ),
    license: lock.license ?? null,
    tailwindCss: lock.tailwindCss
      ? {
          package: lock.tailwindCss.package,
          version: lock.tailwindCss.version,
          file: lock.tailwindCss.file,
          sha256: lock.tailwindCss.sha256,
          license: lock.tailwindCss.license ?? null,
          licenseSha256: lock.tailwindCss.licenseSha256 ?? null,
        }
      : null,
    icons: Object.fromEntries(
      Object.keys(lock.icons ?? {})
        .sort()
        .map((library) => [library, lock.icons[library]])
    ),
    preset: lock.preset ?? null,
    styles: Object.fromEntries(
      Object.keys(lock.styles)
        .sort()
        .map((style) => {
          const entry = lock.styles[style] as StyleLock
          return [
            style,
            { index: entry.index, items: serializeItems(entry.items) },
          ]
        })
    ),
  })
}
