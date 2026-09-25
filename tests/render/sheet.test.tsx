import { describe, expect, test } from "bun:test"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet"
import { query, render } from "../helpers/render"

const demo = (side?: "top" | "right" | "bottom" | "left") => (
  <Sheet id="settings">
    <SheetTrigger>Open</SheetTrigger>
    <SheetContent side={side}>
      <SheetHeader>
        <SheetTitle>Settings</SheetTitle>
        <SheetDescription>Adjust your preferences.</SheetDescription>
      </SheetHeader>
      <SheetFooter>
        <SheetClose>Done</SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
)

describe("Sheet (native <dialog>, no JavaScript)", () => {
  test("renders a side-anchored modal dialog", async () => {
    const html = await render(demo())
    const [dialog] = await query(html, "dialog")
    expect(dialog?.attributes).toMatchObject({
      id: "settings",
      closedby: "any",
      "aria-labelledby": "settings-title",
      "aria-describedby": "settings-description",
      "data-slot": "sheet-content",
      "data-side": "right",
    })
    expect(dialog?.attributes).not.toHaveProperty("role")
    // Entry transitions use @starting-style; exit transitions the closed state.
    expect(dialog?.classes).toEqual(
      expect.arrayContaining([
        "starting:opacity-0",
        "not-open:opacity-0",
        "data-[side=right]:starting:translate-x-[2.5rem]",
        "data-[side=right]:not-open:translate-x-[2.5rem]",
        "starting:backdrop:opacity-0",
        "not-open:backdrop:opacity-0",
        "transition-discrete",
        "inset-auto",
      ])
    )
    expect(dialog?.classes.some((c) => c.includes("ending-style"))).toBe(false)
    expect((await query(html, "h2"))[0]?.attributes.id).toBe("settings-title")
  })

  test("wires the trigger and every close button to the dialog", async () => {
    const html = await render(demo("left"))
    const [trigger] = await query(html, '[data-slot="sheet-trigger"]')
    expect(trigger?.attributes).toMatchObject({
      command: "show-modal",
      commandfor: "settings",
    })
    const closes = await query(html, '[data-slot="sheet-close"]')
    expect(closes.map((c) => c.attributes.commandfor)).toEqual([
      "settings",
      "settings",
    ])
    expect((await query(html, "dialog"))[0]?.attributes["data-side"]).toBe(
      "left"
    )
  })
})
