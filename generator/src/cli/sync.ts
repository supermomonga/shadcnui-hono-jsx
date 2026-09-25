import { config } from "../../../generator.config"
import { ROOT } from "../paths"
import { UpstreamStore } from "../upstream/store"
import { syncUpstream } from "../upstream/sync"
import { readShadcnTailwindCss } from "../upstream/vendored"

const store = new UpstreamStore(ROOT, config.style)
const result = await syncUpstream({
  config,
  store,
  tailwindCss: readShadcnTailwindCss(ROOT),
  githubToken: process.env.GITHUB_TOKEN,
})

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
