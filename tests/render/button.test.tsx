import { describe, expect, test } from "bun:test"
import { Button, buttonVariants } from "../../components/ui/button"
import { LEAKY_ATTRIBUTES, render, renderOne } from "../helpers/render"

describe("Button", () => {
  test("renders a native button with the default variant and size", async () => {
    const el = await renderOne(<Button>Save</Button>, "button")
    expect(el.attributes["data-slot"]).toBe("button")
    expect(el.attributes.type).toBe("button")
    expect(el.classes).toContain("bg-primary")
    expect(el.classes).toContain("h-8")
    expect(el.attributes.class).toBe(buttonVariants())
  })

  test("applies variants and sizes without leaking them as attributes", async () => {
    const el = await renderOne(
      <Button variant="outline" size="icon-sm">
        x
      </Button>,
      "button"
    )
    expect(el.classes).toContain("border-border")
    expect(el.classes).toContain("size-7")
    expect(el.classes).not.toContain("bg-primary")
    for (const name of LEAKY_ATTRIBUTES)
      expect(el.attributes).not.toHaveProperty(name)
  })

  test("lets callers override type", async () => {
    const el = await renderOne(<Button type="submit">Send</Button>, "button")
    expect(el.attributes.type).toBe("submit")
  })

  test("mirrors disabled as data-disabled", async () => {
    const disabled = await renderOne(<Button disabled>x</Button>, "button")
    expect(disabled.attributes.disabled).toBe("")
    expect(disabled.attributes["data-disabled"]).toBe("")
    const enabled = await renderOne(<Button>x</Button>, "button")
    expect(enabled.attributes).not.toHaveProperty("disabled")
    expect(enabled.attributes).not.toHaveProperty("data-disabled")
  })

  test("merges class overrides with tailwind conflict resolution", async () => {
    const el = await renderOne(<Button class="h-10 custom">x</Button>, "button")
    expect(el.classes).toContain("h-10")
    expect(el.classes).toContain("custom")
    expect(el.classes).not.toContain("h-8")
  })

  test("passes through ARIA and data attributes and escapes children", async () => {
    const html = await render(
      <Button aria-label="Close" aria-expanded={false} data-icon="inline-end">
        {"<b>"}
      </Button>
    )
    expect(html).toContain('aria-label="Close"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('data-icon="inline-end"')
    expect(html).toContain("&lt;b&gt;")
  })
})
