/**
 * Snapshots the upstream sources of the documentation site
 * (`upstream/site/`), which the generator translates into the site's
 * examples (`bun run site:generate`):
 *
 * - `docs/<component>.mdx`: the shadcn/ui docs page of each generated
 *   component (`apps/v4/content/docs/components/base/`).
 * - `examples/<name>.tsx`: the examples those pages preview
 *   (`apps/v4/examples/base/`).
 * - `home/<file>.tsx`: the cards of the shadcn/ui home page
 *   (`apps/v4/app/(app)/(root)/cards/`).
 * - `registry/<name>.json`: the base-nova `registry:example` items the create
 *   page previews, and the `example` helper they use.
 * - `create/themes.ts`, `create/base-colors.ts`: the themes and base colors
 *   the create page offers (`apps/v4/registry/`), which ui.shadcn.com/init
 *   accepts.
 *
 * The GitHub sources come from one resolved commit; a file is fetched only
 * when its blob changed. Registry examples are the same in every style apart
 * from import paths, so one style is enough. Kept apart from the component
 * snapshot so that they never reach `compatibility.json`.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { type FetchLike, fetchText } from "./fetch"
import { resolveUpstreamHead } from "./github"
import { sha256 } from "./hash"

const REPOSITORY = "shadcn-ui/ui"
const DOCS_DIR = "apps/v4/content/docs/components/base"
const EXAMPLES_DIR = "apps/v4/examples/base"
const HOME_DIR = "apps/v4/app/(app)/(root)/cards"
const CREATE_FILES = {
  "create/themes.ts": "apps/v4/registry/themes.ts",
  "create/base-colors.ts": "apps/v4/registry/base-colors.ts",
}
const REGISTRY_STYLE = "base-nova"

export interface SiteSourcesLock {
  /** shadcn-ui/ui commit of the GitHub sources. */
  commit: string
  /** Snapshot path → upstream path and git blob SHA. */
  files: Record<string, { path: string; blob: string }>
  /** Registry item → URL and SHA-256 of the served JSON. */
  registry: Record<string, { url: string; sha256: string }>
}

export interface SiteSourcesChanges {
  commit: string | null
  added: string[]
  changed: string[]
  removed: string[]
  /** Why the GitHub sources were left as they were, if they were. */
  skipped?: string
}

export interface SiteSourcesOptions {
  root: string
  /** Components the generator translates. */
  components: readonly string[]
  registryBaseUrl: string
  /** shadcn-ui/ui commit of the GitHub sources; main's head by default. */
  commit?: string | undefined
  fetchImpl?: FetchLike
  githubToken?: string | undefined
}

export class SiteSourcesStore {
  readonly dir: string

  constructor(root: string) {
    this.dir = path.join(root, "upstream", "site")
  }

  get lockFile(): string {
    return path.join(this.dir, "lock.json")
  }

  readLock(): SiteSourcesLock | null {
    if (!existsSync(this.lockFile)) return null
    return JSON.parse(readFileSync(this.lockFile, "utf8")) as SiteSourcesLock
  }

  read(file: string): string {
    return readFileSync(path.join(this.dir, file), "utf8")
  }

  readOptional(file: string): string | null {
    const full = path.join(this.dir, file)
    return existsSync(full) ? readFileSync(full, "utf8") : null
  }

  /** Snapshot files under `dir` (e.g. `examples`), without extension. */
  list(dir: string, extension: string): string[] {
    const full = path.join(this.dir, dir)
    if (!existsSync(full)) return []
    return readdirSync(full)
      .filter((file) => file.endsWith(extension))
      .map((file) => file.slice(0, -extension.length))
      .sort()
  }

  write(file: string, text: string): void {
    const full = path.join(this.dir, file)
    mkdirSync(path.dirname(full), { recursive: true })
    writeFileSync(full, text)
  }

  remove(file: string): void {
    rmSync(path.join(this.dir, file), { force: true })
  }

