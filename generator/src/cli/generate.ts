import { parseArgs } from "node:util"
import { config } from "../../../generator.config"
import { writeOutputs } from "../emit/write"
import { COMPONENTS_DIR, GenerationError, generateComponent } from "../generate"
import { ROOT } from "../paths"
import { UpstreamStore } from "../upstream/store"

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: { check: { type: "boolean", default: false } },
  allowPositionals: true,
})

const unknown = positionals.filter((name) => !config.components.includes(name))
if (unknown.length > 0) {
  console.error(`Not configured in generator.config.ts: ${unknown.join(", ")}`)
  process.exit(1)
}

const store = new UpstreamStore(ROOT, config.style)
const lock = store.readLock()
if (!lock) {
  console.error(
    "upstream/lock.json is missing; run `bun run upstream:sync` first."
  )
  process.exit(1)
}

const selected = positionals.length > 0 ? positionals : [...config.components]
const files = []
const errors: string[] = []
for (const name of selected) {
  try {
    files.push(generateComponent(name, { config, store, lock }).file)
  } catch (error) {
    if (!(error instanceof GenerationError)) throw error
    errors.push(error.message)
  }
}
if (errors.length > 0) {
  for (const message of errors) console.error(message)
  process.exit(1)
}

const full = positionals.length === 0
const result = writeOutputs(ROOT, files, {
  check: values.check,
  prune: full ? [{ dir: COMPONENTS_DIR, extension: ".tsx" }] : [],
})

if (values.check) {
  if (result.stale.length > 0) {
    console.error(
      `Generated files are out of date:\n  ${result.stale.join("\n  ")}`
    )
    console.error("Run `bun run generate` and commit the result.")
    process.exit(1)
  }
  console.log("Generated files are up to date.")
} else {
  for (const file of result.written) console.log(`wrote ${file}`)
  for (const file of result.deleted) console.log(`deleted ${file}`)
  if (result.written.length + result.deleted.length === 0)
    console.log("No changes.")
}
