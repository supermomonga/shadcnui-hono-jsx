import { writeFileSync } from "node:fs"
import { parseArgs } from "node:util"
import { config } from "../../../generator.config"
import { COMPONENT_ADAPTERS } from "../adapters/components"
import { type ClassificationKind, classify } from "../analyzer/classify"
import { collectFacts } from "../analyzer/facts"
import { ROOT } from "../paths"
import { type ClassificationChange, renderSyncReport } from "../upstream/report"
import { UpstreamStore } from "../upstream/store"
import { syncUpstream } from "../upstream/sync"
import { readShadcnTailwindCss } from "../upstream/vendored"

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: { report: { type: "string" } },
})

const store = new UpstreamStore(ROOT, config.style)
const classifyAll = () =>
  new Map<string, ClassificationKind>(
    store
      .listItems()
      .map((name) => [
        name,
        classify(collectFacts(store.readItem(name)), COMPONENT_ADAPTERS).kind,
      ])
  )

const before = classifyAll()
const result = await syncUpstream({
  config,
  store,
  tailwindCss: readShadcnTailwindCss(ROOT),
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
if (result.tailwindCssChanged) console.log("vendored tailwind.css changed")
console.log(
  result.lockChanged
    ? "upstream/lock.json updated"
    : "upstream snapshot is up to date"
)

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
    })
  )
  console.log(`report written to ${values.report}`)
}
