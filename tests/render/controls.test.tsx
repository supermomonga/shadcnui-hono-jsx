import { describe, expect, test } from "bun:test"
import { Checkbox } from "../../components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group"
import { Switch } from "../../components/ui/switch"
import { Toggle } from "../../components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group"
import { query, render } from "../helpers/render"

describe("Checkbox and Switch (native checkbox inside the styled root)", () => {
  test("routes form and ARIA attributes to the input", async () => {
    const html = await render(
      <Checkbox
        id="terms"
        name="terms"
        value="yes"
        defaultChecked
        required
        aria-invalid="true"
        class="size-5"
      />
    )
    const [root] = await query(html, '[data-slot="checkbox"]')
    expect(root?.tag).toBe("span")
    expect(root?.classes).toEqual(
      expect.arrayContaining(["size-5", "has-checked:bg-primary", "peer"])
    )
    expect(root?.classes.some((c) => c.includes("data-checked"))).toBe(false)
    expect(root?.attributes).not.toHaveProperty("id")
    const [input] = await query(html, "input")
    expect(input?.attributes).toMatchObject({
      type: "checkbox",
      id: "terms",
      name: "terms",
      value: "yes",
      checked: "",
      required: "",
      "aria-invalid": "true",
    })
    // The input takes over upstream's enlarged ::after hit area.
    expect(input?.classes).toEqual(
      expect.arrayContaining(["peer", "absolute", "-inset-x-3", "-inset-y-2"])
    )
    const [indicator] = await query(html, '[data-slot="checkbox-indicator"]')
    expect(indicator?.classes).toEqual(
      expect.arrayContaining(["pointer-events-none", "peer-not-checked:hidden"])
    )
    expect(html).not.toContain("<script")
  })

  test("renders a switch role and peer state on the thumb", async () => {
    const html = await render(<Switch size="sm" disabled />)
    const [input] = await query(html, "input")
    expect(input?.attributes).toMatchObject({
      type: "checkbox",
      role: "switch",
      disabled: "",
    })
    expect(input?.attributes).not.toHaveProperty("checked")
    const [root] = await query(html, '[data-slot="switch"]')
    expect(root?.attributes["data-size"]).toBe("sm")
    const [thumb] = await query(html, '[data-slot="switch-thumb"]')
    expect(thumb?.classes).toEqual(
      expect.arrayContaining([
        "group-data-[size=sm]/switch:peer-checked:translate-x-[calc(100%-2px)]",
      ])
    )
  })
})

describe("RadioGroup (native radios sharing a name)", () => {
  test("names, selects and disables the radios", async () => {
    const html = await render(
      <RadioGroup name="plan" defaultValue="pro" disabled>
        <RadioGroupItem value="free" id="free" />
        <RadioGroupItem value="pro" id="pro" />
      </RadioGroup>
    )
    expect(
      (await query(html, '[data-slot="radio-group"]'))[0]?.attributes
    ).toMatchObject({
      role: "radiogroup",
    })
    const radios = await query(html, "input")
    expect(radios.map((r) => r.attributes)).toEqual([
      expect.objectContaining({
        type: "radio",
        name: "plan",
        value: "free",
        id: "free",
        disabled: "",
      }),
      expect.objectContaining({
        type: "radio",
        name: "plan",
        value: "pro",
        id: "pro",
        checked: "",
      }),
    ])
    expect(radios[0]?.attributes).not.toHaveProperty("checked")
  })

  test("generates a group name when none is given", async () => {
    const html = await render(
      <RadioGroup>
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>
    )
    const names = (await query(html, "input")).map((r) => r.attributes.name)
    expect(names[0]).toMatch(/^radio-group-/)
    expect(names[1]).toBe(names[0])
  })
})

describe("Toggle and ToggleGroup (labels around native inputs)", () => {
  test("a toggle is a label with a visually hidden checkbox", async () => {
    const html = await render(
      <Toggle
        aria-label="Bold"
        defaultPressed
        name="bold"
        value="on"
        variant="outline"
      >
        B
      </Toggle>
    )
    const [label] = await query(html, '[data-slot="toggle"]')
    expect(label?.tag).toBe("label")
    expect(label?.classes).toEqual(
      expect.arrayContaining([
        "has-checked:bg-muted",
        "has-disabled:opacity-50",
        "has-focus-visible:ring-[3px]",
      ])
    )
    expect(label?.classes.some((c) => c.startsWith("aria-pressed"))).toBe(false)
    const [input] = await query(html, "input")
    expect(input?.attributes).toMatchObject({
      type: "checkbox",
      name: "bold",
      value: "on",
      checked: "",
      "aria-label": "Bold",
      class: "peer sr-only",
    })
  })

  test("group items are radios, or checkboxes with multiple", async () => {
    const single = await render(
      <ToggleGroup defaultValue={["b"]} name="align">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>
    )
    expect(
      (await query(single, '[data-slot="toggle-group"]'))[0]?.attributes.role
    ).toBe("group")
    expect((await query(single, "input")).map((i) => i.attributes)).toEqual([
      expect.objectContaining({ type: "radio", name: "align", value: "a" }),
      expect.objectContaining({
        type: "radio",
        name: "align",
        value: "b",
        checked: "",
      }),
    ])
    const multiple = await render(
      <ToggleGroup multiple defaultValue={["a", "b"]}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>
    )
    const inputs = await query(multiple, "input")
    expect(
      inputs.map((i) => [i.attributes.type, "checked" in i.attributes])
    ).toEqual([
      ["checkbox", true],
      ["checkbox", true],
    ])
  })
})