  writeLock(lock: SiteSourcesLock): void {
    const sorted = (record: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(record).sort(([a], [b]) => a.localeCompare(b))
      )
    this.write(
      "lock.json",
      `${JSON.stringify(
        {
          commit: lock.commit,
          files: sorted(lock.files),
          registry: sorted(lock.registry),
        },
        null,
        2
      )}\n`
    )
  }
}

/** Example names a docs page previews (`<ComponentPreview name="…" />`). */
export function previewNames(mdx: string): string[] {
  const names: string[] = []
  for (const match of mdx.matchAll(/<ComponentPreview\b([^>]*)>/g)) {
    const name = match[1]?.match(/\bname="([^"]+)"/)?.[1]
    if (name && !names.includes(name)) names.push(name)
  }
  return names
}

interface TreeEntry {
  path: string
  type: string
  sha: string
}

async function githubTree(
  commit: string,
  fetchImpl: FetchLike,
  token: string | undefined
): Promise<Map<string, string>> {
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
  }
  if (token) headers.authorization = `Bearer ${token}`
  const response = await fetchImpl(
    `https://api.github.com/repos/${REPOSITORY}/git/trees/${commit}?recursive=1`,
    { headers }
  )
  if (!response.ok) {
    throw new Error(
      `Listing ${REPOSITORY}@${commit} failed: ${response.status}`
    )
  }
  const body = (await response.json()) as {
    tree: TreeEntry[]
    truncated: boolean
  }
  if (body.truncated) throw new Error(`The tree of ${commit} is truncated`)
  return new Map(
    body.tree
      .filter((entry) => entry.type === "blob")
      .map((entry) => [entry.path, entry.sha])
  )
}

function rawUrl(commit: string, file: string): string {
  const encoded = file.split("/").map(encodeURIComponent).join("/")
  return `https://raw.githubusercontent.com/${REPOSITORY}/${commit}/${encoded}`
}

