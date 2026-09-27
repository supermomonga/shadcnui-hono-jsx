import { describe, expect, test } from "bun:test"
import { parseCreateThemes } from "../../src/site/create-themes"

describe("parseCreateThemes", () => {
  test("reads the themes in order and the base colors among them", () => {
    const themes = `import { type RegistryItem } from "shadcn/schema"
export const THEMES: RegistryItem[] = [
  { name: "neutral", title: "Neutral", cssVars: {} },
  { name: "stone", title: "Stone", cssVars: {} },
  { name: "blue", title: "Blue", cssVars: {} },
] as const satisfies RegistryItem[]`
    const baseColors = `import { THEMES } from "@/registry/themes"
export const BASE_COLORS = THEMES.filter((theme) =>
  ["stone", "neutral"].includes(theme.name)
)`
    expect(parseCreateThemes(themes, baseColors)).toEqual({
      themes: [
        { name: "neutral", title: "Neutral" },
        { name: "stone", title: "Stone" },
        { name: "blue", title: "Blue" },
      ],
      baseColors: ["neutral", "stone"],
    })
  })

  test("fails when upstream's shape changes", () => {
    expect(() =>
      parseCreateThemes("export const THEMES = makeThemes()", "")
    ).toThrow("no THEMES array")
    expect(() =>
      parseCreateThemes(
        `export const THEMES = [{ name: "a", title: "A" }]`,
        `export const BASE_COLORS = THEMES.filter((t) => ["b"].includes(t.name))`
      )
    ).toThrow("b is not a theme")
  })
})
