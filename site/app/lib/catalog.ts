import catalog from "../../../cli/generated/catalog.json"
import cliPackage from "../../../cli/package.json"
import compatibility from "../../../compatibility.json"

export interface CompatibilityRow {
  name: string
  status: string
  clientJs: string
  knownDifferences: string[]
  upstream?: { url?: string }
  basedOn?: { name: string }[]
}

export interface ComponentEntry {
  name: string
  title: string
  kind: "port" | "lite"
  /** Client scripts, besides `core`, the item's components load. */
  scripts: string[]
  compatibility: CompatibilityRow | undefined
  /** Not in the latest CLI release on npm. */
  unreleased: boolean
}

interface Release {
  version: string
  items: string[]
}

/** Written by scripts/release.ts at build time; absent when npm was unreachable. */
const releaseFiles = import.meta.glob<Release>("../../.cache/release.json", {
  eager: true,
  import: "default",
})
export const release: Release | undefined = Object.values(releaseFiles)[0]

export const CLI_VERSION = cliPackage.version

const WORDS: Record<string, string> = { otp: "OTP", ui: "UI" }

export function titleOf(name: string): string {
  const lite = name.endsWith("-lite")
  const words = (lite ? name.slice(0, -"-lite".length) : name)
    .split("-")
    .map((word) => WORDS[word] ?? word[0]?.toUpperCase() + word.slice(1))
  return `${words.join(" ")}${lite ? " (Lite)" : ""}`
}

const rows = new Map<string, CompatibilityRow>(
  [
    ...(compatibility.components as CompatibilityRow[]),
    ...(compatibility.alternatives as CompatibilityRow[]),
  ].map((row) => [row.name, row])
)

export const components: ComponentEntry[] = catalog.items
  .map((item) => ({
    name: item.name,
    title: titleOf(item.name),
    kind: item.kind as "port" | "lite",
    scripts: item.scripts.filter((script) => script !== "core"),
    compatibility: rows.get(item.name),
    unreleased: release ? !release.items.includes(item.name) : false,
  }))
  .sort((a, b) => a.title.localeCompare(b.title))

export function findComponent(name: string): ComponentEntry | undefined {
  return components.find((entry) => entry.name === name)
}

/** Upstream components this project does not provide yet. */
export const unsupported = (compatibility.components as CompatibilityRow[])
  .filter((row) => row.status === "unsupported")
  .map((row) => row.name)
