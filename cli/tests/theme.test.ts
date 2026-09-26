import { describe, expect, test } from "bun:test"
import type { FontItem } from "../src/shadcn"
import {
  applyFonts,
  buildThemeCss,
  serializeCss,
  type ThemeItem,
  themeMappings,
} from "../src/theme"

const theme: ThemeItem = {
  name: "test",
  type: "registry:base",
  cssVars: {
    theme: { "--font-heading": "var(--font-sans)" },
    light: { background: "oklch(1 0 0)", radius: "0.625rem", spacing: "4px" },
    dark: { background: "oklch(0.1 0 0)", "sidebar-ring": "#fff" },
  },
  css: {
    '@import "tw-animate-css"': {},
    '@import "shadcn/tailwind.css"': {},
    "@layer base": { body: { "@apply bg-background": {} } },
  },
}

describe("serializeCss", () => {
  test("renders statements, blocks and declarations", () => {
    expect(
      serializeCss({
        '@import "x"': {},
        ".a": { color: "red", "@apply p-2": {} },
      })
    ).toEqual(['@import "x";', ".a {", "  color: red;", "  @apply p-2;", "}"])
  })

  test("points the shadcn/tailwind.css import at the vendored copy", () => {
    expect(serializeCss({ '@import "shadcn/tailwind.css"': {} })).toEqual([
      '@import "./tailwind.css";',
    ])
  })
})

describe("themeMappings", () => {
  test("maps colors, expands radius, keeps other vars and appends theme vars", () => {
    expect(themeMappings(theme)).toEqual([
      "  --color-background: var(--background);",
      "  --radius-sm: calc(var(--radius) * 0.6);",
      "  --radius-md: calc(var(--radius) * 0.8);",
      "  --radius-lg: var(--radius);",
      "  --radius-xl: calc(var(--radius) * 1.4);",
      "  --radius-2xl: calc(var(--radius) * 1.8);",
      "  --radius-3xl: calc(var(--radius) * 2.2);",
      "  --radius-4xl: calc(var(--radius) * 2.6);",
      "  --spacing: var(--spacing);",
      "  --color-sidebar-ring: var(--sidebar-ring);",
      "  --font-heading: var(--font-sans);",
    ])
  })
})

describe("buildThemeCss", () => {
  const css = buildThemeCss(theme, [
    "upstream: https://x/init",
    "SPDX-License-Identifier: MIT",
  ])

  test("orders imports, dark variant, variables, theme mappings and base layer", () => {
    const order = [
      '@import "tw-animate-css";',
      '@import "./tailwind.css";',
      "@custom-variant dark (&:is(.dark *));",
      ":root {",
      ".dark {",
      "@theme inline {",
      "@layer base {",
    ].map((s) => css.indexOf(s))
    expect(order.every((index) => index >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  test("does not import tailwindcss itself and starts with the header lines", () => {
    expect(css).not.toMatch(/^@import "tailwindcss"/m)
    expect(
      css.startsWith(
        "/*\n * upstream: https://x/init\n * SPDX-License-Identifier: MIT\n"
      )
    ).toBe(true)
    expect(css.endsWith("}\n")).toBe(true)
  })
})

const font = (
  name: string,
  variable: string,
  extra: Partial<FontItem["font"]> = {}
): FontItem => ({
  name,
  type: "registry:font",
  font: { family: `'${name} Variable', sans-serif`, variable, ...extra },
})

describe("applyFonts", () => {
  test("adds the fontsource package, its import and the theme variable", () => {
    const result = applyFonts(theme, [
      font("font-geist", "--font-sans", {
        dependency: "@fontsource-variable/geist",
      }),
    ])
    expect(result.dependencies).toEqual(["@fontsource-variable/geist"])
    expect(result.theme.css?.['@import "@fontsource-variable/geist"']).toEqual(
      {}
    )
    expect(result.theme.cssVars.theme).toEqual({
      "--font-heading": "var(--font-sans)",
      "--font-sans": "'font-geist Variable', sans-serif",
    })
    expect(result.theme.css?.["@layer base"]).toEqual({
      body: { "@apply bg-background": {} },
      html: { "@apply font-sans": {} },
    })
  })

  test("derives the package from the item name and applies heading fonts to no element", () => {
    const result = applyFonts(theme, [
      font("font-inter", "--font-sans"),
      font("font-heading-oxanium", "--font-heading", {
        dependency: "@fontsource-variable/oxanium",
      }),
    ])
    expect(result.dependencies).toEqual([
      "@fontsource-variable/inter",
      "@fontsource-variable/oxanium",
    ])
    expect(result.theme.cssVars.theme?.["--font-heading"]).toBe(
      "'font-heading-oxanium Variable', sans-serif"
    )
    expect(
      Object.keys(
        (result.theme.css?.["@layer base"] as Record<string, unknown>) ?? {}
      )
    ).toEqual(["body", "html"])
  })

  test("merges several root fonts into one @apply and leaves the input alone", () => {
    const result = applyFonts(theme, [
      font("font-inter", "--font-sans"),
      font("font-jetbrains-mono", "--font-mono"),
    ])
    const base = result.theme.css?.["@layer base"] as Record<string, unknown>
    expect(base.html).toEqual({ "@apply font-sans font-mono": {} })
    expect(theme.cssVars.theme).toEqual({
      "--font-heading": "var(--font-sans)",
    })
  })
})
