import { describe, expect, test } from "bun:test"
import {
  mapBackdropClasses,
  mapPopupClasses,
} from "../../src/adapters/families/dialog"
import { splitVariants } from "../../src/adapters/families/util"

describe("dialog family class mapping", () => {
  test("splitVariants ignores colons inside brackets", () => {
    expect(splitVariants("supports-[display:grid]:data-open:grid")).toEqual([
      "supports-[display:grid]",
      "data-open",
      "grid",
    ])
  })

  test("popup: open and closed states map to open/not-open, hiding waits for the exit", () => {
    expect(
      mapPopupClasses(
        "fixed grid data-open:animate-in data-closed:animate-out sm:data-open:zoom-in-95"
      )
    ).toBe(
      "fixed grid open:animate-in not-open:animate-out sm:open:zoom-in-95 not-open:hidden transition-[display,overlay] transition-discrete"
    )
  })

  test("popup: transition styles use @starting-style and the closed state", () => {
    expect(
      mapPopupClasses(
        "transition data-starting-style:opacity-0 data-ending-style:opacity-0 data-[side=left]:data-ending-style:-translate-x-4"
      )
    ).toBe(
      "transition starting:opacity-0 not-open:opacity-0 data-[side=left]:not-open:-translate-x-4 not-open:hidden transition-discrete"
    )
  })

  test("popup: other transition properties fail generation", () => {
    expect(() => mapPopupClasses("transition-opacity")).toThrow(
      "cannot keep display/overlay transitions alongside transition-opacity"
    )
  })

  test("overlay classes move to ::backdrop without positioning", () => {
    expect(
      mapBackdropClasses(
        "fixed inset-0 isolate z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs data-open:fade-in-0 data-closed:fade-out-0"
      )
    ).toBe(
      "backdrop:bg-black/10 supports-backdrop-filter:backdrop:backdrop-blur-xs open:backdrop:fade-in-0 not-open:backdrop:fade-out-0"
    )
  })
})
