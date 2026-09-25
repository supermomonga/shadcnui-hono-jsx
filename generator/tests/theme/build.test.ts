import { describe, expect, test } from "bun:test"
import {
  buildThemeCss,
  serializeCss,
  themeMappings,
} from "../../src/theme/build"
import type { ThemeItem } from "../../src/upstream/types"

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
  const css = buildThemeCss(theme, {
    url: "https://x/init",
    sha256: "abc",
  })

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

  test("does not import tailwindcss itself and records provenance", () => {
    expect(css).not.toMatch(/^@import "tailwindcss"/m)
    expect(css).toContain("upstream-revision: sha256:abc")
    expect(css).toContain(" * SPDX-License-Identifier: MIT\n")
    expect(css).toContain(
      " * Full license: LICENSE-shadcnui-hono-jsx.txt at the project root.\n"
    )
    expect(css.endsWith("}\n")).toBe(true)
  })
})
