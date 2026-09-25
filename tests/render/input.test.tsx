import { describe, expect, test } from "bun:test"
import { Input } from "../../components/ui/input"
import { renderOne } from "../helpers/render"

describe("Input", () => {
  test("renders a native input with slot and passthrough attributes", async () => {
    const el = await renderOne(
      <Input
        type="email"
        name="email"
        placeholder="you@example.com"
        required
      />,
      "input"
    )
    expect(el.attributes).toMatchObject({
      "data-slot": "input",
      type: "email",
      name: "email",
      placeholder: "you@example.com",
      required: "",
    })
    expect(el.attributes).not.toHaveProperty("data-disabled")
  })

  test("omits type when not given and mirrors disabled", async () => {
    const el = await renderOne(<Input disabled />, "input")
    expect(el.attributes).not.toHaveProperty("type")
    expect(el.attributes.disabled).toBe("")
    expect(el.attributes["data-disabled"]).toBe("")
  })

  test("supports aria-invalid styling hooks", async () => {
    const el = await renderOne(
      <Input aria-invalid="true" class="w-40" />,
      "input"
    )
    expect(el.attributes["aria-invalid"]).toBe("true")
    expect(el.classes).toContain("w-40")
    expect(el.classes).not.toContain("w-full")
  })
})
