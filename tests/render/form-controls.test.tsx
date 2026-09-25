import { describe, expect, test } from "bun:test"
import { Label } from "../../components/ui/label"
import { Skeleton } from "../../components/ui/skeleton"
import { Textarea } from "../../components/ui/textarea"
import { renderOne } from "../helpers/render"

describe("Label", () => {
  test("renders a label associated through for", async () => {
    const el = await renderOne(<Label for="email">Email</Label>, "label")
    expect(el.attributes["data-slot"]).toBe("label")
    expect(el.attributes.for).toBe("email")
  })
})

describe("Textarea", () => {
  test("renders a textarea with passthrough attributes", async () => {
    const el = await renderOne(
      <Textarea rows={3} placeholder="Message" />,
      "textarea"
    )
    expect(el.attributes).toMatchObject({
      "data-slot": "textarea",
      rows: "3",
      placeholder: "Message",
    })
    expect(el.classes).toContain("field-sizing-content")
  })
})

describe("Skeleton", () => {
  test("renders an animated placeholder div", async () => {
    const el = await renderOne(<Skeleton class="h-4 w-32" />, "div")
    expect(el.attributes["data-slot"]).toBe("skeleton")
    expect(el.classes).toEqual(
      expect.arrayContaining(["animate-pulse", "h-4", "w-32"])
    )
  })
})
