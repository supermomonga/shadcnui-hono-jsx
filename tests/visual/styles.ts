/**
 * Runs the visual tests in every style and in the menu color and RTL
 * variants (docs/adr/0030): installs the default preset with those options
 * into the repository root, renders and compares with upstream transformed
 * the same way, and finally restores the default install.
 *
 * `--style <style>` and `--variant <variant>` (both repeatable; variants are
 * `rtl`, `menu-inverted`, `menu-default-translucent`,
 * `menu-inverted-translucent`) limit the run; without them everything runs.
 * Menu colors only change classes, so their runs skip the behavior tests.
 */
import path from "node:path"
import { parseArgs } from "node:util"
import { MENU_COLORS } from "../../cli/src/variants"
import { config } from "../../generator.config"

const ROOT = path.resolve(import.meta.dir, "../..")
const HERE = import.meta.dir

interface Run {
  label: string
  install: string[]
  playwright: string[]
}

const VARIANT_RUNS: Record<string, Run> = {
  rtl: { label: `${config.style}, RTL`, install: ["--rtl"], playwright: [] },
  ...Object.fromEntries(
    MENU_COLORS.filter((color) => color !== "default").map((color) => [
      `menu-${color}`,
      {
        label: `${config.style}, menu ${color}`,
        install: ["--menu-color", color],
        playwright: ["--grep-invert", "behave"],
      },
    ])
  ),
}

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    style: { type: "string", multiple: true },
    variant: { type: "string", multiple: true },
  },
})
const everything = !values.style && !values.variant
const runs: Run[] = [
  ...(values.style ?? (everything ? config.styles : [])).map((style) => ({
    label: style,
    install: ["--style", style],
    playwright: [],
  })),
  ...(values.variant ?? (everything ? Object.keys(VARIANT_RUNS) : [])).map(
    (name) => {
      const run = VARIANT_RUNS[name]
      if (!run) {
        throw new Error(
          `--variant takes ${Object.keys(VARIANT_RUNS).join(", ")}`
        )
      }
      return run
    }
  ),
]

function run(cmd: string[], cwd: string): boolean {
  console.log(`$ ${cmd.join(" ")}`)
  return Bun.spawnSync(cmd, { cwd, stdout: "inherit", stderr: "inherit" })
    .success
}

const failed: string[] = []
for (const { label, install, playwright } of runs) {
  console.log(`\n=== ${label} ===`)
  const ok =
    run(["bun", "run", "dev:install", ...install], ROOT) &&
    run(["bun", "render.ts"], HERE) &&
    run(["bunx", "playwright", "test", ...playwright], HERE)
  if (!ok) failed.push(label)
}
run(["bun", "run", "dev:install"], ROOT)
if (failed.length > 0) {
  console.error(`\nVisual tests failed in ${failed.join("; ")}`)
  process.exit(1)
}
console.log(`\nVisual tests passed in ${runs.map((r) => r.label).join("; ")}`)
