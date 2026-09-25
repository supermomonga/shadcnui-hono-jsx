import { describe, expect, test } from "bun:test"
import {
  mapBackdropClasses,
  mapPopupClasses,
  splitVariants,
} from "../../src/adapters/components/dialog"

describe("dialog adapter class mapping", () => {
  test("splitVariants ignores colons inside brackets", () => {
    expect(splitVariants("supports-[display:grid]:data-open:grid")).toEqual([
      "supports-[display:grid]",
      "data-open",
      "grid",
    ])
  })

  test("popup: data-open becomes open, closed-state classes are dropped, hiding is restored", () => {
    expect(
      mapPopupClasses(
        "fixed grid data-open:animate-in data-closed:animate-out sm:data-open:zoom-in-95"
      )
    ).toBe("fixed grid open:animate-in sm:open:zoom-in-95 not-open:hidden")
  })

  test("overlay classes move to ::backdrop without positioning", () => {
    expect(
      mapBackdropClasses(
        "fixed inset-0 isolate z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs data-open:fade-in-0 data-closed:fade-out-0"
      )
    ).toBe(
      "backdrop:bg-black/10 supports-backdrop-filter:backdrop:backdrop-blur-xs open:backdrop:fade-in-0"
    )
  })
})
