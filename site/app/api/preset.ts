/**
 * `GET /api/preset?preset=<code>[&rtl=true][&pointer=true]`: the theme of a
 * preset, as `shadcnui-hono-jsx init` would install it. ui.shadcn.com/init
 * sends no CORS headers, so the Create page asks this Worker, which builds the
 * theme with the CLI's own code and caches it.
 */
import { Hono } from "hono"
import catalog from "../../../cli/generated/catalog.json"
import {
  decodePreset,
  isPresetCode,
} from "../../../cli/generated/shadcn-preset.js"
import { presetTheme } from "../../../cli/src/preset-theme"
import { type FetchJson, fetchJson } from "../../../cli/src/shadcn"

export interface PresetResponse {
  code: string
  /** `styles/shadcn/theme.css` as `init` writes it. */
  css: string
  cssVars: {
    theme?: Record<string, string>
    light?: Record<string, string>
    dark?: Record<string, string>
  }
  /** `@fontsource-variable/*` packages of the preset's fonts. */
  fontPackages: string[]
}

const MAX_AGE = 60 * 60 * 24

export function presetApi(fetch: FetchJson = fetchJson) {
  const api = new Hono()
  api.get("/api/preset", async (c) => {
    const code = c.req.query("preset") ?? ""
    const config = isPresetCode(code) ? decodePreset(code) : null
    if (!config) return c.json({ error: `"${code}" is not a preset code` }, 400)
    const flags = {
      rtl: c.req.query("rtl") === "true",
      pointer: c.req.query("pointer") === "true",
    }
    const key = new Request(
      `https://cache.invalid/api/preset?preset=${code}&rtl=${flags.rtl}&pointer=${flags.pointer}`
    )
    const cache = (globalThis as { caches?: { default?: Cache } }).caches
      ?.default
    const cached = await cache?.match(key)
    if (cached) return cached
    let body: PresetResponse
    try {
      const theme = await presetTheme(
        { code, config },
        flags,
        fetch,
        catalog.noticeLines
      )
      body = {
        code,
        css: theme.css,
        cssVars: theme.theme.cssVars,
        fontPackages: theme.fontPackages,
      }
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : String(error) },
        502
      )
    }
    const response = c.json(body, 200, {
      "cache-control": `public, max-age=${MAX_AGE}`,
    })
    await cache?.put(key, response.clone())
    return response
  })
  return api
}

export default presetApi()
