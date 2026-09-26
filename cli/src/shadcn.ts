import { UsageError } from "./errors"
import type { Preset } from "./preset"
import type { ThemeItem } from "./theme"

/** Used by `init` without `--preset`, like `shadcn init --defaults`. */
export const DEFAULT_PRESET = "nova"

/** `fetch`, replaceable in tests and in the repository's development install. */
export type FetchJson = (url: string) => Promise<unknown>

/** The registry the shadcn CLI uses; `REGISTRY_URL` overrides it as for the shadcn CLI. */
export function registryUrl(): string {
  return process.env.REGISTRY_URL ?? "https://ui.shadcn.com/r"
}

function shadcnUrl(): string {
  return registryUrl().replace(/\/r\/?$/, "")
}

export interface PresetFlags {
  rtl: boolean
  pointer: boolean
}

/**
 * The `registry:base` URL the shadcn CLI builds for a preset
 * (`resolveInitUrl`), without its template and tracking parameters.
 */
export function initUrl(preset: Preset, flags: PresetFlags): string {
  const c = preset.config
  const params = new URLSearchParams({
    base: "base",
    style: c.style,
    baseColor: c.baseColor,
    theme: c.theme,
    iconLibrary: c.iconLibrary,
    font: c.font,
    rtl: String(flags.rtl),
    menuAccent: c.menuAccent,
    menuColor: c.menuColor,
    radius: c.radius,
  })
  if (c.chartColor && c.chartColor !== "neutral")
    params.set("chartColor", c.chartColor)
  if (c.fontHeading && c.fontHeading !== "inherit")
    params.set("fontHeading", c.fontHeading)
  params.set("preset", preset.code)
  if (flags.pointer) params.set("pointer", "true")
  return `${shadcnUrl()}/init?${params.toString()}`
}

/** URL of a bare registry dependency of the base (fonts), as the shadcn CLI resolves it. */
export function styleItemUrl(style: string, name: string): string {
  return `${registryUrl()}/styles/${style}/${name}.json`
}

export const fetchJson: FetchJson = async (url) => {
  let response: Response
  try {
    response = await fetch(url, { headers: { accept: "application/json" } })
  } catch (error) {
    throw new UsageError(
      `Could not reach ${url} (${error instanceof Error ? error.message : String(error)}). The theme comes from ui.shadcn.com, like with the shadcn CLI.`
    )
  }
  if (!response.ok) {
    throw new UsageError(`GET ${url} failed with ${response.status}`)
  }
  return response.json()
}

export interface FontItem {
  name: string
  type: "registry:font"
  font: {
    family: string
    variable: string
    dependency?: string
    selector?: string
  }
}

function isFontItem(value: unknown): value is FontItem {
  const item = value as FontItem | null
  return (
    typeof item === "object" &&
    item !== null &&
    item.type === "registry:font" &&
    typeof item.font?.family === "string" &&
    typeof item.font.variable === "string"
  )
}

/** Fetches the theme of a preset and the font items it depends on. */
export async function fetchPresetTheme(
  preset: Preset,
  flags: PresetFlags,
  fetch: FetchJson
): Promise<{ url: string; theme: ThemeItem; fonts: FontItem[] }> {
  const url = initUrl(preset, flags)
  const theme = (await fetch(url)) as ThemeItem
  if (theme?.type !== "registry:base" || typeof theme.cssVars !== "object") {
    throw new UsageError(`${url} did not return a registry:base item`)
  }
  const style = theme.config?.style ?? `base-${preset.config.style}`
  const fonts: FontItem[] = []
  for (const name of theme.registryDependencies ?? []) {
    if (!name.startsWith("font-")) continue
    const itemUrl = styleItemUrl(style, name)
    const item = await fetch(itemUrl)
    if (!isFontItem(item)) {
      throw new UsageError(`${itemUrl} did not return a registry:font item`)
    }
    fonts.push(item)
  }
  return { url, theme, fonts }
}
