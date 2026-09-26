/**
 * Runs the visual tests in every style (docs/adr/0030): installs the default
 * preset in the style into the repository root, renders and compares with
 * upstream in that style, and finally restores the default install.
 * `--style <style>` (repeatable) limits the run.
 */
import path from "node:path"
import { parseArgs } from "node:util"
import { config } from "../../generator.config"

const ROOT = path.resolve(import.meta.dir, "../..")
const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: { style: { type: "string", multiple: true } },
})
const styles = values.style ?? [...config.styles]

function run(cmd: string[], cwd: string): boolean {
  console.log(`$ ${cmd.join(" ")}`)
  return Bun.spawnSync(cmd, { cwd, stdout: "inherit", stderr: "inherit" })
    .success
}

const failed: string[] = []
for (const style of styles) {
  console.log(`\n=== ${style} ===`)
  const ok =
    run(["bun", "run", "dev:install", "--style", style], ROOT) &&
    run(["bun", "run", "test"], import.meta.dir)
  if (!ok) failed.push(style)
}
run(["bun", "run", "dev:install"], ROOT)
if (failed.length > 0) {
  console.error(`\nVisual tests failed in ${failed.join(", ")}`)
  process.exit(1)
}
console.log(`\nVisual tests passed in ${styles.join(", ")}`)
