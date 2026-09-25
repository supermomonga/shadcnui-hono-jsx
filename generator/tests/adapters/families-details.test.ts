import { describe, expect, test } from "bun:test"
import {
  mapDisclosureClasses,
  mapItemClasses,
  mapPanelClasses,
} from "../../src/adapters/families/details"

describe("details family class mapping", () => {
  test("trigger state maps to the parent <details open>", () => {
    expect(
      mapDisclosureClasses(
        "hidden group-aria-expanded/accordion-trigger:inline aria-expanded:underline group-data-panel-open:rotate-180 sm:data-panel-open:font-bold"
      )
    ).toBe(
      "hidden group-[[open]>&]/accordion-trigger:inline [[open]>&]:underline group-[[open]>&]:rotate-180 sm:[[open]>&]:font-bold"
    )
  })

  test("item state maps to open and not-open", () => {
    expect(
      mapItemClasses("border-b data-open:bg-muted data-closed:opacity-80")
    ).toBe("border-b open:bg-muted not-open:opacity-80")
  })

  test("panel animations are dropped", () => {
    expect(
      mapPanelClasses(
        "overflow-hidden text-sm data-open:animate-accordion-down data-closed:animate-accordion-up data-starting-style:h-0"
      )
    ).toBe("overflow-hidden text-sm")
  })
})
