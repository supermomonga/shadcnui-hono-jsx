import { describe, expect, test } from "bun:test"
import { DatePickerLite } from "../../components/ui/date-picker-lite"
import { query, render } from "../helpers/render"

describe("DatePickerLite (lite alternative, no JavaScript)", () => {
  test("renders upstream's Input as a native date input with an icon", async () => {
    const html = await render(
      <DatePickerLite name="due" value="2026-09-26" min="2026-01-01" />
    )
    const [input] = await query(html, 'input[data-slot="input"]')
    expect(input?.attributes).toMatchObject({
      type: "date",
      name: "due",
      value: "2026-09-26",
      min: "2026-01-01",
    })
    expect(input?.classes).toContain("dark:scheme-dark")
    expect(
      await query(html, '[data-slot="date-picker-lite"] > svg')
    ).toHaveLength(1)
  })

  test("takes the other native date types", async () => {
    const html = await render(<DatePickerLite type="month" />)
    expect((await query(html, "input"))[0]?.attributes.type).toBe("month")
  })
})
