import { describe, expect, test } from "bun:test"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../../components/ui/navigation-menu"
import { query, render } from "../helpers/render"

describe("NavigationMenu (native popover, /shadcn/navigation-menu.js)", () => {
  test("renders triggers, hidden contents and the anchored positioner", async () => {
    const html = await render(
      <NavigationMenu id="nav">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Docs</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/intro" active>
                Introduction
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/blog">Blog</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )
    const [root] = await query(html, '[data-slot="navigation-menu"]')
    expect(root?.tag).toBe("nav")
    expect(root?.attributes).toMatchObject({
      id: "nav",
      "data-navigation-menu": "nav",
      "data-delay": "50",
      "data-close-delay": "50",
    })
    const [trigger] = await query(html, '[data-slot="navigation-menu-trigger"]')
    expect(trigger?.attributes).toMatchObject({
      type: "button",
      "aria-expanded": "false",
    })
    expect(trigger?.attributes.style).toContain("anchor-name:--nav-0")
    const [content] = await query(html, '[data-slot="navigation-menu-content"]')
    expect(content?.attributes).toHaveProperty("hidden")
    const [link] = await query(html, 'a[href="/intro"]')
    expect(link?.attributes).toMatchObject({
      "aria-current": "page",
      "data-active": "",
    })
    const [positioner] = await query(html, "[data-navigation-menu-positioner]")
    expect(positioner?.attributes).toMatchObject({
      popover: "manual",
      role: "presentation",
      "data-side": "bottom",
      "data-align": "start",
    })
    expect(positioner?.attributes.style).toContain("margin-top:8px")
    const [popup] = await query(html, "#nav-popup")
    expect(popup?.tag).toBe("nav")
  })
})
