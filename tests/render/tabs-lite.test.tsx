import { describe, expect, test } from "bun:test"
import {
  TabsLite,
  TabsLiteContent,
  TabsLiteList,
  TabsLiteTrigger,
  tabsLiteListVariants,
} from "../../components/ui/tabs-lite"
import { query, render } from "../helpers/render"

const settings = (props: { value?: string; orientation?: "vertical" }) => (
  <TabsLite {...props}>
    <TabsLiteList aria-label="Settings" variant="line">
      <TabsLiteTrigger value="account" href="/settings/account">
        Account
      </TabsLiteTrigger>
      <TabsLiteTrigger value="password" href="/settings/password">
        Password
      </TabsLiteTrigger>
      <TabsLiteTrigger value="billing" href="/settings/billing" disabled>
        Billing
      </TabsLiteTrigger>
    </TabsLiteList>
    <TabsLiteContent>The account page.</TabsLiteContent>
  </TabsLite>
)

describe("TabsLite (lite alternative, links, no JavaScript)", () => {
  test("renders a navigation of links rather than the ARIA tabs pattern", async () => {
    const html = await render(settings({ value: "account" }))
    const [list] = await query(html, "nav")
    expect(list?.attributes).toMatchObject({
      "data-slot": "tabs-lite-list",
      "data-variant": "line",
      "aria-label": "Settings",
    })
    expect(html).not.toMatch(/role="(tablist|tab|tabpanel)"/)
    expect(html).not.toContain("aria-selected")
    expect(html).not.toContain("<script")
    const [content] = await query(html, '[data-slot="tabs-lite-content"]')
    expect(content?.attributes.role).toBeUndefined()
    expect(content?.attributes.hidden).toBeUndefined()
  })

  test("marks the trigger of the root's value as the current page", async () => {
    const html = await render(settings({ value: "account" }))
    const [account, password] = await query(
      html,
      '[data-slot="tabs-lite-trigger"]'
    )
    expect(account?.tag).toBe("a")
    expect(account?.attributes).toMatchObject({
      href: "/settings/account",
      "aria-current": "page",
      "data-active": "",
    })
    expect(password?.attributes.href).toBe("/settings/password")
    expect(password?.attributes["aria-current"]).toBeUndefined()
    expect(password?.attributes["data-active"]).toBeUndefined()
  })

  test("renders a disabled trigger as an unavailable link without href", async () => {
    const html = await render(settings({ value: "account" }))
    const [, , billing] = await query(html, '[data-slot="tabs-lite-trigger"]')
    expect(billing?.attributes).toMatchObject({
      role: "link",
      "aria-disabled": "true",
      "data-disabled": "",
    })
    expect(billing?.attributes.href).toBeUndefined()
  })

  test("selects no trigger without a value", async () => {
    const html = await render(settings({}))
    expect(await query(html, "[aria-current], [data-active]")).toEqual([])
  })

  test("passes the orientation to every part", async () => {
    const html = await render(settings({ orientation: "vertical" }))
    const [root] = await query(html, '[data-slot="tabs-lite"]')
    expect(root?.attributes["data-orientation"]).toBe("vertical")
    const [list] = await query(html, "nav")
    expect(list?.attributes["data-orientation"]).toBe("vertical")
    for (const trigger of await query(
      html,
      '[data-slot="tabs-lite-trigger"]'
    )) {
      expect(trigger.attributes["data-orientation"]).toBe("vertical")
    }
  })

  test("takes classes and exports the list variants", async () => {
    const html = await render(
      <TabsLite value="a" class="w-80">
        <TabsLiteList class="w-full">
          <TabsLiteTrigger value="a" href="#a" class="grow">
            A
          </TabsLiteTrigger>
        </TabsLiteList>
      </TabsLite>
    )
    const [root] = await query(html, '[data-slot="tabs-lite"]')
    expect(root?.classes).toContain("w-80")
    expect(root?.classes).toContain("group/tabs")
    const [list] = await query(html, "nav")
    expect(list?.attributes["data-variant"]).toBe("default")
    expect(list?.classes).toContain("w-full")
    const [trigger] = await query(html, "a")
    expect(trigger?.classes).toContain("grow")
    expect(tabsLiteListVariants({ variant: "line" })).toContain("gap-1")
  })
})
