import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"
import { encodePreset } from "../../cli/generated/shadcn-preset.js"
import { readNamedPresets } from "../../cli/src/preset"
import { snapshotFetch } from "../../generator/src/dev-install"
import { type PresetResponse, presetApi } from "../app/api/preset"

const api = presetApi(snapshotFetch())

describe("/api/preset", () => {
  test("returns the theme.css that init writes", async () => {
    const code = encodePreset(readNamedPresets().nova)
    const response = await api.request(`/api/preset?preset=${code}`)
    expect(response.status).toBe(200)
    const body = (await response.json()) as PresetResponse
    const installed = readFileSync(
      path.join(
        import.meta.dirname,
        "../.installs/nova/styles/shadcn/theme.css"
      ),
      "utf8"
    )
    expect(body.css).toBe(installed)
    expect(body.fontPackages).toEqual(["@fontsource-variable/geist"])
    expect(Object.keys(body.cssVars.light ?? {})).toContain("primary")
  })

  test("rejects what is not a preset code", async () => {
    const response = await api.request("/api/preset?preset=https://example.com")
    expect(response.status).toBe(400)
  })
})
