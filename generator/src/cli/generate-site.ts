/**
 * `bun run site:generate [--check] [--allow-missing]`: translates the
 * documentation site's upstream sources into site/generated/ (see
 * ../site/generate.ts). `--check` fails when the files differ;
 * `--allow-missing` writes what translates while overrides are still missing.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"
import {
  GENERATED_DIR,
  generateSite,
  removeFiles,
  staleFiles,
} from "../site/generate"

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    check: { type: "boolean", default: false },
    "allow-missing": { type: "boolean", default: false },
  },
})

const output = generateSite()
for (const warning of output.warnings) console.warn(warning)
const problems: string[] = []
if (output.missing.length > 0) {
  const lines = output.missing.map(
    (m) =>
      `  ${m.example}#${m.name} (sha256 ${m.sha256}): ${m.reasons.join("; ")}`
  )
  const message = `${output.missing.length} upstream function(s) need a hand-written override in site/examples/overrides.ts:\n${lines.join("\n")}`
  if (values["allow-missing"]) console.warn(message)
  else problems.push(message)
}
if (output.stale.length > 0) {
  problems.push(
    `Overrides to review:\n${output.stale.map((s) => `  ${s}`).join("\n")}`
  )
}

const changed = [...output.files].filter(([file, text]) => {
  const full = path.join(GENERATED_DIR, file)
  return !existsSync(full) || readFileSync(full, "utf8") !== text
})
const stale = staleFiles(output)

if (values.check) {
  if (changed.length > 0 || stale.length > 0) {
    problems.push(
      `site/generated/ is out of date (${changed.length} changed, ${stale.length} stale); run \`bun run site:generate\`.${[
        ...changed.map(([file]) => `\n  ${file}`),
        ...stale.map((file) => `\n  ${file} (stale)`),
      ].join("")}`
    )
  }
} else {
  for (const [file, text] of changed) {
    const full = path.join(GENERATED_DIR, file)
    mkdirSync(path.dirname(full), { recursive: true })
    writeFileSync(full, text)
  }
  removeFiles(stale)
  console.log(
    `site/generated/: ${changed.length} written, ${stale.length} removed, ${output.files.size - changed.length} unchanged.`
  )
}

if (problems.length > 0) {
  console.error(problems.join("\n\n"))
  process.exit(1)
}
if (values.check) console.log("site/generated/ is up to date.")
