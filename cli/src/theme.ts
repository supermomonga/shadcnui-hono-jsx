import type { FontItem } from "./shadcn"

export type CssVars = Record<string, string>

/** The upstream `registry:base` item of a preset (`/init`). */
export interface ThemeItem {
  name: string
  type: string
  cssVars: { theme?: CssVars; light?: CssVars; dark?: CssVars }
  css?: Record<string, unknown>
  dependencies?: string[]
  registryDependencies?: string[]
  config?: { style?: string }
  [key: string]: unknown
}

/** Radius scale the shadcn CLI adds to `@theme inline` for a `radius` variable. */
export const RADIUS_SCALE: readonly [string, string][] = [
  ["sm", "calc(var(--radius) * 0.6)"],
  ["md", "calc(var(--radius) * 0.8)"],
  ["lg", "var(--radius)"],
  ["xl", "calc(var(--radius) * 1.4)"],
  ["2xl", "calc(var(--radius) * 1.8)"],
  ["3xl", "calc(var(--radius) * 2.2)"],
  ["4xl", "calc(var(--radius) * 2.6)"],
]

/** Imports in upstream `css` that must point at files this project ships. */
export const IMPORT_REWRITES: Readonly<Record<string, string>> = {
  '@import "shadcn/tailwind.css"': '@import "./tailwind.css"',
}

/** Font variables the shadcn CLI also applies to `html` (`@apply font-sans`). */
const ROOT_FONT_VARIABLES = new Set([
  "--font-sans",
  "--font-serif",
  "--font-mono",
])

const COLOR_VALUE =
  /^(oklch|oklab|lch|lab|hsl|hsla|rgb|rgba|hwb|color)\(|^#[0-9a-f]{3,8}$/i

const indent = (depth: number) => "  ".repeat(depth)
const varName = (key: string) => `--${key.replace(/^--/, "")}`

function declarations(vars: CssVars, depth: number): string[] {
  return Object.entries(vars).map(
    ([key, value]) => `${indent(depth)}${varName(key)}: ${value};`
  )
}

/**
 * Serializes the upstream `css` object: `{}` values become statements
 * (`@import "x";`, `@apply a b;`), objects become blocks, strings become
 * declarations.
 */
export function serializeCss(
  css: Record<string, unknown>,
  depth = 0
): string[] {
  const lines: string[] = []
  for (const [key, value] of Object.entries(css)) {
    const rewritten = IMPORT_REWRITES[key] ?? key
    if (typeof value === "string") {
      lines.push(`${indent(depth)}${rewritten}: ${value};`)
    } else if (
      value &&
      typeof value === "object" &&
      Object.keys(value).length > 0
    ) {
      lines.push(`${indent(depth)}${rewritten} {`)
      lines.push(...serializeCss(value as Record<string, unknown>, depth + 1))
      lines.push(`${indent(depth)}}`)
    } else if (value && typeof value === "object") {
      lines.push(`${indent(depth)}${rewritten};`)
    } else {
      throw new Error(`Unsupported css value for "${key}"`)
    }
  }
  return lines
}

/** The `@theme inline` mappings the shadcn CLI derives from light/dark variables. */
export function themeMappings(theme: ThemeItem): string[] {
  const { light = {}, dark = {} } = theme.cssVars
  const keys = [...new Set([...Object.keys(light), ...Object.keys(dark)])]
  const lines: string[] = []
  for (const key of keys) {
    const value = light[key] ?? dark[key] ?? ""
    const name = key.replace(/^--/, "")
    if (name === "radius") {
      for (const [size, expression] of RADIUS_SCALE) {
        lines.push(`${indent(1)}--radius-${size}: ${expression};`)
      }
    } else if (COLOR_VALUE.test(value)) {
      lines.push(`${indent(1)}--color-${name}: var(--${name});`)
    } else {
      lines.push(`${indent(1)}--${name}: var(--${name});`)
    }
  }
  lines.push(...declarations(theme.cssVars.theme ?? {}, 1))
  return lines
}

/**
 * Adds the fonts of a preset the way the shadcn CLI does outside Next.js: an
 * `@fontsource-variable/*` dependency and `@import` per font, the font
 * variable in `@theme`, and `@apply font-sans` (etc.) on `html`.
 */
export function applyFonts(
  theme: ThemeItem,
  fonts: readonly FontItem[]
): { theme: ThemeItem; dependencies: string[] } {
  const result: ThemeItem = structuredClone(theme)
  const css: Record<string, unknown> = result.css ?? {}
  const themeVars: CssVars = result.cssVars.theme ?? {}
  result.css = css
  result.cssVars.theme = themeVars
  const dependencies: string[] = []
  const bySelector = new Map<string, string[]>()
  for (const font of fonts) {
    const dependency =
      font.font.dependency ??
      `@fontsource-variable/${font.name.replace("font-", "")}`
    dependencies.push(dependency)
    css[`@import "${dependency}"`] = {}
    themeVars[font.font.variable] = font.font.family
    const selector =
      font.font.selector ??
      (ROOT_FONT_VARIABLES.has(font.font.variable) ? "html" : null)
    if (!selector) continue
    const utilities = bySelector.get(selector) ?? []
    utilities.push(font.font.variable.replace(/^--/, ""))
    bySelector.set(selector, utilities)
  }
  if (bySelector.size > 0) {
    const base = (css["@layer base"] ?? {}) as Record<
      string,
      Record<string, unknown>
    >
    css["@layer base"] = base
    for (const [selector, utilities] of bySelector) {
      const rule = base[selector] ?? {}
      base[selector] = rule
      const apply = Object.keys(rule).find((key) => key.startsWith("@apply "))
      if (apply) {
        delete rule[apply]
        rule[`${apply} ${utilities.join(" ")}`] = {}
      } else {
        rule[`@apply ${utilities.join(" ")}`] = {}
      }
    }
  }
  return { theme: result, dependencies }
}

function header(lines: string[]): string {
  return [
    "/*",
    ...lines.map((line) => (line ? ` * ${line}` : " *")),
    " */",
  ].join("\n")
}

/**
 * Builds `theme.css` the way `shadcn init` writes a Tailwind v4 stylesheet for
 * a preset, minus the `@import "tailwindcss"` that the project owns.
 */
export function buildThemeCss(theme: ThemeItem, headerLines: string[]): string {
  const css = { ...(theme.css ?? {}) }
  const imports = Object.keys(css).filter((key) => key.startsWith("@import"))
  const rest = Object.fromEntries(
    Object.entries(css).filter(([key]) => !key.startsWith("@import"))
  )
  const { light = {}, dark = {} } = theme.cssVars
  const sections = [
    header([
      ...headerLines,
      "",
      "Usage: import after Tailwind CSS, e.g.",
      '  @import "tailwindcss";',
      '  @import "./styles/shadcn/theme.css";',
    ]),
    serializeCss(Object.fromEntries(imports.map((key) => [key, {}]))).join(
      "\n"
    ),
    "@custom-variant dark (&:is(.dark *));",
    [":root {", ...declarations(light, 1), "}"].join("\n"),
    [".dark {", ...declarations(dark, 1), "}"].join("\n"),
    ["@theme inline {", ...themeMappings(theme), "}"].join("\n"),
    serializeCss(rest).join("\n"),
  ]
  return `${sections.filter((s) => s.length > 0).join("\n\n")}\n`
}
