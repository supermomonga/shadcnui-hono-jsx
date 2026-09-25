import { describe, expect, test } from "bun:test"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/ui/collapsible"
import { query, render } from "../helpers/render"

describe("Collapsible (native <details>, no JavaScript)", () => {
  test("renders details with the trigger as summary", async () => {
    const html = await render(
      <Collapsible defaultOpen class="w-64">
        <CollapsibleTrigger class="font-medium">Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )
    const [root] = await query(html, "details")
    expect(root?.attributes).toMatchObject({
      "data-slot": "collapsible",
      class: "w-64",
      open: "",
    })
    const [trigger] = await query(html, "summary")
    expect(trigger?.attributes["data-slot"]).toBe("collapsible-trigger")
    expect(trigger?.classes).toEqual([
      "list-none",
      "[&::-webkit-details-marker]:hidden",
      "font-medium",
    ])
    expect(
      (await query(html, '[data-slot="collapsible-content"]'))[0]?.tag
    ).toBe("div")
    expect(html).not.toContain("<script")
  })

  test("is closed by default", async () => {
    const html = await render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )
    expect((await query(html, "details"))[0]?.attributes).not.toHaveProperty(
      "open"
    )
  })

  test("requires the trigger as the first child", async () => {
    expect(() =>
      render(
        <Collapsible>
          <div>
            <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          </div>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
    ).toThrow("<CollapsibleTrigger> must be the first child of <Collapsible>")
  })
})
