import { describe, expect, test } from "bun:test"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarTrigger,
} from "../../components/ui/menubar"
import { query, render } from "../helpers/render"

describe("Menubar (menus from dropdown-menu, /shadcn/menu.js)", () => {
  test("its triggers are menuitems with one tab stop", async () => {
    const html = await render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarRadioGroup defaultValue="b">
              <MenubarRadioItem value="a">A</MenubarRadioItem>
              <MenubarRadioItem value="b">B</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    )
    const [bar] = await query(html, '[data-slot="menubar"]')
    expect(bar?.attributes).toMatchObject({
      role: "menubar",
      "aria-orientation": "horizontal",
    })
    const triggers = await query(html, '[data-slot="menubar-trigger"]')
    expect(
      triggers.map((t) => [t.attributes.role, t.attributes.tabindex])
    ).toEqual([
      ["menuitem", "0"],
      ["menuitem", "-1"],
    ])
    // The radio items (menubar.tsx) see the radio group of dropdown-menu.tsx.
    const radios = await query(html, '[role="menuitemradio"]')
    expect(radios.map((r) => r.attributes["aria-checked"])).toEqual([
      "false",
      "true",
    ])
  })
})
