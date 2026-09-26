import { readFileSync } from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"
import { ICON_LIBRARIES } from "../../../cli/src/icons"
import { MENU_COLORS, variantDir } from "../../../cli/src/variants"
import { config } from "../../../generator.config"
import { buildCatalog } from "../catalog/build"
import { formatWithBiome } from "../emit/format"
import { buildVendoredPreset, buildVendoredTailwindCss } from "../emit/vendored"
import { type OutputFile, writeOutputs } from "../emit/write"
import { TEMPLATES_DIR } from "../generate"
import type { StyleResult } from "../generate-style"
import { buildIconSets } from "../icons/sets"
import { buildLicenseNotice, checkUpstreamLicenses } from "../licenses"
import { LITE_COMPONENTS } from "../lite"
import {
  buildManifest,
  renderCompatibilityTable,
  replaceReadmeRegion,
} from "../manifest/build"
import { ROOT } from "../paths"
import { UpstreamStore } from "../upstream/store"

/** Every variant directory a style may have (docs/adr/0030). */
const ALL_VARIANT_DIRS = [false, true]
  .flatMap((rtl) =>
    MENU_COLORS.map((menuColor) => variantDir({ rtl, menuColor }))
  )
  .filter(Boolean)

/** Everything the CLI package reads besides its sources and client scripts. */
const CLI_GENERATED = "cli/generated"

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: { check: { type: "boolean", default: false } },
  allowPositionals: true,
})

const liteNames = Object.keys(LITE_COMPONENTS)
const unknown = positionals.filter(
  (name) => !config.components.includes(name) && !liteNames.includes(name)
)
if (unknown.length > 0) {
  console.error(`Not configured in generator.config.ts: ${unknown.join(", ")}`)
  process.exit(1)
}

const store = new UpstreamStore(ROOT, config.style)
const lock = store.readLock()
if (!lock?.theme || !lock.tailwindCss || !lock.preset) {
  console.error(
    "upstream/lock.json is incomplete; run `bun run upstream:sync` first."
  )
  process.exit(1)
}

// Upstream licensing must match the reviewed record before anything derived
// from upstream is (re)generated; a change needs a human decision.
const licenseProblems = checkUpstreamLicenses(lock, {
  repository: store.readOptional(store.licenseFile),
  package: store.readOptional(store.packageLicenseFile),
  icons: Object.fromEntries(
    ICON_LIBRARIES.map((library) => [
      library,
      store.readOptional(store.iconLicenseFile(library)),
    ])
  ),
})
if (licenseProblems.length > 0) {
  console.error(
    "Upstream licensing changed and needs review before generating:"
  )
  for (const problem of licenseProblems) console.error(`  - ${problem}`)
  console.error(
    "Review upstream/licenses/ and, if redistribution is still permitted, update ACCEPTED_UPSTREAM_LICENSE and the notice in generator/src/licenses.ts (see docs/adr/0013)."
  )
  process.exit(1)
}

// Every configured component is generated in memory for every style
// (docs/adr/0030) because the catalog depends on all of them; only the
// selected ones are written. Styles are generated in parallel workers.
const selected = new Set(
  positionals.length > 0 ? positionals : [...config.components, ...liteNames]
)
const results = await Promise.all(
  config.styles.map(
    (style) =>
      new Promise<StyleResult>((resolve, reject) => {
        const worker = new Worker(
          new URL("./generate-style.worker.ts", import.meta.url).href
        )
        worker.onmessage = (event: MessageEvent<StyleResult>) => {
          resolve(event.data)
          worker.terminate()
        }
        worker.onerror = (event) => {
          reject(new Error(`${style}: ${event.message}`))
          worker.terminate()
        }
        worker.postMessage({ style, selected: [...selected] })
      })
  )
)
const errors = results.flatMap((result) => result.errors)
if (errors.length > 0) {
  for (const message of errors) console.error(message)
  process.exit(1)
}
const byStyle = new Map(results.map((r) => [r.style, r.components]))
const variantFiles = results.flatMap((result) => result.variants)

const files: OutputFile[] = [
  ...[...byStyle.values()]
    .flat()
    .filter((c) => selected.has(c.name))
    .map((c) => c.file),
  ...variantFiles,
]

// Package- and repository-level outputs are always rebuilt from the config
// and the snapshot.
const json = (value: unknown, file: string) => ({
  path: file,
  text: formatWithBiome(JSON.stringify(value), file),
})
files.push({
  path: `${CLI_GENERATED}/tailwind.css`,
  text: buildVendoredTailwindCss(store.readTailwindCss(), lock.tailwindCss),
})
for (const library of ICON_LIBRARIES) {
  files.push({
    path: `${CLI_GENERATED}/notices/${library}.txt`,
    text: buildLicenseNotice(config.repository, library),
  })
}
for (const set of buildIconSets(
  [...byStyle.values()].flat().map((c) => c.file.text)
)) {
  files.push(json(set, `${CLI_GENERATED}/icons/${set.library}.json`))
}
files.push({
  path: `${CLI_GENERATED}/shadcn-preset.js`,
  text: buildVendoredPreset(
    readFileSync(store.presetModuleFile, "utf8"),
    lock.preset,
    "index.js"
  ),
})
files.push({
  path: `${CLI_GENERATED}/shadcn-preset.d.ts`,
  text: buildVendoredPreset(
    readFileSync(store.presetTypesFile, "utf8"),
    lock.preset,
    "index.d.ts"
  ),
})
files.push(
  json(store.readNamedPresets(), `${CLI_GENERATED}/named-presets.json`)
)
files.push(
  json(
    buildCatalog({ config, theme: store.readTheme(), components: byStyle }),
    `${CLI_GENERATED}/catalog.json`
  )
)
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
      ? config.styles.flatMap((style) =>
          ["", ...ALL_VARIANT_DIRS].map((dir) => ({
            dir: `${TEMPLATES_DIR}/${style}${dir ? `/${dir}` : ""}`,
            extension: ".tsx",
          }))
        )
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
