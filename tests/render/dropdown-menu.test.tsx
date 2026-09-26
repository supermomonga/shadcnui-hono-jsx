import { describe, expect, test } from "bun:test"
import { Button } from "../../components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { query, render } from "../helpers/render"

const demo = (
  <DropdownMenu id="actions">
    <DropdownMenuTrigger render={<Button variant="outline" />}>
      Open
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuGroup>
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuItem render={<a href="/profile" />}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Settings</DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem defaultChecked>
        Status bar
      </DropdownMenuCheckboxItem>
      <DropdownMenuRadioGroup defaultValue="b">
        <DropdownMenuRadioItem value="a">A</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="b">B</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem>Email</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuContent>
  </DropdownMenu>
)

describe("DropdownMenu (native popover with /shadcn/menu.js)", () => {
  test("the trigger opens the popover menu natively", async () => {
    const html = await render(demo)
    const [trigger] = await query(html, '[data-slot="dropdown-menu-trigger"]')
    expect(trigger?.attributes).toMatchObject({
      id: "actions-trigger",
      command: "toggle-popover",
      commandfor: "actions",
      "aria-haspopup": "menu",
      "aria-expanded": "false",
      style: "anchor-name:--actions",
    })
    const [menu] = await query(html, '[data-slot="dropdown-menu-content"]')
    expect(menu?.attributes).toMatchObject({
      id: "actions",
      popover: "auto",
      role: "menu",
      tabindex: "-1",
      "aria-labelledby": "actions-trigger",
      "data-side": "bottom",
      "data-align": "start",
    })
    expect(menu?.attributes.style).toContain("position-area:bottom span-x-end;")
    expect(html).not.toContain("<script")
  })

  test("renders Base UI's item roles and state", async () => {
    const html = await render(demo)
    const [link] = await query(html, "a[role=menuitem]")
    expect(link?.attributes).toMatchObject({ href: "/profile", tabindex: "0" })
    const [disabled] = await query(html, '[aria-disabled="true"]')
    expect(disabled?.attributes).toMatchObject({
      role: "menuitem",
      "data-disabled": "",
    })
    const [checkbox] = await query(html, '[role="menuitemcheckbox"]')
    expect(checkbox?.attributes).toMatchObject({
      "aria-checked": "true",
      "data-checked": "",
    })
    const radios = await query(html, '[role="menuitemradio"]')
    expect(
      radios.map((r) => [
        r.attributes["data-value"],
        r.attributes["aria-checked"],
      ])
    ).toEqual([
      ["a", "false"],
      ["b", "true"],
    ])
    const [group] = await query(html, '[data-slot="dropdown-menu-group"]')
    const [label] = await query(html, '[data-slot="dropdown-menu-label"]')
    expect(group?.attributes["aria-labelledby"]).toBe(label?.attributes.id)
    expect(label?.attributes["aria-hidden"]).toBe("true")
    const [separator] = await query(html, '[role="separator"]')
    expect(separator?.attributes["aria-orientation"]).toBe("horizontal")
  })

  test("a submenu trigger controls its nested popover", async () => {
    const html = await render(demo)
    const [sub] = await query(html, '[data-slot="dropdown-menu-sub-trigger"]')
    const menus = await query(html, '[role="menu"]')
    expect(sub?.attributes).toMatchObject({
      role: "menuitem",
      "aria-haspopup": "menu",
      "aria-controls": menus[1]?.attributes.id,
    })
    // Like Base UI, a submenu trigger has no aria-expanded.
    expect(sub?.attributes).not.toHaveProperty("aria-expanded")
    expect(menus[1]?.attributes["aria-labelledby"]).toBe(sub?.attributes.id)
    expect(menus[1]?.attributes["data-side"]).toBe("right")
    expect(menus[1]?.attributes.style).toContain("margin-block-start:-3px")
  })
})
