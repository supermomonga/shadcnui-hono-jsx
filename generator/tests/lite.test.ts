import { describe, expect, test } from "bun:test"
import { config } from "../../generator.config"
import { forStyle } from "../src/config"
import { GenerationError } from "../src/generate"
import {
  generateLite,
  LITE_COMPONENTS,
  liteParts,
  resolveLiteClasses,
} from "../src/lite"
import { ROOT } from "../src/paths"
import { UpstreamStore } from "../src/upstream/store"

const store = new UpstreamStore(ROOT, config.style)
const lock = (() => {
  const value = store.readLock()
  if (!value) throw new Error("upstream/lock.json is missing")
  return value
})()

describe("lite alternatives (docs/adr/0028)", () => {
  test.each(
    config.styles.flatMap((style) =>
      Object.keys(LITE_COMPONENTS).map((name) => [name, style] as const)
    )
  )("%s translates without blocking reasons in %s", (name, style) => {
    expect(name.endsWith("-lite")).toBe(true)
    expect(config.components).not.toContain(name)
    const generated = generateLite(name, {
      config: forStyle(config, style),
      lock,
      store: store.forStyle(style),
    })
    expect(generated.mode).toBe("lite")
    expect(generated.file.path).toBe(
      `cli/generated/templates/${style}/${name}.tsx`
    )
    expect(generated.file.text).toContain("not a port of upstream code")
    expect(generated.file.text).not.toMatch(/lite:[a-z]/)
  })

  test("an upstream change in any style stops generation until the alternative is reviewed", () => {
    const changed = structuredClone(lock)
    const entry = changed.styles["base-lyra"]?.items["input-otp"]
    if (!entry) throw new Error("input-otp is not snapshotted in base-lyra")
    entry.contentSha256 = "0".repeat(64)
    const run = () =>
      generateLite("input-otp-lite", { config, lock: changed, store })
    expect(run).toThrow(GenerationError)
    expect(run).toThrow(/upstream input-otp changed/)
  })
})

describe("lite classes", () => {
  test("follow upstream parts of each style", () => {
    const classes = (style: string) =>
      LITE_COMPONENTS["input-otp-lite"]?.classes?.(
        liteParts(store.forStyle(style))
      )
    expect(classes("base-nova")?.slot).toContain("size-8")
    expect(classes("base-nova")?.slot).toContain(
      "group-has-focus-visible/input-otp:border-ring"
    )
    expect(classes("base-lyra")?.slot).toContain("text-xs")
    // Sera's slots are underlined and spaced by the group's gap.
    expect(classes("base-sera")?.slot).toContain(
      "group-has-focus-visible/input-otp:border-b-ring"
    )
    expect(classes("base-sera")?.input).toContain(
      "tracking-[calc(--spacing(11)-1ch)]"
    )
    const datePicker = (style: string) =>
      LITE_COMPONENTS["date-picker-lite"]?.classes?.(
        liteParts(store.forStyle(style))
      )
    expect(datePicker("base-nova")).toEqual({
      "icon-inset": "left-2.5",
      "text-inset": "pl-8",
    })
    expect(datePicker("base-maia")).toEqual({
      "icon-inset": "left-3",
      "text-inset": "pl-8.5",
    })
  })

  test("resolveLiteClasses replaces every token and uses every value", () => {
    expect(
      resolveLiteClasses("x", `"a lite:one b" "lite:two"`, {
        one: "p-1",
        two: "m-2",
      })
    ).toBe(`"a p-1 b" "m-2"`)
    expect(() => resolveLiteClasses("x", `"lite:one"`, {})).toThrow(
      /no value for lite:one/
    )
    expect(() =>
      resolveLiteClasses("x", `"lite:one"`, { one: "a", two: "b" })
    ).toThrow(/lite:two unused/)
  })
})
