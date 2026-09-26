import { describe, expect, test } from "bun:test"
import { InputOTPLite } from "../../components/ui/input-otp-lite"
import { query, render } from "../helpers/render"

describe("InputOTPLite (lite alternative, no JavaScript)", () => {
  test("renders one native one-time-code input over the slots", async () => {
    const html = await render(
      <InputOTPLite maxLength={4} name="code" required aria-label="Code" />
    )
    const [input] = await query(html, "input")
    expect(input?.attributes).toMatchObject({
      type: "text",
      name: "code",
      inputmode: "numeric",
      autocomplete: "one-time-code",
      maxlength: "4",
      minlength: "4",
      required: "",
      "aria-label": "Code",
    })
    expect(await query(html, '[data-slot="input-otp-slot"]')).toHaveLength(4)
    const [group] = await query(html, '[data-slot="input-otp-group"]')
    expect(group?.attributes["aria-hidden"]).toBe("true")
    const [root] = await query(html, '[data-slot="input-otp-lite"]')
    expect(root?.attributes.style).toContain("--input-otp-length:4")
    expect(html).not.toContain("<script")
  })

  test("defaults to six slots and takes input and container classes", async () => {
    const html = await render(
      <InputOTPLite class="font-mono" containerClassName="mx-auto" />
    )
    expect(await query(html, '[data-slot="input-otp-slot"]')).toHaveLength(6)
    const [input] = await query(html, "input")
    expect(input?.classes).toContain("font-mono")
    const [root] = await query(html, '[data-slot="input-otp-lite"]')
    expect(root?.classes).toContain("mx-auto")
  })
})
