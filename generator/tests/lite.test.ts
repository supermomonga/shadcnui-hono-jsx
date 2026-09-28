import { describe, expect, test } from "bun:test"
import { readTemplate } from "../../cli/src/catalog"
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

  test("tabs-lite takes upstream's Tabs classes in each style", () => {
    const classes = (style: string) =>
      LITE_COMPONENTS["tabs-lite"]?.classes?.(liteParts(store.forStyle(style)))
    for (const style of config.styles) {
      expect(classes(style)?.root).toBe(
        "group/tabs flex gap-2 data-horizontal:flex-col"
      )
      expect(classes(style)?.trigger).toContain(
        "group-data-vertical/tabs:after:-right-1"
      )
    }
    expect(classes("base-nova")).toMatchObject({
      "list-default": "bg-muted",
      "list-line": "gap-1 bg-transparent",
    })
    expect(classes("base-nova")?.list).toContain(
      "group-data-horizontal/tabs:h-8"
    )
    expect(classes("base-vega")?.list).toContain(
      "group-data-horizontal/tabs:h-9"
    )
    expect(classes("base-sera")?.list).toContain(
      "group-data-horizontal/tabs:h-10"
    )
    expect(classes("base-luma")?.list).toContain("rounded-full")
    expect(classes("base-lyra")?.content).toBe(
      "flex-1 text-xs/relaxed outline-none"
    )
  })

  test("tabs-lite stops on upstream states and variants it does not render", () => {
    const parts = liteParts(store)
    const recipe = LITE_COMPONENTS["tabs-lite"]?.classes
    if (!recipe) throw new Error("tabs-lite has no classes")
    expect(() =>
      recipe({
        ...parts,
        variants: (item, name) => {
          const list = parts.variants(item, name)
          return {
            ...list,
            variants: { variant: { default: [], pill: [] } },
          }
        },
      })
    ).toThrow(/default and line/)
    expect(() =>
      recipe({
        ...parts,
        classes: (item, component, attribute) => [
          ...parts.classes(item, component, attribute),
          ...(component === "TabsTrigger"
            ? ["aria-selected:bg-background"]
            : []),
        ],
      })
    ).toThrow(/aria-selected/)
  })

  test("the RTL tabs-lite uses logical sides", () => {
    const rtl = readTemplate("base-nova", "tabs-lite", {
      rtl: true,
      menuColor: "default",
    })
    expect(rtl).toContain("group-data-vertical/tabs:after:-end-1")
    expect(rtl).toContain("has-data-[icon=inline-end]:pe-1")
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

describe("liteParts", () => {
  const parts = liteParts(store)

  test("classes reads every string of cn(...) and skips the passed-through attribute", () => {
    const trigger = parts.classes("tabs", "TabsTrigger")
    expect(trigger[0]).toBe("relative")
    // From the third and the fourth string.
    expect(trigger).toContain("data-active:bg-background")
    expect(trigger).toContain(
      "group-data-[variant=line]/tabs-list:data-active:after:opacity-100"
    )
    expect(trigger).not.toContain("className")
  })

  test("classes fails on other arguments of cn(...)", () => {
    expect(() => parts.classes("tabs", "TabsList")).toThrow(GenerationError)
    expect(() => parts.classes("tabs", "TabsList")).toThrow(
      /passes tabsListVariants\(\{ variant \}\) to cn/
    )
  })

  test("variants reads the base and the variants of cva(...)", () => {
    const list = parts.variants("tabs", "tabsListVariants")
    expect(list.base).toContain("group/tabs-list")
    expect(list.variants).toEqual({
      variant: { default: ["bg-muted"], line: ["gap-1", "bg-transparent"] },
    })
    expect(() => parts.variants("tabs", "missingVariants")).toThrow(
      /no cva\(\.\.\.\) in missingVariants/
    )
    expect(() => parts.variants("tabs", "Tabs")).toThrow(GenerationError)
  })
})
