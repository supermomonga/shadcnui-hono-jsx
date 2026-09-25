import { readFileSync } from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"
import { config } from "../../../generator.config"
import { formatWithBiome } from "../emit/format"
import { type OutputFile, writeOutputs } from "../emit/write"
import {
  COMPONENTS_DIR,
  type GeneratedComponent,
  GenerationError,
  generateComponent,
} from "../generate"
import {
  buildManifest,
  renderCompatibilityTable,
  replaceReadmeRegion,
} from "../manifest/build"
import { ROOT } from "../paths"
import { buildRegistry, STYLES_DIR } from "../registry/build"
import { buildThemeCss, buildVendoredTailwindCss } from "../theme/build"
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
if (!lock?.theme || !lock.tailwindCss) {
  console.error(
    "upstream/lock.json is incomplete; run `bun run upstream:sync` first."
  )
  process.exit(1)
}

// Every configured component is generated in memory because registry.json
// depends on all of them; only the selected ones are written.
const components: GeneratedComponent[] = []
const errors: string[] = []
for (const name of config.components) {
  try {
    components.push(generateComponent(name, { config, store, lock }))
  } catch (error) {
    if (!(error instanceof GenerationError)) throw error
    errors.push(error.message)
  }
}
if (errors.length > 0) {
  for (const message of errors) console.error(message)
  process.exit(1)
}

const selected = new Set(
  positionals.length > 0 ? positionals : config.components
)
const files: OutputFile[] = components
  .filter((c) => selected.has(c.name))
  .map((c) => c.file)

// Repository-level outputs are always rebuilt from the config and snapshot.
const json = (value: unknown, file: string) => ({
  path: file,
  text: formatWithBiome(JSON.stringify(value), file),
})
files.push({
  path: `${STYLES_DIR}/theme.css`,
  text: buildThemeCss(store.readTheme(), {
    url: lock.theme.url,
    sha256: lock.theme.sha256,
    repository: config.repository,
  }),
})
files.push({
  path: `${STYLES_DIR}/tailwind.css`,
  text: buildVendoredTailwindCss(store.readTailwindCss(), {
    ...lock.tailwindCss,
    repository: config.repository,
  }),
})
files.push(json(buildRegistry({ config, lock, components }), "registry.json"))
const manifest = buildManifest({ config, store, lock })
files.push(json(manifest, "compatibility.json"))
const readme = readFileSync(path.join(ROOT, "README.md"), "utf8")
files.push({
  path: "README.md",
  text: replaceReadmeRegion(readme, renderCompatibilityTable(manifest)),
})

const result = writeOutputs(ROOT, files, {
  check: values.check,
  prune:
    positionals.length === 0
      ? [
          { dir: COMPONENTS_DIR, extension: ".tsx" },
          { dir: STYLES_DIR, extension: ".css" },
        ]
      : [],
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
