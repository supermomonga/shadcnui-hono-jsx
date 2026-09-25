import { describe, expect, test } from "bun:test"
import {
  mapItemClasses,
  mapPickerClasses,
  mapTriggerClasses,
} from "../../src/adapters/families/select"

describe("select family class mapping", () => {
  test("popup classes style the picker and read the select's state", () => {
    expect(
      mapPickerClasses(
        "relative isolate z-50 w-(--anchor-width) data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-open:animate-in data-closed:fade-out-0"
      )
    ).toBe(
      "[&::picker(select)]:w-(--anchor-width) data-[side=bottom]:[&::picker(select)]:slide-in-from-top-2 open:[&::picker(select)]:animate-in not-open:[&::picker(select)]:fade-out-0"
    )
  })

  test("trigger child variants reach through the button, placeholder reads the option", () => {
    expect(
      mapTriggerClasses(
        "*:data-[slot=select-value]:flex data-placeholder:text-muted-foreground focus-visible:ring-3"
      )
    ).toBe(
      "**:data-[slot=select-value]:flex has-[option[data-placeholder]:checked]:text-muted-foreground focus-visible:ring-3"
    )
  })

  test("items use native option state", () => {
    expect(mapItemClasses("focus:bg-accent data-disabled:opacity-50")).toBe(
      "focus:bg-accent disabled:opacity-50 [&::checkmark]:hidden disabled:text-inherit"
    )
  })
})
