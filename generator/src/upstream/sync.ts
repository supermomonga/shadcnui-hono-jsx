import { existsSync, readFileSync } from "node:fs"
import { type GeneratorConfig, indexUrl, itemUrl } from "../config"
import { type FetchLike, fetchText } from "./fetch"
import { resolveUpstreamHead } from "./github"
import { contentSha256, sha256, toJsonText } from "./hash"
import { emptyLock, type ResourceLock } from "./lock"
import type { UpstreamStore } from "./store"
import {
  assertThemeItem,
  assertUpstreamItem,
  parseIndex,
  type UpstreamIndex,
  type UpstreamItem,
} from "./types"

export interface VendoredSource {
  package: string
  version: string
  file: string
  text: string
  /** `license` field of the package's package.json. */
  license: string | null
  /** The package's LICENSE.md, if present. */
  licenseText: string | null
}

export interface SyncOptions {
  config: GeneratorConfig
  store: UpstreamStore
  /** The `tailwind.css` shipped by the pinned `shadcn` package. */
  tailwindCss: VendoredSource
  fetchImpl?: FetchLike
  githubToken?: string | undefined
  now?: () => Date
  concurrency?: number
}

export interface ItemChange {
  name: string
  before: UpstreamItem | null
  after: UpstreamItem | null
}

export interface TextChange {
  before: string | null
  after: string
}

export interface SyncResult {
  added: ItemChange[]
  changed: ItemChange[]
  removed: ItemChange[]
  unchanged: string[]
  indexChanged: boolean
  themeChanged: boolean
  tailwindCssChanged: boolean
  /** Canonical theme JSON before/after, when it changed. */
  theme: TextChange | null
  /** Vendored tailwind.css before/after (with package versions), when it changed. */
  tailwindCss:
    | (TextChange & { fromVersion: string | null; toVersion: string })
    | null
  /** Upstream repository LICENSE.md before/after, when it changed. */
  license: TextChange | null
  /** Vendored package licensing before/after, when it changed. */
  packageLicense:
    | (TextChange & { fromLicense: string | null; toLicense: string | null })
    | null
  lockChanged: boolean
}

function etagFor(entry: ResourceLock | null | undefined, file: string) {
  return entry && existsSync(file) ? entry.etag : null
}

async function mapLimit<T>(
  values: readonly T[],
  limit: number,
  fn: (value: T) => Promise<void>
): Promise<void> {
  let next = 0
  const worker = async () => {
    while (next < values.length) {
      const value = values[next++] as T
      await fn(value)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, worker)
  )
}

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name)

/**
 * Updates the committed upstream snapshot. Lock entries change only when the
 * canonical content of a resource changes, so repeated syncs without upstream
 * changes produce no diff.
 */
