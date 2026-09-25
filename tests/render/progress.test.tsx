import { describe, expect, test } from "bun:test"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "../../components/ui/progress"
import { query, render } from "../helpers/render"

describe("Progress (Base UI Progress on the server)", () => {
  test("renders ARIA values, status and the indicator width", async () => {
    const html = await render(
      <Progress value={40} aria-label="Upload">
        <ProgressLabel>Upload</ProgressLabel>
        <ProgressValue />
      </Progress>
    )
    const [root] = await query(html, '[data-slot="progress"]')
    expect(root?.attributes).toMatchObject({
      role: "progressbar",
      "aria-valuenow": "40",
      "aria-valuemin": "0",
      "aria-valuemax": "100",
      "aria-valuetext": "40%",
      "data-progressing": "",
    })
    const [indicator] = await query(html, '[data-slot="progress-indicator"]')
    expect(indicator?.attributes.style).toContain("width:40%")
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain(">40%</span>")
  })

  test("clamps the value and marks completion", async () => {
    const html = await render(<Progress value={150} max={120} />)
    const [root] = await query(html, '[data-slot="progress"]')
    expect(root?.attributes).toMatchObject({
      "aria-valuenow": "120",
      "data-complete": "",
    })
    const [indicator] = await query(html, '[data-slot="progress-indicator"]')
    expect(indicator?.attributes.style).toContain("width:100%")
  })

  test("is indeterminate without a value", async () => {
    const html = await render(<Progress value={null} />)
    const [root] = await query(html, '[data-slot="progress"]')
    expect(root?.attributes).toMatchObject({
      "aria-valuetext": "indeterminate progress",
      "data-indeterminate": "",
    })
    expect(root?.attributes).not.toHaveProperty("aria-valuenow")
    const [indicator] = await query(html, '[data-slot="progress-indicator"]')
    expect(indicator?.attributes).not.toHaveProperty("style")
  })

  test("formats the value with Intl options", async () => {
    const html = await render(
      <Progress value={3} max={10} format={{ style: "decimal" }} locale="en">
        <ProgressValue />
      </Progress>
    )
    expect(
      (await query(html, '[data-slot="progress"]'))[0]?.attributes[
        "aria-valuetext"
      ]
    ).toBe("3")
  })
})
