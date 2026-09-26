import { describe, expect, test } from "bun:test"
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "../../components/ui/sidebar"
import { query, render } from "../helpers/render"

const page = (defaultOpen: boolean) => (
  <SidebarProvider defaultOpen={defaultOpen}>
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive tooltip="Inbox">
              <span>Inbox</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
    <SidebarTrigger />
  </SidebarProvider>
)

describe("Sidebar (state from props, /shadcn/sidebar.js)", () => {
  test("renders the open state and the script's settings", async () => {
    const html = await render(page(true))
    const [wrapper] = await query(html, '[data-slot="sidebar-wrapper"]')
    expect(wrapper?.attributes).toMatchObject({
      "data-sidebar-cookie": "sidebar_state",
      "data-sidebar-cookie-max-age": "604800",
      "data-sidebar-shortcut": "b",
    })
    expect(wrapper?.attributes.style).toContain("--sidebar-width:16rem")
    const [sidebar] = await query(html, "[data-sidebar-collapsible]")
    expect(sidebar?.attributes).toMatchObject({
      "data-state": "expanded",
      "data-collapsible": "",
      "data-sidebar-collapsible": "icon",
    })
    const [button] = await query(html, '[data-slot="sidebar-menu-button"]')
    expect(button?.attributes).toMatchObject({
      "data-active": "",
      "data-sidebar": "menu-button",
    })
    // Tooltips of an expanded sidebar stay hidden.
    const [tooltip] = await query(html, "[data-sidebar-tooltip]")
    expect(tooltip?.attributes).toHaveProperty("hidden")
    expect(html).not.toContain("onclick")
  })

  test("renders a collapsed sidebar and an empty mobile sheet", async () => {
    const html = await render(page(false))
    const [sidebar] = await query(html, "[data-sidebar-collapsible]")
    expect(sidebar?.attributes).toMatchObject({
      "data-state": "collapsed",
      "data-collapsible": "icon",
    })
    const [tooltip] = await query(html, "[data-sidebar-tooltip]")
    expect(tooltip?.attributes).not.toHaveProperty("hidden")
    const [sheet] = await query(html, 'dialog[data-mobile="true"]')
    expect(sheet?.attributes["data-slot"]).toBe("sidebar")
    expect(html).toMatch(/<div data-sidebar-mobile="" class="[^"]*"><\/div>/)
  })

  test("useSidebar reports the state; its setters run in the browser", async () => {
    let toggle: (() => void) | undefined
    function Probe() {
      const sidebar = useSidebar()
      toggle = sidebar.toggleSidebar
      return <output>{sidebar.state}</output>
    }
    expect(
      await render(
        <SidebarProvider defaultOpen={false}>
          <Probe />
        </SidebarProvider>
      )
    ).toContain("<output>collapsed</output>")
    expect(() => toggle?.()).toThrow("/shadcn/sidebar.js")
  })
})
