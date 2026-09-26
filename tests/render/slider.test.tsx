import { describe, expect, test } from "bun:test"
import { Slider } from "../../components/ui/slider"
import { query, render } from "../helpers/render"

describe("Slider (native range inputs, /shadcn/slider.js)", () => {
  test("places edge-aligned thumbs and the indicator with CSS", async () => {
    const html = await render(
      <Slider
        defaultValue={[20, 80]}
        step={5}
        name="price"
        aria-label="Price"
      />
    )
    const [root] = await query(html, '[data-slot="slider"]')
    expect(root?.attributes).toMatchObject({
      role: "group",
      "data-orientation": "horizontal",
      "aria-label": "Price",
    })
    const [control] = await query(html, "[data-slider-control]")
    expect(control?.attributes["data-thumb-alignment"]).toBe("edge")
    const [range] = await query(html, '[data-slot="slider-range"]')
    expect(range?.attributes.style).toContain(
      "inset-inline-start:20%;width:60%"
    )
    const thumbs = await query(html, '[data-slot="slider-thumb"]')
    expect(thumbs.map((t) => t.attributes.style)).toEqual([
      expect.stringContaining(
        "inset-inline-start:20%;top:50%;translate:calc(var(--slider-dir, 1) * -20%) -50%"
      ),
      expect.stringContaining(
        "inset-inline-start:80%;top:50%;translate:calc(var(--slider-dir, 1) * -80%) -50%"
      ),
    ])
    const inputs = await query(html, 'input[type="range"]')
    expect(inputs.map((i) => i.attributes)).toEqual([
      expect.objectContaining({
        name: "price",
        value: "20",
        step: "5",
        "aria-valuetext": "20 start range",
      }),
      expect.objectContaining({
        name: "price",
        value: "80",
        "aria-valuetext": "80 end range",
      }),
    ])
  })

  test("renders two thumbs by default, like upstream", async () => {
    const html = await render(<Slider />)
    const values = (await query(html, 'input[type="range"]')).map(
      (i) => i.attributes.value
    )
    expect(values).toEqual(["0", "0"])
  })

  test("disables the inputs and uses the vertical axis", async () => {
    const html = await render(
      <Slider defaultValue={[30]} orientation="vertical" disabled />
    )
    const [thumb] = await query(html, '[data-slot="slider-thumb"]')
    expect(thumb?.attributes.style).toContain(
      "bottom:30%;left:50%;translate:-50% 30%"
    )
    expect((await query(html, "input"))[0]?.attributes.disabled).toBe("")
  })
})