export async function syncUpstream(options: SyncOptions): Promise<SyncResult> {
  const { config, store, fetchImpl } = options
  const now = (options.now ?? (() => new Date()))().toISOString()
  const lock =
    store.readLock() ?? emptyLock(config.style, config.registryBaseUrl)
  lock.style = config.style
  lock.registryBaseUrl = config.registryBaseUrl

  let head: Promise<string | null> | undefined
  const upstreamHead = () => {
    head ??= resolveUpstreamHead({ fetchImpl, token: options.githubToken })
    return head
  }

  // Index: the tracked subset of the style's registry.json.
  const idxUrl = indexUrl(config)
  const idxResult = await fetchText(idxUrl, {
    etag: etagFor(lock.index, store.indexFile),
    fetchImpl,
  })
  let index: UpstreamIndex
  let indexChanged = false
  if (idxResult.status === 304) {
    index = store.readIndex()
  } else {
    const entries = parseIndex(JSON.parse(idxResult.text), idxUrl)
      .filter((entry) => config.trackedTypes.includes(entry.type))
      .sort(byName)
    index = { style: config.style, items: entries }
    const text = toJsonText(index)
    const hash = sha256(text)
    if (lock.index?.sha256 !== hash || !existsSync(store.indexFile)) {
      store.writeText(store.indexFile, text)
      lock.index = {
        url: idxUrl,
        sha256: hash,
        etag: idxResult.etag,
        lastModified: idxResult.lastModified,
        fetchedAt: now,
      }
      indexChanged = true
    }
  }

  // Items.
  const added: ItemChange[] = []
  const changed: ItemChange[] = []
  const unchanged: string[] = []
  await mapLimit(index.items, options.concurrency ?? 6, async ({ name }) => {
    const url = itemUrl(config, name)
    const file = store.itemFile(name)
    const result = await fetchText(url, {
      etag: etagFor(lock.items[name], file),
      fetchImpl,
    })
    if (result.status === 304) {
      unchanged.push(name)
      return
    }
    const value: unknown = JSON.parse(result.text)
    assertUpstreamItem(value, url)
    const text = toJsonText(value)
    const hash = sha256(text)
    if (lock.items[name]?.sha256 === hash && existsSync(file)) {
      unchanged.push(name)
      return
    }
    const before = existsSync(file) ? store.readItem(name) : null
    store.writeText(file, text)
    lock.items[name] = {
      url,
      type: value.type,
      sha256: hash,
      contentSha256: contentSha256(value),
      etag: result.etag,
      lastModified: result.lastModified,
      fetchedAt: now,
      upstreamCommit: await upstreamHead(),
    }
    ;(before ? changed : added).push({ name, before, after: value })
  })

  // Items that disappeared upstream (or are no longer tracked).
  const tracked = new Set(index.items.map((entry) => entry.name))
  const removed: ItemChange[] = []
  const stale = new Set([...Object.keys(lock.items), ...store.listItems()])
  for (const name of [...stale].sort()) {
    if (tracked.has(name)) continue
    const before = store.hasItem(name) ? store.readItem(name) : null
    store.removeItem(name)
    delete lock.items[name]
    removed.push({ name, before, after: null })
  }

  // Theme.
  let themeChanged = false
  let themeChange: TextChange | null = null
  const themeResult = await fetchText(config.themeUrl, {
    etag: etagFor(lock.theme, store.themeFile),
    fetchImpl,
  })
  if (themeResult.status === 200) {
    const value: unknown = JSON.parse(themeResult.text)
    assertThemeItem(value, config.themeUrl)
    const text = toJsonText(value)
    const hash = sha256(text)
    if (lock.theme?.sha256 !== hash || !existsSync(store.themeFile)) {
      const before = existsSync(store.themeFile)
        ? readFileSync(store.themeFile, "utf8")
        : null
      themeChange = { before, after: text }
      store.writeText(store.themeFile, text)
      lock.theme = {
        url: config.themeUrl,
        sha256: hash,
        etag: themeResult.etag,
        lastModified: themeResult.lastModified,
        fetchedAt: now,
      }
      themeChanged = true
    }
  }

  // Upstream repository license: snapshotted for review, never redistributed.
  let licenseChange: TextChange | null = null
  const licenseResult = await fetchText(config.licenseUrl, {
    etag: etagFor(lock.license, store.licenseFile),
    fetchImpl,
  })
  if (licenseResult.status === 200) {
    const hash = sha256(licenseResult.text)
    if (lock.license?.sha256 !== hash || !existsSync(store.licenseFile)) {
      licenseChange = {
        before: store.readOptional(store.licenseFile),
        after: licenseResult.text,
      }
      store.writeText(store.licenseFile, licenseResult.text)
      lock.license = {
        url: config.licenseUrl,
        sha256: hash,
        etag: licenseResult.etag,
        lastModified: licenseResult.lastModified,
        fetchedAt: now,
      }
    }
  }

  // Vendored shadcn/tailwind.css from the pinned `shadcn` package.
  const css = options.tailwindCss
  const cssHash = sha256(css.text)
  let tailwindCssChanged = false
  let tailwindCssChange: SyncResult["tailwindCss"] = null
  if (
    lock.tailwindCss?.sha256 !== cssHash ||
    lock.tailwindCss.version !== css.version ||
    !existsSync(store.tailwindCssFile)
  ) {
    tailwindCssChange = {
      before: existsSync(store.tailwindCssFile)
        ? store.readTailwindCss()
        : null,
      after: css.text,
      fromVersion: lock.tailwindCss?.version ?? null,
      toVersion: css.version,
    }
    store.writeText(store.tailwindCssFile, css.text)
    tailwindCssChanged = true
  }
  const packageLicenseText = css.licenseText ?? ""
  const packageLicenseSha =
    css.licenseText === null ? null : sha256(css.licenseText)
  let packageLicenseChange: SyncResult["packageLicense"] = null
  if (
    lock.tailwindCss?.license !== css.license ||
    lock.tailwindCss?.licenseSha256 !== packageLicenseSha ||
    !existsSync(store.packageLicenseFile)
  ) {
    packageLicenseChange = {
      before: store.readOptional(store.packageLicenseFile),
      after: packageLicenseText,
      fromLicense: lock.tailwindCss?.license ?? null,
      toLicense: css.license,
    }
    store.writeText(store.packageLicenseFile, packageLicenseText)
  }
  if (tailwindCssChanged || packageLicenseChange) {
    lock.tailwindCss = {
      package: css.package,
      version: css.version,
      file: css.file,
      sha256: cssHash,
      license: css.license,
      licenseSha256: packageLicenseSha,
    }
  }

  const lockChanged = store.writeLock(lock)
  return {
    added: added.sort(byName),
    changed: changed.sort(byName),
    removed,
    unchanged: unchanged.sort(),
    indexChanged,
    themeChanged,
    tailwindCssChanged,
    theme: themeChange,
    tailwindCss: tailwindCssChange,
    license: licenseChange,
    packageLicense: packageLicenseChange,
    lockChanged,
  }
}
