import { describe, expect, test } from "bun:test"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/ui/collapsible"
import { query, render } from "../helpers/render"

describe("Collapsible (native <details>, or /shadcn/collapsible.js)", () => {
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

  test("with the trigger elsewhere, renders a button and a hidden panel", async () => {
    const html = await render(
      <Collapsible>
        <div>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        </div>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )
    expect(html).not.toContain("<details")
    const [root] = await query(html, '[data-slot="collapsible"]')
    expect(root?.attributes).toMatchObject({ "data-closed": "" })
    const [trigger] = await query(html, '[data-slot="collapsible-trigger"]')
    expect(trigger?.tag).toBe("button")
    expect(trigger?.attributes).toMatchObject({
      type: "button",
      "aria-expanded": "false",
    })
    const [panel] = await query(html, '[data-slot="collapsible-content"]')
    expect(panel?.attributes).toMatchObject({
      hidden: "",
      "data-closed": "",
    })
  })

  test("with the trigger elsewhere and open, the panel shows", async () => {
    const html = await render(
      <Collapsible defaultOpen>
        <h4>
          Title <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        </h4>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )
    const [trigger] = await query(html, "button")
    const [panel] = await query(html, '[data-slot="collapsible-content"]')
    expect(trigger?.attributes["aria-controls"]).toBe(panel?.attributes.id)
    expect(trigger?.attributes).toHaveProperty("data-panel-open")
    expect(panel?.attributes).not.toHaveProperty("hidden")
  })
})
