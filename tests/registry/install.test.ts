import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { ROOT } from "../../generator/src/paths"
import { findProhibitedImports } from "../../generator/src/policy"
import type { Registry } from "../../generator/src/registry/build"

/**
 * Installs every registry item into a clean Hono project (no components.json,
 * no React) with the pinned shadcn CLI, then type-checks, renders and builds
 * Tailwind CSS there. Needs network access for `bun install`.
 */
const enabled = process.env.SKIP_NETWORK_TESTS !== "1"
const SHADCN = path.join(ROOT, "node_modules", ".bin", "shadcn")
const registry = JSON.parse(
  readFileSync(path.join(ROOT, "registry.json"), "utf8")
) as Registry

function run(cmd: string[], cwd: string): string {
  const result = Bun.spawnSync(cmd, {
    cwd,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
  })
  const output = `${result.stdout.toString()}${result.stderr.toString()}`
  if (result.exitCode !== 0) {
    throw new Error(`${cmd.join(" ")} failed (${result.exitCode}):\n${output}`)
  }
  return output
}

describe.skipIf(!enabled)("registry install into a clean Hono project", () => {
  let tmp: string
  let app: string

  beforeAll(() => {
    tmp = mkdtempSync(path.join(tmpdir(), "shj-registry-"))
    app = path.join(tmp, "app")
    run(
      [SHADCN, "build", "./registry.json", "--output", path.join(tmp, "r")],
      ROOT
    )
    cpSync(path.join(ROOT, "tests", "registry", "fixture"), app, {
      recursive: true,
    })
    run(["bun", "install"], app)
    const items = registry.items.map((item) =>
      path.join(tmp, "r", `${item.name}.json`)
    )
    run(
      [
        SHADCN,
        "add",
        ...items,
        "--cwd",
        app,
        "--yes",
        "--overwrite",
        "--silent",
      ],
      app
    )
  }, 300_000)

  afterAll(() => {
    if (tmp) rmSync(tmp, { recursive: true, force: true })
  })

  test("writes every file byte-for-byte to its ~/ target", () => {
    for (const item of registry.items) {
      for (const file of item.files) {
        const installed = path.join(app, file.target.slice(2))
        expect(readFileSync(installed, "utf8")).toBe(
          readFileSync(path.join(ROOT, file.path), "utf8")
        )
      }
    }
  })

  test("does not create components.json", () => {
    expect(existsSync(path.join(app, "components.json"))).toBe(false)
  })

  test("installs the declared dependencies and nothing from React", () => {
    const pkg = JSON.parse(readFileSync(path.join(app, "package.json"), "utf8"))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(names).toEqual(
      expect.arrayContaining([
        "cn",
        "class-variance-authority",
        "tw-animate-css",
      ])
    )
    for (const name of names)
      expect(findProhibitedImports(`import "${name}"`)).toEqual([])
    for (const name of [
      "react",
      "react-dom",
      "@base-ui/react",
      "@types/react",
    ]) {
      expect(existsSync(path.join(app, "node_modules", name))).toBe(false)
    }
  })

  test("type-checks", () => {
    run(
      [path.join(app, "node_modules", ".bin", "tsc"), "-p", "tsconfig.json"],
      app
    )
  })

  test("renders with hono/jsx", () => {
    const html = run(["bun", "src/render.tsx"], app)
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

  test("builds Tailwind CSS with the theme tokens and custom variants", () => {
    run(
      [
        path.join(app, "node_modules", ".bin", "tailwindcss"),
        "-i",
        "src/style.css",
        "-o",
        "out.css",
      ],
      app
    )
    const css = readFileSync(path.join(app, "out.css"), "utf8")
    // `@theme inline` resolves utilities straight to the theme variables.
    expect(css).toMatch(/--primary: oklch\(/)
    expect(css).toMatch(/\.bg-primary \{\s*background-color: var\(--primary\)/)
    expect(css).toContain(".dark {")
    // Custom variants from the vendored shadcn/tailwind.css.
    expect(css).toContain(':where([data-orientation="vertical"])')
  })
})
