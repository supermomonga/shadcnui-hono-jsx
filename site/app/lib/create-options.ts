/**
 * The choices of the Create page: the values of the pinned `shadcn/preset`
 * (so preset codes are ui.shadcn.com's), with labels for display. Shared by
 * the server-rendered customizer and its client controller.
 */
import namedPresets from "../../../cli/generated/named-presets.json"
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
  type PresetConfig,
} from "../../../cli/generated/shadcn-preset.js"

export type Param = Exclude<keyof PresetConfig, "chartColor"> | "chartColor"

export interface Option {
  value: string
  label: string
  /** A CSS color for the swatch, when the option has one. */
  swatch?: string
  description?: string
}

const WORDS: Record<string, string> = {
  dm: "DM",
  ibm: "IBM",
  eb: "EB",
  jetbrains: "JetBrains",
}

function label(value: string): string {
  return value
    .split("-")
    .map((word) => WORDS[word] ?? word[0]?.toUpperCase() + word.slice(1))
    .join(" ")
}

/** shadcn/ui's descriptions of its styles (apps/v4/registry/styles.tsx). */
const STYLE_DESCRIPTIONS: Record<string, string> = {
  vega: "Clean, neutral, and familiar",
  nova: "Reduced padding and margins",
  maia: "Rounded, with generous spacing.",
  lyra: "Boxy and sharp. For mono fonts.",
  mira: "Made for compact interfaces.",
  luma: "Fluid, luminous, and soft.",
  sera: "Editorial and typographic.",
  rhea: "Like Luma but compact.",
}

const RADIUS_LABELS: Record<string, string> = {
  default: "Default",
  none: "None",
  small: "Small",
  medium: "Medium",
  large: "Large",
}

const MENU_COLOR_LABELS: Record<string, string> = {
  default: "Default",
  inverted: "Inverted",
  "default-translucent": "Default Translucent",
  "inverted-translucent": "Inverted Translucent",
}

const ICON_LABELS: Record<string, string> = {
  lucide: "Lucide",
  hugeicons: "Hugeicons",
  tabler: "Tabler Icons",
  phosphor: "Phosphor Icons",
  remixicon: "Remix Icon",
}

const swatch = (name: string) => `var(--color-${name}-500)`

export const OPTIONS: Record<Param, Option[]> = {
  style: PRESET_STYLES.map((value) => ({
    value,
    label: label(value),
    description: STYLE_DESCRIPTIONS[value],
  })),
  baseColor: PRESET_BASE_COLORS.map((value) => ({
    value,
    label: label(value),
    swatch: swatch(value),
  })),
  theme: PRESET_THEMES.map((value) => ({
    value,
    label: label(value),
    swatch: swatch(value),
  })),
  chartColor: PRESET_CHART_COLORS.map((value) => ({
    value,
    label: label(value),
    swatch: swatch(value),
  })),
  fontHeading: PRESET_FONT_HEADINGS.map((value) => ({
    value,
    label: value === "inherit" ? "Same as Font" : label(value),
  })),
  font: PRESET_FONTS.map((value) => ({ value, label: label(value) })),
  iconLibrary: PRESET_ICON_LIBRARIES.map((value) => ({
    value,
    label: ICON_LABELS[value] ?? label(value),
  })),
  radius: PRESET_RADII.map((value) => ({
    value,
    label: RADIUS_LABELS[value] ?? label(value),
  })),
  menuColor: PRESET_MENU_COLORS.map((value) => ({
    value,
    label: MENU_COLOR_LABELS[value] ?? label(value),
  })),
  menuAccent: PRESET_MENU_ACCENTS.map((value) => ({
    value,
    label: label(value),
  })),
}

/** The customizer's pickers, in upstream's order. */
export const PICKERS: { param: Param; title: string; separator?: boolean }[] = [
  { param: "style", title: "Style", separator: true },
  { param: "baseColor", title: "Base Color" },
  { param: "theme", title: "Theme" },
  { param: "chartColor", title: "Chart Color", separator: true },
  { param: "fontHeading", title: "Heading" },
  { param: "font", title: "Font", separator: true },
  { param: "iconLibrary", title: "Icon Library" },
  { param: "radius", title: "Radius", separator: true },
  { param: "menuColor", title: "Menu Color" },
  { param: "menuAccent", title: "Menu Accent" },
]

/** The default preset of `init` and of this page. */
export const DEFAULT_CONFIG = (namedPresets as Record<string, PresetConfig>)
  .nova as PresetConfig

export const NAMED_PRESETS = namedPresets as Record<string, PresetConfig>
