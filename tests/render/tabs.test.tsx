import { describe, expect, test } from "bun:test"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs"
import { query, render } from "../helpers/render"

const demo = (props: { defaultValue?: string } = {}) => (
  <Tabs {...props}>
    <TabsList variant="line" activateOnFocus loopFocus={false}>
      <TabsTrigger value="first" disabled>
        First
      </TabsTrigger>
      <TabsTrigger value="second">Second</TabsTrigger>
      <TabsTrigger value="third item">Third</TabsTrigger>
    </TabsList>
    <TabsContent value="first">One</TabsContent>
    <TabsContent value="second">Two</TabsContent>
    <TabsContent value="third item">Three</TabsContent>
  </Tabs>
)

describe("Tabs (ARIA tabs, switched by /shadcn/tabs.js)", () => {
  test("renders the tabs pattern with Base UI's state attributes", async () => {
    const html = await render(demo({ defaultValue: "third item" }))
    const [list] = await query(html, '[role="tablist"]')
    expect(list?.attributes).toMatchObject({
      "data-slot": "tabs-list",
      "data-variant": "line",
      "data-orientation": "horizontal",
      "data-activate-on-focus": "",
      "data-loop-focus": "false",
    })
    const tabs = await query(html, '[role="tab"]')
    const panels = await query(html, '[role="tabpanel"]')
    expect(tabs.map((t) => t.attributes["aria-selected"])).toEqual([
      "false",
      "false",
      "true",
    ])
    expect(tabs[2]?.attributes).toMatchObject({
      tabindex: "0",
      "data-active": "",
      "aria-controls": panels[2]?.attributes.id,
    })
    expect(tabs[2]?.attributes["aria-controls"]).toMatch(/-panel-third_item$/)
    expect(tabs[0]?.attributes).toMatchObject({
      "aria-disabled": "true",
      "data-disabled": "",
      tabindex: "-1",
    })
    expect(panels.map((p) => "hidden" in p.attributes)).toEqual([
      true,
      true,
      false,
    ])
    expect(panels[2]?.attributes["aria-labelledby"]).toBe(
      tabs[2]?.attributes.id
    )
  })

  test("selects the first enabled tab by default", async () => {
    const html = await render(demo())
    const selected = (await query(html, '[aria-selected="true"]')).map(
      (t) => t.attributes["aria-controls"]
    )
    expect(selected).toHaveLength(1)
    expect(selected[0]).toMatch(/-panel-second$/)
  })

  test("renders no script itself", async () => {
    expect(await render(demo())).not.toContain("<script")
  })
})
