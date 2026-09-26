import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { ROOT } from "../../generator/src/paths"
import { UpstreamStore } from "../../generator/src/upstream/store"
import { config } from "../../generator.config"
import { encodePreset } from "../generated/shadcn-preset.js"
import { readCatalog, readGenerated, readTemplate } from "../src/catalog"
import { add, apply, type Context, init } from "../src/commands"
import { UsageError } from "../src/errors"
import { resolvePreset } from "../src/preset"
import type { ThemeItem } from "../src/theme"

const snapshotTheme = new UpstreamStore(ROOT, config.style).readTheme()

/**
 * A stand-in for ui.shadcn.com: `/init` answers with the snapshotted theme,
 * its primary color replaced by the `theme` parameter and its font by the
 * `font` parameter; font items are derived from their names.
 */
async function fakeShadcn(url: string): Promise<unknown> {
  const parsed = new URL(url)
  if (parsed.pathname === "/init") {
    const theme = structuredClone(snapshotTheme) as ThemeItem
    const light = theme.cssVars.light ?? {}
    light.primary = `var(--test-${parsed.searchParams.get("theme")})`
    theme.registryDependencies = [
      "utils",
      `font-${parsed.searchParams.get("font")}`,
    ]
    return theme
  }
  const font = parsed.pathname.match(/\/(font-[a-z-]+)\.json$/)?.[1]
  if (font) {
    const name = font.replace("font-", "")
    return {
      name: font,
      type: "registry:font",
      font: {
        family: `'${name} Variable', sans-serif`,
        variable: "--font-sans",
        dependency: `@fontsource-variable/${name}`,
      },
    }
  }
  throw new Error(`unexpected request ${url}`)
}

const nova = resolvePreset("nova").config
const bluePreset = encodePreset({ ...nova, theme: "blue", font: "inter" })

let cwd: string
let installs: string[][]
let lines: string[]
let ctx: Context

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), "shj-commands-"))
  writeFileSync(path.join(cwd, "package.json"), '{"dependencies":{}}')
  installs = []
  lines = []
  ctx = {
    cwd,
    catalog: readCatalog(),
    fetch: fakeShadcn,
    install: (dir, packages) => {
      installs.push([...packages])
      const file = path.join(dir, "package.json")
      const pkg = JSON.parse(readFileSync(file, "utf8"))
      for (const name of packages) pkg.dependencies[name] = "*"
      writeFileSync(file, JSON.stringify(pkg))
    },
    log: (line) => lines.push(line),
  }
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

const read = (file: string) => readFileSync(path.join(cwd, file), "utf8")
const initDefaults = {
  rtl: false,
  pointer: false,
  force: false,
  components: [],
}

describe("init", () => {
  test("writes the config, the theme of the default preset and the notice", async () => {
    await init(ctx, initDefaults)
    expect(JSON.parse(read("shadcnui-hono-jsx.json"))).toEqual({
      preset: resolvePreset("nova").code,
      rtl: false,
      pointer: false,
    })
    const theme = read("styles/shadcn/theme.css")
    expect(theme).toContain(`shadcn/ui preset ${resolvePreset("nova").code}`)
    expect(theme).toContain('@import "@fontsource-variable/geist";')
    expect(theme).toContain("--primary: var(--test-neutral);")
    expect(read("styles/shadcn/tailwind.css")).toBe(
      readGenerated("tailwind.css")
    )
    expect(read("LICENSE-shadcnui-hono-jsx.txt")).toBe(
      readGenerated("LICENSE-shadcnui-hono-jsx.txt")
    )
    expect(installs).toEqual([["@fontsource-variable/geist", "tw-animate-css"]])
  })

  test("adds components, and refuses to run twice without --force", async () => {
    await init(ctx, { ...initDefaults, components: ["button"] })
    expect(existsSync(path.join(cwd, "components/ui/button.tsx"))).toBe(true)
    await expect(init(ctx, initDefaults)).rejects.toThrow(/apply/)
    await init(ctx, { ...initDefaults, force: true, preset: bluePreset })
    expect(read("styles/shadcn/theme.css")).toContain("var(--test-blue)")
  })

  test("installs the templates of the preset's style", async () => {
    const lyra = resolvePreset("b3ZgkpTRjc")
    expect(lyra.config.style).toBe("lyra")
    await init(ctx, {
      ...initDefaults,
      preset: lyra.code,
      components: ["button"],
    })
    expect(read("components/ui/button.tsx").split("\n").slice(1)).toEqual(
      readTemplate("base-lyra", "button").split("\n").slice(1)
    )
  })

  test("rejects presets this version cannot install, before writing", async () => {
    const tabler = encodePreset({ ...nova, iconLibrary: "tabler" })
    await expect(
      init(ctx, { ...initDefaults, preset: tabler })
    ).rejects.toThrow(/iconLibrary "tabler"/)
    await expect(init(ctx, { ...initDefaults, rtl: true })).rejects.toThrow(
      UsageError
    )
    expect(existsSync(path.join(cwd, "shadcnui-hono-jsx.json"))).toBe(false)
  })
})

