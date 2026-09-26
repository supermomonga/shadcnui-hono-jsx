import { describe, expect, test } from "bun:test"
import { DirectionProvider, useDirection } from "../../components/ui/direction"
import { render } from "../helpers/render"

describe("DirectionProvider (Hono context)", () => {
  test("provides the direction without rendering an element", async () => {
    function Probe() {
      return <span>{useDirection()}</span>
    }
    expect(await render(<Probe />)).toBe("<span>ltr</span>")
    expect(
      await render(
        <DirectionProvider direction="rtl">
          <Probe />
        </DirectionProvider>
      )
    ).toBe("<span>rtl</span>")
  })
})
