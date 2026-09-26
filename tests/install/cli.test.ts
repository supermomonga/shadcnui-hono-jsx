import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { encodePreset } from "../../cli/generated/shadcn-preset.js"
import { readCatalog, readTemplate } from "../../cli/src/catalog"
import { finalize } from "../../cli/src/finalize"
import { ICON_LIBRARIES } from "../../cli/src/icons"
import { resolvePreset } from "../../cli/src/preset"
import { ROOT } from "../../generator/src/paths"
import { findProhibitedImports } from "../../generator/src/policy"
import { UpstreamStore } from "../../generator/src/upstream/store"
import { config } from "../../generator.config"

/**
 * Runs the CLI the way users do, from its packed npm package under Node, in a
 * clean Hono project (no components.json, no React): `init`, `add` for every
 * item, then `apply`. ui.shadcn.com is
 * replaced by a local server that answers from the upstream snapshot (with the
 * primary color taken from the `theme` parameter), so the output is
 * deterministic. Then type-checks, renders and builds Tailwind CSS there.
 * Needs network access for the package manager.
 */
const enabled = process.env.SKIP_NETWORK_TESTS !== "1"
const catalog = readCatalog()
const store = new UpstreamStore(ROOT, config.style)
const nova = resolvePreset("nova")
const blue = encodePreset({ ...nova.config, theme: "blue" })
const lyra = encodePreset({ ...nova.config, style: "lyra" })

function serveSnapshot() {
  return Bun.serve({
    port: 0,
    fetch(request) {
      const url = new URL(request.url)
      if (url.pathname === "/init") {
        const theme = store.readTheme()
        const light = theme.cssVars.light ?? {}
        if (url.searchParams.get("theme") !== "neutral") {
          light.primary = "oklch(0.5 0.2 260)"
        }
        return Response.json(theme)
      }
      const font = url.pathname.match(
        /^\/r\/styles\/[^/]+\/(font-[a-z-]+)\.json$/
      )
      if (font?.[1]) return Response.json(store.readFont(font[1]))
      return new Response("not found", { status: 404 })
    },
  })
}