describe("add", () => {
  test("needs init first", async () => {
    await expect(
      add(ctx, { components: ["button"], overwrite: false })
    ).rejects.toThrow(/init/)
  })

  test("installs components with their siblings, scripts and packages", async () => {
    await init(ctx, initDefaults)
    installs = []
    await add(ctx, { components: ["dialog", "tabs"], overwrite: false })
    const code = resolvePreset("nova").code
    for (const name of ["dialog", "button", "tabs"]) {
      const text = read(`components/ui/${name}.tsx`)
      expect(text.split("\n").slice(1)).toEqual(
        readTemplate(config.style, name).split("\n").slice(1)
      )
      expect(text).toStartWith(
        `// Installed by shadcnui-hono-jsx for the shadcn/ui preset ${code};`
      )
    }
    expect(read("public/shadcn/tabs.js")).toBe(
      readFileSync(path.join(ROOT, "cli/client/tabs.js"), "utf8")
    )
    expect(existsSync(path.join(cwd, "public/shadcn/core.js"))).toBe(true)
    expect(installs).toEqual([["class-variance-authority", "cn"]])
    expect(lines.join("\n")).toContain(
      '<script type="module" src="/shadcn/tabs.js">'
    )
  })

  test("keeps identical files and protects edited ones", async () => {
    await init(ctx, { ...initDefaults, components: ["button"] })
    await add(ctx, { components: ["button"], overwrite: false })
    writeFileSync(path.join(cwd, "components/ui/button.tsx"), "edited")
    await expect(
      add(ctx, { components: ["button"], overwrite: false })
    ).rejects.toThrow(/--overwrite/)
    expect(read("components/ui/button.tsx")).toBe("edited")
    await add(ctx, { components: ["button"], overwrite: true })
    expect(read("components/ui/button.tsx")).not.toBe("edited")
  })

  test("rejects unknown components", async () => {
    await init(ctx, initDefaults)
    await expect(
      add(ctx, { components: ["nope"], overwrite: false })
    ).rejects.toThrow(/Unknown component "nope"/)
  })
})

describe("apply", () => {
  test("switches the preset and rewrites the theme and installed components", async () => {
    await init(ctx, { ...initDefaults, components: ["card"] })
    writeFileSync(path.join(cwd, "components/ui/other.tsx"), "mine")
    installs = []
    await apply(ctx, { preset: bluePreset, only: [] })
    expect(JSON.parse(read("shadcnui-hono-jsx.json")).preset).toBe(bluePreset)
    const theme = read("styles/shadcn/theme.css")
    expect(theme).toContain("var(--test-blue)")
    expect(theme).toContain('@import "@fontsource-variable/inter";')
    expect(read("components/ui/card.tsx")).toContain(`preset ${bluePreset};`)
    expect(read("components/ui/other.tsx")).toBe("mine")
    expect(installs).toEqual([["@fontsource-variable/inter"]])
  })

  test("--only takes parts of the preset and leaves components alone", async () => {
    await init(ctx, { ...initDefaults, components: ["card"] })
    const card = read("components/ui/card.tsx")
    await apply(ctx, { preset: bluePreset, only: ["theme"] })
    const stored = JSON.parse(read("shadcnui-hono-jsx.json")).preset
    expect(resolvePreset(stored).config).toEqual({ ...nova, theme: "blue" })
    expect(read("styles/shadcn/theme.css")).toContain("var(--test-blue)")
    expect(read("styles/shadcn/theme.css")).toContain("geist")
    expect(read("components/ui/card.tsx")).toBe(card)
  })

  test("rejects --only without a preset", async () => {
    await init(ctx, initDefaults)
    await expect(apply(ctx, { only: ["font"] })).rejects.toThrow(/--preset/)
  })
})
