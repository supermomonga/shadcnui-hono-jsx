import { readFileSync } from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"
import { readCatalog } from "./catalog"
import { add, apply, type Context, init } from "./commands"
import { UsageError } from "./errors"
import { runInstall } from "./package-manager"
import { PACKAGE_DIR } from "./paths"
import { PRESET_PARTS, type PresetPart } from "./preset"
import { fetchJson } from "./shadcn"

const HELP = `Usage: shadcnui-hono-jsx <command> [options]

Installs shadcn/ui components ported to Hono JSX, styled by a shadcn/ui preset
(https://ui.shadcn.com/create).

Commands:
  init [components...]   write shadcnui-hono-jsx.json, the theme and the
                         license notice, and optionally add components
    --preset <code|name> preset code or name (default: nova)
    --rtl                right-to-left components
    --pointer            pointer cursor on buttons
    --force              replace an existing setup and files
  add <components...>    install components for the project's preset
    --overwrite          replace existing files with other content
  apply                  change the preset and rewrite the theme and the
                         installed components
    --preset <code|name> the new preset
    --only <parts>       take only theme and/or font from the new preset
                         (comma-separated), leaving components alone
    --rtl, --no-rtl      switch right-to-left components
    --pointer, --no-pointer

Options:
  --cwd <dir>            project root (default: the current directory)
  --no-install           print npm packages to install instead of installing
  -h, --help             show this help
  -v, --version          show the version
`

function version(): string {
  const pkg = JSON.parse(
    readFileSync(path.join(PACKAGE_DIR, "package.json"), "utf8")
  ) as { version: string }
  return pkg.version
}

function parseOnly(value: string | undefined): PresetPart[] {
  if (!value) return []
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .map((part) => (part === "fonts" ? "font" : part))
  for (const part of parts) {
    if (!(part in PRESET_PARTS)) {
      throw new UsageError(
        `--only takes ${Object.keys(PRESET_PARTS).join(", ")}, not "${part}"`
      )
    }
  }
  return parts as PresetPart[]
}

/** `--x` / `--no-x`; undefined when neither is given. */
function toggle(on: boolean | undefined, off: boolean | undefined) {
  if (on && off) throw new UsageError("contradicting flags")
  return on ? true : off ? false : undefined
}

export async function main(argv: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      preset: { type: "string" },
      base: { type: "string" },
      only: { type: "string" },
      rtl: { type: "boolean" },
      "no-rtl": { type: "boolean" },
      pointer: { type: "boolean" },
      "no-pointer": { type: "boolean" },
      force: { type: "boolean", default: false },
      overwrite: { type: "boolean", default: false },
      cwd: { type: "string" },
      "no-install": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
    },
  })
  if (values.version) {
    console.log(version())
    return
  }
  const [command, ...names] = positionals
  if (values.help || !command) {
    console.log(HELP)
    return
  }
  if (values.base !== undefined && values.base !== "base") {
    throw new UsageError(
      `shadcnui-hono-jsx is built on Base UI; --base ${values.base} is not supported.`
    )
  }
  const log = (line: string) => console.log(line)
  const ctx: Context = {
    cwd: path.resolve(values.cwd ?? process.cwd()),
    catalog: readCatalog(),
    fetch: fetchJson,
    install: values["no-install"]
      ? (_cwd, packages) => log(`Install these packages: ${packages.join(" ")}`)
      : runInstall,
    log,
  }
  const rtl = toggle(values.rtl, values["no-rtl"])
  const pointer = toggle(values.pointer, values["no-pointer"])
  switch (command) {
    case "init":
      await init(ctx, {
        preset: values.preset,
        rtl: rtl ?? false,
        pointer: pointer ?? false,
        force: values.force,
        components: names,
      })
      return
    case "add":
      await add(ctx, { components: names, overwrite: values.overwrite })
      return
    case "apply":
      if (names.length > 0) {
        throw new UsageError("apply takes no components; it rewrites all")
      }
      await apply(ctx, {
        preset: values.preset,
        only: parseOnly(values.only),
        rtl,
        pointer,
      })
      return
    default:
      throw new UsageError(`Unknown command "${command}". See --help.`)
  }
}

/** Runs a command and exits with 1 on failure, printing usage errors briefly. */
export function run(argv: string[]): void {
  main(argv).catch((error: unknown) => {
    const code = (error as { code?: unknown } | null)?.code
    if (
      error instanceof UsageError ||
      (typeof code === "string" && code.startsWith("ERR_PARSE_ARGS"))
    ) {
      console.error((error as Error).message)
    } else {
      console.error(error)
    }
    process.exit(1)
  })
}
