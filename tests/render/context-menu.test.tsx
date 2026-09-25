import { describe, expect, test } from "bun:test"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../components/ui/context-menu"
import { query, render } from "../helpers/render"

describe("ContextMenu (opened at the pointer by /shadcn/menu.js)", () => {
  test("the trigger area carries the menu id and the moving anchor", async () => {
    const html = await render(
      <ContextMenu id="file">
        <ContextMenuTrigger class="h-40">Right click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Open</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
    const [area] = await query(html, '[data-slot="context-menu-trigger"]')
    expect(area?.tag).toBe("div")
    expect(area?.attributes["data-context-menu"]).toBe("file")
    const [anchor] = await query(html, "[data-context-menu-anchor]")
    expect(anchor?.attributes.style).toContain("anchor-name:--file")
    const [menu] = await query(html, '[role="menu"]')
    expect(menu?.attributes).toMatchObject({
      id: "file",
      popover: "auto",
      "data-side": "right",
      "data-align": "start",
    })
    // No trigger element labels a context menu.
    expect(menu?.attributes).not.toHaveProperty("aria-labelledby")
    expect(menu?.attributes.style).toContain("position-anchor:--file;")
  })
})
