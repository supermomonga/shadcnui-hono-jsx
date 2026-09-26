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

export interface UpstreamLock {
  schemaVersion: 1
  style: string
  registryBaseUrl: string
  index: ResourceLock | null
  theme: ResourceLock | null
  /** `registry:font` items the theme depends on, by name. */
  fonts: Record<string, ResourceLock>
  /** Upstream repository license (monitored, see generator/src/licenses.ts). */
  license: ResourceLock | null
  tailwindCss: VendoredLock | null
  /** Icon package inlined by the generator (lucide). */
  icons: PackageLock | null
  preset: PresetLock | null
  items: Record<string, ItemLock>
}

export function emptyLock(
  style: string,
  registryBaseUrl: string
): UpstreamLock {
  return {
    schemaVersion: 1,
    style,
    registryBaseUrl,
    index: null,
    theme: null,
    fonts: {},
    license: null,
    tailwindCss: null,
    icons: null,
    preset: null,
    items: {},
  }
}

export function readLock(file: string): UpstreamLock | null {
  if (!existsSync(file)) return null
  const lock = JSON.parse(readFileSync(file, "utf8")) as UpstreamLock
  lock.fonts ??= {}
  lock.preset ??= null
  if (lock.schemaVersion !== 1) {
    throw new Error(`Unsupported upstream lock schemaVersion in ${file}`)
  }
  return lock
}

/** Serializes the lock with a stable key order so unchanged syncs produce no diff. */
export function serializeLock(lock: UpstreamLock): string {
  const items: Record<string, ItemLock> = {}
  for (const name of Object.keys(lock.items).sort()) {
    const item = lock.items[name]
    if (!item) continue
    items[name] = {
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
  return toJsonText({
    schemaVersion: lock.schemaVersion,
    style: lock.style,
    registryBaseUrl: lock.registryBaseUrl,
    index: lock.index,
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
    icons: lock.icons ?? null,
    preset: lock.preset ?? null,
    items,
  })
}