export async function syncSiteSources(
  options: SiteSourcesOptions
): Promise<SiteSourcesChanges> {
  const fetchImpl = options.fetchImpl ?? (fetch as FetchLike)
  const store = new SiteSourcesStore(options.root)
  const previous = store.readLock()
  const changes: SiteSourcesChanges = {
    commit: previous?.commit ?? null,
    added: [],
    changed: [],
    removed: [],
  }
  const lock: SiteSourcesLock = {
    commit: previous?.commit ?? "",
    files: { ...(previous?.files ?? {}) },
    registry: {},
  }

  // GitHub sources, all from one commit.
  const commit =
    options.commit ??
    (await resolveUpstreamHead({ fetchImpl, token: options.githubToken }))
  let tree: Map<string, string> | null = null
  if (!commit) {
    changes.skipped = "the shadcn-ui/ui commit could not be resolved"
  } else {
    try {
      tree = await githubTree(commit, fetchImpl, options.githubToken)
    } catch (error) {
      changes.skipped = error instanceof Error ? error.message : String(error)
    }
  }
  if (commit && tree) {
    lock.commit = commit
    changes.commit = commit
    const wanted = new Map<string, string>()
    const sources = new Map<string, string>()
    const fetchFile = async (snapshot: string, upstream: string) => {
      const blob = tree?.get(upstream)
      if (!blob) return null
      wanted.set(snapshot, upstream)
      const known = previous?.files[snapshot]
      const onDisk = store.readOptional(snapshot)
      if (known?.blob === blob && onDisk !== null) {
        lock.files[snapshot] = known
        return onDisk
      }
      const result = await fetchText(rawUrl(commit, upstream), { fetchImpl })
      if (result.status !== 200) throw new Error(`GET ${upstream} failed`)
      store.write(snapshot, result.text)
      lock.files[snapshot] = { path: upstream, blob }
      ;(known ? changes.changed : changes.added).push(snapshot)
      return result.text
    }

    for (const component of options.components) {
      const mdx = await fetchFile(
        `docs/${component}.mdx`,
        `${DOCS_DIR}/${component}.mdx`
      )
      if (mdx) sources.set(component, mdx)
    }
    for (const mdx of sources.values()) {
      for (const name of previewNames(mdx)) {
        await fetchFile(`examples/${name}.tsx`, `${EXAMPLES_DIR}/${name}.tsx`)
      }
    }
    for (const [snapshot, upstream] of Object.entries(CREATE_FILES)) {
      if (!(await fetchFile(snapshot, upstream))) {
        throw new Error(`${upstream} is not in ${REPOSITORY}@${commit}`)
      }
    }
    for (const upstream of tree.keys()) {
      if (upstream.startsWith(`${HOME_DIR}/`) && upstream.endsWith(".tsx")) {
        const file = upstream.slice(HOME_DIR.length + 1)
        if (!file.includes("/")) await fetchFile(`home/${file}`, upstream)
      }
    }
    for (const snapshot of Object.keys(lock.files)) {
      if (wanted.has(snapshot)) continue
      delete lock.files[snapshot]
      store.remove(snapshot)
      changes.removed.push(snapshot)
    }
  }

  // Registry examples of the create page, from ui.shadcn.com.
  const indexUrl = `${options.registryBaseUrl}/styles/${REGISTRY_STYLE}/registry.json`
  const index = await fetchText(indexUrl, { fetchImpl })
  if (index.status !== 200) throw new Error(`GET ${indexUrl} failed`)
  const available = new Set([...options.components, "example"])
  const items = (
    JSON.parse(index.text) as {
      items: { name: string; type: string; registryDependencies?: string[] }[]
    }
  ).items.filter(
    (item) =>
      item.name === "example" ||
      (item.type === "registry:example" &&
        (item.registryDependencies ?? []).every((dependency) =>
          available.has(dependency)
        ))
  )
  for (const item of items) {
    const url = `${options.registryBaseUrl}/styles/${REGISTRY_STYLE}/${item.name}.json`
    const result = await fetchText(url, { fetchImpl })
    if (result.status !== 200) throw new Error(`GET ${url} failed`)
    const text = `${JSON.stringify(JSON.parse(result.text), null, 2)}\n`
    const snapshot = `registry/${item.name}.json`
    const digest = sha256(text)
    const known = previous?.registry[item.name]
    if (known?.sha256 !== digest || store.readOptional(snapshot) === null) {
      store.write(snapshot, text)
      ;(known ? changes.changed : changes.added).push(snapshot)
    }
    lock.registry[item.name] = { url, sha256: digest }
  }
  for (const name of Object.keys(previous?.registry ?? {})) {
    if (lock.registry[name]) continue
    store.remove(`registry/${name}.json`)
    changes.removed.push(`registry/${name}.json`)
  }

  store.writeLock(lock)
  return changes
}

/** The site sources section of the sync report. */
export function renderSiteSourcesReport(changes: SiteSourcesChanges): string {
  const lines = ["## Documentation site sources", ""]
  if (changes.skipped) {
    lines.push(`GitHub sources were kept: ${changes.skipped}.`, "")
  } else if (changes.commit) {
    lines.push(`GitHub sources: shadcn-ui/ui@${changes.commit}.`, "")
  }
  const list = (label: string, files: string[]) => {
    if (files.length === 0) return
    lines.push(`${label} (${files.length}):`, "")
    for (const file of files.slice(0, 50)) lines.push(`- \`${file}\``)
    if (files.length > 50) lines.push(`- … and ${files.length - 50} more`)
    lines.push("")
  }
  list("Added", changes.added)
  list("Changed", changes.changed)
  list("Removed", changes.removed)
  if (
    changes.added.length + changes.changed.length + changes.removed.length ===
    0
  ) {
    lines.push("No changes.", "")
  }
  lines.push(
    "Run `bun run site:generate` and check the site's examples (`bun run site:build`).",
    ""
  )
  return lines.join("\n")
}
