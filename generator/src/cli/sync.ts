import { appendFileSync, writeFileSync } from "node:fs"
import { parseArgs } from "node:util"
import { encodePreset, type PresetConfig } from "shadcn/preset"
import { DEFAULT_PRESET, initUrl } from "../../../cli/src/shadcn"
import { config } from "../../../generator.config"
import { COMPONENT_ADAPTERS } from "../adapters/components"
import { type ClassificationKind, classify } from "../analyzer/classify"
import { collectFacts } from "../analyzer/facts"
import { checkUpstreamLicenses } from "../licenses"
import { ROOT } from "../paths"
import { type ClassificationChange, renderSyncReport } from "../upstream/report"
import { UpstreamStore } from "../upstream/store"
import { syncUpstream } from "../upstream/sync"
import {
  readLucidePackage,
  readShadcnPreset,
  readShadcnTailwindCss,
} from "../upstream/vendored"

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: { report: { type: "string" } },
})

const store = new UpstreamStore(ROOT, config.style)
const classifyAll = () =>
  new Map<string, ClassificationKind>(
    store.listItems().map((name) => [
      name,
      classify(collectFacts(store.readItem(name)), COMPONENT_ADAPTERS, {
        available: new Set(config.components),
      }).kind,
    ])
  )

// The theme snapshot is what the CLI fetches for its default preset.
const preset = readShadcnPreset(ROOT)
const defaults = preset.named[DEFAULT_PRESET] as PresetConfig | undefined
if (!defaults) throw new Error(`The shadcn CLI has no ${DEFAULT_PRESET} preset`)
const themeUrl = initUrl(
  { code: encodePreset(defaults), config: defaults },
  { rtl: false, pointer: false }
)

const before = classifyAll()
const result = await syncUpstream({
  config,
  store,
  themeUrl,
  preset,
  tailwindCss: readShadcnTailwindCss(ROOT),
  icons: readLucidePackage(ROOT),
  githubToken: process.env.GITHUB_TOKEN,
})
const after = classifyAll()

const list = (label: string, names: string[]) => {
  if (names.length > 0)
    console.log(`${label} (${names.length}): ${names.join(", ")}`)
}
list(
  "added",
  result.added.map((c) => c.name)
)
list(
  "changed",
  result.changed.map((c) => c.name)
)
list(
  "removed",
  result.removed.map((c) => c.name)
)
console.log(`unchanged: ${result.unchanged.length}`)
if (result.indexChanged) console.log("index changed")
if (result.themeChanged) console.log("theme changed")
if (result.fontsChanged.length > 0)
  console.log(`fonts changed: ${result.fontsChanged.join(", ")}`)
if (result.presetChanged) console.log("vendored shadcn/preset changed")
if (result.tailwindCssChanged) console.log("vendored tailwind.css changed")
console.log(
  result.lockChanged
    ? "upstream/lock.json updated"
    : "upstream snapshot is up to date"
)

const licenseProblems = checkUpstreamLicenses(
  store.readLock() ?? emptyLockError(),
  {
    repository: store.readOptional(store.licenseFile),
    package: store.readOptional(store.packageLicenseFile),
    icons: store.readOptional(store.iconLicenseFile),
  }
)
if (licenseProblems.length > 0) {
  console.warn("Upstream licensing differs from the reviewed record:")
  for (const problem of licenseProblems) console.warn(`  - ${problem}`)
}
// Lets the upstream-check workflow label the PR for license review.
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `license_review=${licenseProblems.length > 0 ? "true" : "false"}\n`
  )
}

if (values.report) {
  const names = [...new Set([...before.keys(), ...after.keys()])].sort()
  const classifications: ClassificationChange[] = names.map((name) => ({
    name,
    before: before.get(name) ?? null,
    after: after.get(name) ?? null,
  }))
  writeFileSync(
    values.report,
    renderSyncReport({
      style: config.style,
      result,
      classifications,
      generated: config.components,
      licenseProblems,
    })
  )
  console.log(`report written to ${values.report}`)
}

function emptyLockError(): never {
  throw new Error("upstream/lock.json was not written")
}