describe.skipIf(!enabled)("the CLI in a clean Hono project", () => {
  let tmp: string
  let app: string
  let server: ReturnType<typeof Bun.serve>
  const outputs: Record<"init" | "add" | "apply", string> = {
    init: "",
    add: "",
    apply: "",
  }

  // Asynchronous, so that the snapshot server in this process can answer.
  async function run(cmd: string[], cwd = app): Promise<string> {
    const child = Bun.spawn(cmd, {
      cwd,
      env: { ...process.env, REGISTRY_URL: `${server.url.origin}/r` },
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
      // An unexpected interactive prompt must fail the test instead of hanging.
      timeout: 120_000,
    })
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])
    const output = `${stdout}${stderr}`
    if (exitCode !== 0) {
      throw new Error(`${cmd.join(" ")} failed (${exitCode}):\n${output}`)
    }
    return output
  }

  const read = (file: string) => readFileSync(path.join(app, file), "utf8")
  const cli = (...args: string[]) =>
    run(["node", path.join(tmp, "package", "dist", "bin.js"), ...args])

  beforeAll(async () => {
    server = serveSnapshot()
    tmp = mkdtempSync(path.join(tmpdir(), "shj-install-"))
    app = path.join(tmp, "app")
    // `npm pack` builds dist/ (prepack) and applies the package's `files`.
    const tarball = (
      await run(
        ["npm", "pack", "--silent", "--pack-destination", tmp],
        path.join(ROOT, "cli")
      )
    )
      .trim()
      .split("\n")
      .at(-1)
    await run(["tar", "-xzf", `${tmp}/${tarball}`], tmp)
    cpSync(path.join(ROOT, "tests", "install", "fixture"), app, {
      recursive: true,
    })
    await run(["bun", "install"])
    outputs.init = await cli("init", "button")
    outputs.add = await cli("add", ...catalog.items.map((item) => item.name))
  }, 300_000)

  afterAll(() => {
    server?.stop(true)
    if (tmp) rmSync(tmp, { recursive: true, force: true })
  })

  test("installs every component as finalized for the preset", () => {
    const components = [
      ...new Set(catalog.items.flatMap((item) => item.components)),
    ]
    for (const name of components) {
      expect(read(`components/ui/${name}.tsx`)).toBe(
        finalize(readTemplate(config.style, name), {
          iconLibrary: "lucide",
          preset: nova.code,
        })
      )
    }
    for (const name of new Set(catalog.items.flatMap((i) => i.scripts))) {
      expect(read(`public/shadcn/${name}.js`)).toBe(
        readFileSync(path.join(ROOT, "cli", "client", `${name}.js`), "utf8")
      )
    }
    expect(JSON.parse(read("shadcnui-hono-jsx.json"))).toEqual({
      preset: nova.code,
      rtl: false,
      pointer: false,
    })
  })

  test("reuses identical files without prompting and explains the setup", () => {
    expect(outputs.add).toMatch(/file\(s\) already up to date/)
    expect(outputs.add).not.toMatch(/exist with other content/)
    expect(outputs.init).toContain("styles/shadcn/theme.css")
    expect(outputs.add).toContain('<script type="module" src="/shadcn/')
  })

  test("does not create components.json", () => {
    expect(existsSync(path.join(app, "components.json"))).toBe(false)
  })

  test("installs the needed packages and nothing from React", () => {
    const pkg = JSON.parse(read("package.json"))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(names).toEqual(
      expect.arrayContaining([
        "cn",
        "class-variance-authority",
        "tw-animate-css",
        "@fontsource-variable/geist",
      ])
    )
    for (const name of names)
      expect(findProhibitedImports(`import "${name}"`)).toEqual([])
    for (const name of [
      "react",
      "react-dom",
      "@base-ui/react",
      "lucide-react",
      "@types/react",
    ]) {
      expect(existsSync(path.join(app, "node_modules", name))).toBe(false)
    }
  })

  test("type-checks", async () => {
    await run([
      path.join(app, "node_modules", ".bin", "tsc"),
      "-p",
      "tsconfig.json",
    ])
  })

  test("renders with hono/jsx", async () => {
    const html = await run(["bun", "src/render.tsx"])
    for (const slot of [
      "card",
      "alert",
      "badge",
      "input",
      "separator",
      "table",
      "button",
    ]) {
      expect(html).toContain(`data-slot="${slot}"`)
    }
    expect(html).toContain('data-orientation="vertical"')
  })

  test("builds Tailwind CSS with the theme tokens, fonts and custom variants", async () => {
    await run([
      path.join(app, "node_modules", ".bin", "tailwindcss"),
      "-i",
      "src/style.css",
      "-o",
      "out.css",
    ])
    const css = read("out.css")
    // `@theme inline` resolves utilities straight to the theme variables.
    expect(css).toMatch(/--primary: oklch\(/)
    expect(css).toMatch(/\.bg-primary \{\s*background-color: var\(--primary\)/)
    expect(css).toContain(".dark {")
    expect(css).toContain("Geist Variable")
    // Custom variants from the vendored shadcn/tailwind.css.
    expect(css).toContain(':where([data-orientation="vertical"])')
  })

  test("apply switches the preset and rewrites the theme and components", async () => {
    outputs.apply = await cli("apply", "--preset", blue)
    expect(JSON.parse(read("shadcnui-hono-jsx.json")).preset).toBe(blue)
    expect(read("styles/shadcn/theme.css")).toContain(
      "--primary: oklch(0.5 0.2 260);"
    )
    expect(read("components/ui/button.tsx")).toStartWith(
      `// Installed by shadcnui-hono-jsx for the shadcn/ui preset ${blue};`
    )
    expect(outputs.apply).toContain("updated components/ui/button.tsx")
  })

  test("apply switches the style of the installed components", async () => {
    await cli("apply", "--preset", lyra)
    expect(read("components/ui/button.tsx")).toBe(
      finalize(readTemplate("base-lyra", "button"), {
        iconLibrary: "lucide",
        preset: lyra,
      })
    )
  })

  test("apply installs menu color and RTL variants that type-check", async () => {
    const translucent = encodePreset({
      ...nova.config,
      menuColor: "inverted-translucent",
    })
    await cli("apply", "--preset", translucent, "--rtl")
    expect(JSON.parse(read("shadcnui-hono-jsx.json"))).toEqual({
      preset: translucent,
      rtl: true,
      pointer: false,
    })
    expect(read("components/ui/dropdown-menu.tsx")).toContain(
      "// variant: rtl_menu-inverted-translucent\n"
    )
    await run([
      path.join(app, "node_modules", ".bin", "tsc"),
      "-p",
      "tsconfig.json",
    ])
  })

  test.each(ICON_LIBRARIES.filter((library) => library !== "lucide"))(
    "apply swaps in %s icons and their license, and type-checks",
    async (iconLibrary) => {
      const preset = encodePreset({ ...nova.config, iconLibrary })
      const output = await cli("apply", "--preset", preset)
      // The project stays right-to-left from the previous test.
      const variant = { rtl: true, menuColor: "default" } as const
      expect(read("components/ui/select.tsx")).toBe(
        finalize(readTemplate(config.style, "select", variant), {
          iconLibrary,
          preset,
        })
      )
      expect(read("LICENSE-shadcnui-hono-jsx.txt")).toBe(
        readFileSync(
          path.join(ROOT, "cli", "generated", "notices", `${iconLibrary}.txt`),
          "utf8"
        )
      )
      expect(output.includes("Remix Icon License")).toBe(
        iconLibrary === "remixicon"
      )
      await run([
        path.join(app, "node_modules", ".bin", "tsc"),
        "-p",
        "tsconfig.json",
      ])
    }
  )
})
