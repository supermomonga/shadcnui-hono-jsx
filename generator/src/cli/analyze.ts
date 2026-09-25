import { parseArgs } from "node:util"
import { config } from "../../../generator.config"
import { COMPONENT_ADAPTERS } from "../adapters/components"
import { classify } from "../analyzer/classify"
import { collectFacts } from "../analyzer/facts"
import { reasonKey } from "../analyzer/reasons"
import { ROOT } from "../paths"
import { UpstreamStore } from "../upstream/store"

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: { json: { type: "boolean", default: false } },
  allowPositionals: true,
})

const store = new UpstreamStore(ROOT, config.style)
const names = positionals.length > 0 ? positionals : store.listItems()
const results = names.map((name) => {
  const classification = classify(
    collectFacts(store.readItem(name)),
    COMPONENT_ADAPTERS
  )
  return { name, target: config.components.includes(name), ...classification }
})

if (values.json) {
  console.log(JSON.stringify(results, null, 2))
} else {
  for (const r of results) {
    const blocking = r.reasons.filter((x) => x.blocking).map(reasonKey)
    const mark = r.target ? "*" : " "
    console.log(
      `${mark} ${r.name.padEnd(18)} ${r.kind.padEnd(15)} ${blocking.join(", ")}`
    )
  }
}
