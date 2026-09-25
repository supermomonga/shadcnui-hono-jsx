import { describe, expect, test } from "bun:test"
import {
  mapPartClasses,
  mapRootClasses,
  splitHitArea,
} from "../../src/adapters/families/controls"
import { rewriteControlState } from "../../src/transformers/steps/control-state"

describe("control family class mapping", () => {
  test("root state reads the input inside the root", () => {
    expect(
      mapRootClasses(
        "peer data-checked:bg-primary data-unchecked:bg-input focus-visible:ring-3 aria-invalid:aria-checked:border-primary group-has-[:focus-visible]/field-label:not-data-checked:border-input disabled:opacity-50"
      )
    ).toBe(
      "peer has-checked:bg-primary not-has-checked:bg-input has-focus-visible:ring-3 has-aria-invalid:has-checked:border-primary group-has-[:focus-visible]/field-label:not-has-checked:border-input disabled:opacity-50"
    )
  })

  test("disabled: maps only for roots that were native buttons", () => {
    expect(
      mapRootClasses("aria-pressed:bg-muted disabled:opacity-50", true)
    ).toBe("has-checked:bg-muted has-disabled:opacity-50")
  })

  test("inner parts use the input as their peer", () => {
    expect(
      mapPartClasses(
        "group-data-[size=sm]/switch:data-checked:translate-x-3 dark:data-unchecked:bg-foreground"
      )
    ).toBe(
      "group-data-[size=sm]/switch:peer-checked:translate-x-3 dark:peer-not-checked:bg-foreground"
    )
  })

  test("the ::after hit area moves to the input", () => {
    expect(
      splitHitArea(
        "relative size-4 after:absolute after:-inset-x-3 after:-inset-y-2"
      )
    ).toEqual({
      root: "relative size-4",
      hitArea: "absolute -inset-x-3 -inset-y-2",
    })
    expect(splitHitArea("relative size-4").hitArea).toBe("absolute inset-0")
    expect(() => splitHitArea("after:bg-red-500")).toThrow(
      "unexpected ::after class"
    )
  })

  test("other components read the native checked state", () => {
    expect(
      rewriteControlState(
        "has-data-checked:bg-primary/5 dark:has-data-checked:border-primary/20"
      )
    ).toBe("has-checked:bg-primary/5 dark:has-checked:border-primary/20")
  })
})
