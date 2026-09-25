import { describe, expect, test } from "bun:test"
import { Button } from "../../components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "../../components/ui/popover"
import { query, render } from "../helpers/render"

describe("Popover (native popover, no JavaScript)", () => {
  test("anchors the popover to its trigger", async () => {
    const html = await render(
      <Popover id="info">
        <PopoverTrigger render={<Button variant="outline" />}>
          Info
        </PopoverTrigger>
        <PopoverContent side="top" align="end" sideOffset={6} alignOffset={2}>
          <PopoverTitle>Title</PopoverTitle>
          <PopoverDescription>Description</PopoverDescription>
        </PopoverContent>
      </Popover>
    )
    const [trigger] = await query(html, '[data-slot="popover-trigger"]')
    expect(trigger?.attributes).toMatchObject({
      command: "toggle-popover",
      commandfor: "info",
      "aria-haspopup": "dialog",
      style: "anchor-name:--info",
    })
    const [popup] = await query(html, '[data-slot="popover-content"]')
    expect(popup?.attributes).toMatchObject({
      id: "info",
      popover: "auto",
      role: "dialog",
      "aria-labelledby": "info-title",
      "aria-describedby": "info-description",
      "data-side": "top",
      "data-align": "end",
      style:
        "position-anchor:--info;position-area:top span-x-start;position-try-fallbacks:flip-block;margin-bottom:6px;margin-inline-end:2px;--transform-origin:100% 100%;--anchor-width:anchor-size(width);--anchor-height:anchor-size(height);--available-width:100%;--available-height:100%",
    })
    expect(popup?.classes).toEqual(
      expect.arrayContaining([
        "open:animate-in",
        "not-open:animate-out",
        "not-open:hidden",
        "transition-discrete",
      ])
    )
    expect((await query(html, "h2"))[0]?.attributes.id).toBe("info-title")
    expect(html).not.toContain("<script")
  })

  test("keeps a string style and defaults to below, centered", async () => {
    const html = await render(
      <Popover id="p">
        <PopoverTrigger style="color:red">Open</PopoverTrigger>
        <PopoverContent />
      </Popover>
    )
    expect((await query(html, "button"))[0]?.attributes.style).toBe(
      "anchor-name:--p;color:red"
    )
    expect(
      (await query(html, '[data-slot="popover-content"]'))[0]?.attributes.style
    ).toContain("position-area:bottom;")
  })
})
