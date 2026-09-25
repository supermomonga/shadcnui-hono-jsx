import { existsSync } from "node:fs"
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

export interface SyncResult {
  added: ItemChange[]
  changed: ItemChange[]
  removed: ItemChange[]
  unchanged: string[]
  indexChanged: boolean
  themeChanged: boolean
  tailwindCssChanged: boolean
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

  // Vendored shadcn/tailwind.css from the pinned `shadcn` package.
  const css = options.tailwindCss
  const cssHash = sha256(css.text)
  let tailwindCssChanged = false
  if (
    lock.tailwindCss?.sha256 !== cssHash ||
    lock.tailwindCss.version !== css.version ||
    !existsSync(store.tailwindCssFile)
  ) {
    store.writeText(store.tailwindCssFile, css.text)
    lock.tailwindCss = {
      package: css.package,
      version: css.version,
      file: css.file,
      sha256: cssHash,
    }
    tailwindCssChanged = true
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
    lockChanged,
  }
}
