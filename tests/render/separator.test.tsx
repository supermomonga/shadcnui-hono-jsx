import { describe, expect, test } from "bun:test"
import { Separator } from "../../components/ui/separator"
import { renderOne } from "../helpers/render"

describe("Separator", () => {
  test("renders a horizontal separator by default", async () => {
    const el = await renderOne(<Separator />, "div")
    expect(el.attributes).toMatchObject({
      "data-slot": "separator",
      role: "separator",
      "aria-orientation": "horizontal",
      "data-orientation": "horizontal",
    })
    expect(el.attributes).not.toHaveProperty("orientation")
  })

  test("renders vertical orientation as ARIA and data attributes", async () => {
    const el = await renderOne(<Separator orientation="vertical" />, "div")
    expect(el.attributes["aria-orientation"]).toBe("vertical")
    expect(el.attributes["data-orientation"]).toBe("vertical")
    expect(el.classes).toContain("data-vertical:w-px")
  })

  test("lets callers override the role for decorative separators", async () => {
    const el = await renderOne(<Separator role="none" />, "div")
    expect(el.attributes.role).toBe("none")
  })
})
