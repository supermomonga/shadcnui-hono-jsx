import { describe, expect, test } from "bun:test"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerOverlay,
  DrawerTitle,
  DrawerTrigger,
} from "../../components/ui/drawer"
import { query, render } from "../helpers/render"

describe("Drawer (native <dialog>, /shadcn/drawer.js)", () => {
  test("opens a native dialog with Invoker Commands", async () => {
    const html = await render(
      <Drawer id="goal" swipeDirection="right" showSwipeHandle>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Move goal</DrawerTitle>
          <DrawerDescription>Set your goal.</DrawerDescription>
          <DrawerClose>Cancel</DrawerClose>
        </DrawerContent>
      </Drawer>
    )
    const [trigger] = await query(html, '[data-slot="drawer-trigger"]')
    expect(trigger?.attributes).toMatchObject({
      command: "show-modal",
      commandfor: "goal",
      "aria-haspopup": "dialog",
    })
    const [popup] = await query(html, "dialog")
    expect(popup?.attributes).toMatchObject({
      id: "goal",
      closedby: "any",
      "aria-labelledby": "goal-title",
      "aria-describedby": "goal-description",
      "data-slot": "drawer-popup",
      "data-swipe-direction": "right",
      "data-swipe-axis": "x",
    })
    expect(popup?.attributes.style).toContain("--drawer-swipe-strength:1")
    expect(popup?.classes).toContain("not-open:hidden")
    expect(popup?.classes).toContain("backdrop:bg-black/10")
    expect(await query(html, '[data-slot="drawer-swipe-handle"]')).toHaveLength(
      1
    )
    expect(await query(html, '[data-slot="drawer-overlay"]')).toHaveLength(0)
    expect(await query(html, '[data-slot="drawer-viewport"]')).toHaveLength(0)
    const [close] = await query(html, '[data-slot="drawer-close"]')
    expect(close?.attributes).toMatchObject({
      command: "close",
      commandfor: "goal",
    })
  })

  test("the overlay renders nothing on its own", async () => {
    expect(await render(<DrawerOverlay />)).toBe("")
  })
})
