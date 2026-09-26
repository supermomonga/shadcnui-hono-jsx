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
import { OPTIONS, PICKERS } from "../app/lib/create-options"

describe("the create page's options", () => {
  test("are the pinned shadcn/preset's values, so codes match ui.shadcn.com's", () => {
    const values = (param: keyof typeof OPTIONS) =>
      OPTIONS[param].map((option) => option.value)
    expect(values("style")).toEqual([...PRESET_STYLES])
    expect(values("baseColor")).toEqual([...PRESET_BASE_COLORS])
    expect(values("theme")).toEqual([...PRESET_THEMES])
    expect(values("chartColor")).toEqual([...PRESET_CHART_COLORS])
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
