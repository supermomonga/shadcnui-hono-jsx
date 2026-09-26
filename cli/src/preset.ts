import {
  decodePreset,
  encodePreset,
  isPresetCode,
  type PresetConfig,
} from "../generated/shadcn-preset.js"
import { readGenerated } from "./catalog"
import { UsageError } from "./errors"

export { DEFAULT_PRESET } from "./shadcn"
export type { PresetConfig }

export interface Preset {
  /** Preset code, also for named presets. */
  code: string
  config: PresetConfig
}

/** Named presets of the pinned shadcn CLI (`--preset nova`), vendored by `upstream:sync`. */
export function readNamedPresets(): Record<string, PresetConfig> {
  return JSON.parse(readGenerated("named-presets.json")) as Record<
    string,
    PresetConfig
  >
}

/** Resolves a preset code or a named preset. */
export function resolvePreset(value: string): Preset {
  const named = readNamedPresets()[value]
  if (named) return { code: encodePreset(named), config: named }
  const config = isPresetCode(value) ? decodePreset(value) : null
  if (!config) {
    throw new UsageError(
      `"${value}" is neither a preset code nor a preset name (${Object.keys(readNamedPresets()).join(", ")}). Create one on https://ui.shadcn.com/create.`
    )
  }
  return { code: value, config }
}

/** Preset fields that `apply --only theme` and `--only font` take from the new preset. */
export const PRESET_PARTS = {
  theme: ["baseColor", "theme", "chartColor", "radius", "menuAccent"],
  font: ["font", "fontHeading"],
} as const satisfies Record<string, readonly (keyof PresetConfig)[]>

export type PresetPart = keyof typeof PRESET_PARTS

/** The current preset with the given parts taken from `next`. */
export function mergePreset(
  current: Preset,
  next: Preset,
  parts: readonly PresetPart[]
): Preset {
  const config = { ...current.config }
  for (const part of parts) {
    for (const key of PRESET_PARTS[part]) {
      Object.assign(config, { [key]: next.config[key] })
    }
  }
  return { code: encodePreset(config), config }
}

export function presetUrl(code: string): string {
  return `https://ui.shadcn.com/create?preset=${code}`
}
