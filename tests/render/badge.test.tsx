import { describe, expect, test } from "bun:test"
import { Badge } from "../../components/ui/badge"
import { LEAKY_ATTRIBUTES, renderOne } from "../helpers/render"

describe("Badge", () => {
  test("renders a span with slot and variant state attributes", async () => {
    const el = await renderOne(<Badge>New</Badge>, "span")
    expect(el.attributes["data-slot"]).toBe("badge")
    expect(el.attributes["data-variant"]).toBe("default")
    expect(el.classes).toContain("bg-primary")
  })

  test("applies variants and merges classes without leaking props", async () => {
    const el = await renderOne(
      <Badge variant="destructive" class="px-4">
        !
      </Badge>,
      "span"
    )
    expect(el.attributes["data-variant"]).toBe("destructive")
    expect(el.classes).toContain("text-destructive")
    expect(el.classes).toContain("px-4")
    expect(el.classes).not.toContain("px-2")
    for (const name of LEAKY_ATTRIBUTES)
      expect(el.attributes).not.toHaveProperty(name)
  })
})
