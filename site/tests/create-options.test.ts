import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import {
  PRESET_BASE_COLORS,
  PRESET_CHART_COLORS,
  PRESET_FONT_HEADINGS,
  PRESET_FONTS,
  PRESET_ICON_LIBRARIES,
  PRESET_MENU_ACCENTS,
  PRESET_MENU_COLORS,
  PRESET_RADII,
  PRESET_STYLES,
  PRESET_THEMES,
} from "../../cli/generated/shadcn-preset.js"
import {
  NAMED_PRESETS,
  normalizeConfig,
  OPTIONS,
  PICKERS,
  randomConfig,
  themesFor,
} from "../app/lib/create-options"

describe("the create page's options", () => {
  test("are the pinned shadcn/preset's values, so codes match ui.shadcn.com's", () => {
    const values = (param: keyof typeof OPTIONS) =>
      OPTIONS[param].map((option) => option.value)
    expect(values("style")).toEqual([...PRESET_STYLES])
    // Upstream's registry offers fewer (not gray), all of them encodable.
    const encodable: [keyof typeof OPTIONS, readonly string[]][] = [
      ["baseColor", PRESET_BASE_COLORS],
      ["theme", PRESET_THEMES],
      ["chartColor", PRESET_CHART_COLORS],
    ]
    for (const [param, preset] of encodable) {
      expect(values(param).length).toBeGreaterThan(0)
      for (const value of values(param)) expect(preset).toContain(value)
    }
    expect(values("baseColor")).not.toContain("gray")
    expect(values("font")).toEqual([...PRESET_FONTS])
    expect(values("fontHeading")).toEqual([...PRESET_FONT_HEADINGS])
    expect(values("iconLibrary")).toEqual([...PRESET_ICON_LIBRARIES])
    expect(values("radius")).toEqual([...PRESET_RADII])
    expect(values("menuColor")).toEqual([...PRESET_MENU_COLORS])
    expect(values("menuAccent")).toEqual([...PRESET_MENU_ACCENTS])
  })

  test("have a picker each, and labels", () => {
    expect(PICKERS.map((p) => p.param as string).sort()).toEqual(
      Object.keys(OPTIONS).sort()
    )
    for (const options of Object.values(OPTIONS)) {
      for (const option of options) expect(option.label).not.toBe("")
    }
  })

  test("swatches are colors of Tailwind's palette", () => {
    const require = createRequire(import.meta.url)
    const theme = readFileSync(require.resolve("tailwindcss/theme.css"), "utf8")
    for (const option of [...OPTIONS.baseColor, ...OPTIONS.theme]) {
      const name = option.swatch?.match(/--color-[a-z]+-500/)?.[0]
      expect(name && theme.includes(`${name}:`)).toBe(true)
    }
  })
})

describe("the create page's design system", () => {
  const baseColors = OPTIONS.baseColor.map((option) => option.value)
  /** ui.shadcn.com/init's rules (apps/v4/registry/config.ts). */
  const valid = (config: ReturnType<typeof randomConfig>) =>
    baseColors.includes(config.baseColor) &&
    themesFor(config.baseColor).includes(config.theme) &&
    themesFor(config.baseColor).includes(config.chartColor ?? "") &&
    !(config.menuAccent === "bold" && config.menuColor.endsWith("translucent"))

  test("offers a base color its own theme and the colored ones", () => {
    expect(themesFor("stone")).toContain("stone")
    expect(themesFor("stone")).toContain("blue")
    expect(themesFor("stone")).not.toContain("neutral")
    for (const baseColor of baseColors) {
      expect(themesFor(baseColor)[0]).toBe(baseColor)
    }
  })

  test("moves choices the base color does not allow, as upstream does", () => {
    const nova = NAMED_PRESETS.nova as ReturnType<typeof randomConfig>
    const stone = normalizeConfig({ ...nova, baseColor: "stone" })
    expect([stone.theme, stone.chartColor]).toEqual(["stone", "stone"])
    const blue = normalizeConfig({
      ...nova,
      baseColor: "stone",
      theme: "blue",
      chartColor: "rose",
    })
    expect([blue.theme, blue.chartColor]).toEqual(["blue", "rose"])
    expect(
      normalizeConfig({
        ...nova,
        menuAccent: "bold",
        menuColor: "inverted-translucent",
      }).menuAccent
    ).toBe("subtle")
    expect(
      normalizeConfig({ ...nova, font: "inter", fontHeading: "inter" })
        .fontHeading
    ).toBe("inherit")
    expect(valid(normalizeConfig({ ...nova, baseColor: "gray" }))).toBe(true)
  })

  test("named presets are valid, and shuffling gives valid ones", () => {
    for (const config of Object.values(NAMED_PRESETS)) {
      expect(normalizeConfig(config)).toEqual({
        ...config,
        chartColor: normalizeConfig(config).chartColor,
      })
    }
    for (let i = 0; i < 500; i++) expect(valid(randomConfig())).toBe(true)
  })
})
