import { afterEach, describe, expect, test } from "bun:test"
import * as upstream from "shadcn/preset"
import { ROOT } from "../../generator/src/paths"
import { UpstreamStore } from "../../generator/src/upstream/store"
import { config } from "../../generator.config"
import * as vendored from "../generated/shadcn-preset.js"
import { UsageError } from "../src/errors"
import {
  DEFAULT_PRESET,
  mergePreset,
  readNamedPresets,
  resolvePreset,
} from "../src/preset"
import { initUrl, styleItemUrl } from "../src/shadcn"

describe("vendored shadcn/preset", () => {
  test("exports what the pinned shadcn package exports", () => {
    expect(Object.keys(vendored).sort()).toEqual(Object.keys(upstream).sort())
    expect(vendored.PRESET_STYLES).toEqual(upstream.PRESET_STYLES)
    expect(vendored.PRESET_FONTS).toEqual(upstream.PRESET_FONTS)
  })

  test("decodes and encodes like the pinned shadcn package", () => {
    const codes = [
      "b0",
      "b3ZgkpTRjc",
      "a1Dg5eFl",
      ...Array.from({ length: 200 }, () => upstream.generateRandomPreset()),
    ]
    for (const code of codes) {
      const decoded = vendored.decodePreset(code)
      expect(decoded).toEqual(upstream.decodePreset(code))
      if (decoded) {
        expect(vendored.encodePreset(decoded)).toBe(
          upstream.encodePreset(decoded)
        )
      }
    }
  })
})

describe("resolvePreset", () => {
  test("resolves named presets to their codes", () => {
    const named = readNamedPresets()
    expect(Object.keys(named)).toEqual([...upstream.PRESET_STYLES])
    for (const [name, preset] of Object.entries(named)) {
      const resolved = resolvePreset(name)
      expect(resolved.config).toEqual(preset)
      expect(upstream.decodePreset(resolved.code)).toEqual(preset)
    }
  })

  test("decodes preset codes", () => {
    expect(resolvePreset("b3ZgkpTRjc")).toEqual({
      code: "b3ZgkpTRjc",
      config: upstream.decodePreset("b3ZgkpTRjc") as upstream.PresetConfig,
    })
  })

  test("rejects anything else", () => {
    expect(() => resolvePreset("not a preset!")).toThrow(UsageError)
  })
})

describe("mergePreset", () => {
  const base = resolvePreset("nova")
  const other = resolvePreset("b3ZgkpTRjc")

  test("takes only the theme or font fields and re-encodes", () => {
    const theme = mergePreset(base, other, ["theme"])
    expect(theme.config).toEqual({
      ...base.config,
      baseColor: other.config.baseColor,
      theme: other.config.theme,
      chartColor: other.config.chartColor,
      radius: other.config.radius,
      menuAccent: other.config.menuAccent,
    })
    expect(upstream.decodePreset(theme.code)).toEqual(theme.config)
    const font = mergePreset(base, other, ["font"])
    expect(font.config).toEqual({
      ...base.config,
      font: other.config.font,
      fontHeading: other.config.fontHeading,
    })
  })
})

describe("shadcn URLs", () => {
  afterEach(() => {
    delete process.env.REGISTRY_URL
  })

  test("the default preset's /init URL is the snapshotted theme URL", () => {
    const lock = new UpstreamStore(ROOT, config.style).readLock()
    expect(
      initUrl(resolvePreset(DEFAULT_PRESET), { rtl: false, pointer: false })
    ).toBe(lock?.theme?.url as string)
  })

  test("adds chart color, heading font, rtl and pointer like the shadcn CLI", () => {
    const url = new URL(
      initUrl(resolvePreset("b3ZgkpTRjc"), { rtl: true, pointer: true })
    )
    expect(url.searchParams.get("chartColor")).toBe("cyan")
    expect(url.searchParams.get("fontHeading")).toBe("geist")
    expect(url.searchParams.get("rtl")).toBe("true")
    expect(url.searchParams.get("pointer")).toBe("true")
    expect(url.searchParams.get("preset")).toBe("b3ZgkpTRjc")
  })

  test("honors REGISTRY_URL like the shadcn CLI", () => {
    process.env.REGISTRY_URL = "http://localhost:4000/r"
    expect(
      initUrl(resolvePreset("nova"), { rtl: false, pointer: false })
    ).toStartWith("http://localhost:4000/init?")
    expect(styleItemUrl("base-nova", "font-geist")).toBe(
      "http://localhost:4000/r/styles/base-nova/font-geist.json"
    )
  })
})
