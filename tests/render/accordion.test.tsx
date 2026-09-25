import { describe, expect, test } from "bun:test"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion"
import { query, render } from "../helpers/render"

const demo = (props: { multiple?: boolean } = {}) => (
  <Accordion defaultValue={["b"]} {...props}>
    <AccordionItem value="a">
      <AccordionTrigger>A</AccordionTrigger>
      <AccordionContent>Body A</AccordionContent>
    </AccordionItem>
    <AccordionItem value="b">
      <AccordionTrigger>B</AccordionTrigger>
      <AccordionContent>Body B</AccordionContent>
    </AccordionItem>
    <AccordionItem value="c" disabled>
      <AccordionTrigger>C</AccordionTrigger>
      <AccordionContent>Body C</AccordionContent>
    </AccordionItem>
  </Accordion>
)

describe("Accordion (native <details>, no JavaScript)", () => {
  test("renders items as exclusive details opened by defaultValue", async () => {
    const html = await render(demo())
    const items = await query(html, "details")
    expect(items.map((i) => i.attributes["data-slot"])).toEqual([
      "accordion-item",
      "accordion-item",
      "accordion-item",
    ])
    const names = new Set(items.map((i) => i.attributes.name))
    expect(names.size).toBe(1)
    expect([...names][0]).toMatch(/^accordion-/)
    expect(items.map((i) => "open" in i.attributes)).toEqual([
      false,
      true,
      false,
    ])
    expect(html).not.toContain("<script")
    expect(html).not.toContain("<h3")
  })

  test("multiple items do not share a name", async () => {
    const items = await query(await render(demo({ multiple: true })), "details")
    expect(items.every((i) => !("name" in i.attributes))).toBe(true)
  })

  test("wires the summary and the labelled panel", async () => {
    const html = await render(demo())
    const triggers = await query(html, "summary")
    const panels = await query(html, '[data-slot="accordion-content"]')
    expect(triggers).toHaveLength(3)
    for (const [index, trigger] of triggers.entries()) {
      const panel = panels[index]
      expect(trigger.attributes["data-slot"]).toBe("accordion-trigger")
      expect(trigger.attributes["aria-controls"]).toBe(panel?.attributes.id)
      expect(panel?.attributes).toMatchObject({
        role: "region",
        "aria-labelledby": trigger.attributes.id,
      })
    }
    expect(triggers[0]?.classes).toEqual(
      expect.arrayContaining(["list-none", "group/accordion-trigger"])
    )
    expect(html).toContain("group-[[open]&gt;&amp;]/accordion-trigger:hidden")
    expect(html).not.toContain("aria-expanded")
    expect(panels[0]?.classes).toEqual(["overflow-hidden", "text-sm"])
  })

  test("disables items", async () => {
    const html = await render(demo())
    const [item] = await query(html, "details[data-disabled]")
    expect(item?.attributes.open).toBeUndefined()
    const trigger = (await query(html, "summary"))[2]
    expect(trigger?.attributes).toMatchObject({
      "aria-disabled": "true",
      tabindex: "-1",
    })
  })
})
