import { describe, expect, test } from "bun:test"
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area"
import { query, render } from "../helpers/render"

describe("ScrollArea (native scrolling, /shadcn/scroll-area.js)", () => {
  test("scrolls natively and hides the custom scrollbars until the script runs", async () => {
    const html = await render(
      <ScrollArea class="h-40">
        <p>Content</p>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    )
    const [viewport] = await query(html, '[data-slot="scroll-area-viewport"]')
    expect(viewport?.attributes.style).toBe("overflow:auto")
    const scrollbars = await query(html, '[data-slot="scroll-area-scrollbar"]')
    expect(
      scrollbars.map((s) => [
        s.attributes["data-orientation"],
        "hidden" in s.attributes,
      ])
    ).toEqual([
      ["horizontal", true],
      ["vertical", true],
    ])
    expect(scrollbars[0]?.attributes.style).toContain(
      "inset-inline-end:var(--scroll-area-corner-width)"
    )
    const [corner] = await query(html, "[data-scroll-area-corner]")
    expect(corner?.attributes).toHaveProperty("hidden")
  })
})
