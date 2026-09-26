/**
 * The preset of the development install in the repository root (`bun run
 * dev:install [--style <style>] [--rtl] [--menu-color <color>]
 * [--icon-library <library>]`) that the pages were rendered with.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { resolvePreset } from "../../cli/src/preset"
import type { Variant } from "../../cli/src/variants"

const installed = JSON.parse(
  readFileSync(
    path.resolve(import.meta.dirname, "../../shadcnui-hono-jsx.json"),
    "utf8"
  )
) as { preset: string; rtl: boolean }

export const PRESET = resolvePreset(installed.preset).config
export const STYLE = `base-${PRESET.style}`
export const VARIANT: Variant = {
  rtl: installed.rtl,
  menuColor: PRESET.menuColor,
}

/** The inline arrow keys in reading order, for behavior steps. */
export const [BACK_KEY, FORWARD_KEY] = VARIANT.rtl
  ? (["ArrowRight", "ArrowLeft"] as const)
  : (["ArrowLeft", "ArrowRight"] as const)
