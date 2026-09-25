import { describe, expect, test } from "bun:test"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "../../components/ui/input-group"
import { query, render } from "../helpers/render"

describe("InputGroup (addon focus from /shadcn/input-group.js)", () => {
  test("renders the upstream structure without a click handler", async () => {
    const html = await render(
      <InputGroup>
        <InputGroupInput placeholder="example.com" />
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupButton>Go</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    )
    const [group] = await query(html, '[data-slot="input-group"]')
    expect(group?.attributes.role).toBe("group")
    const addons = await query(html, '[data-slot="input-group-addon"]')
    expect(addons.map((a) => a.attributes["data-align"])).toEqual([
      "inline-start",
      "inline-end",
    ])
    expect(html).not.toContain("onclick")
    const [input] = await query(html, '[data-slot="input-group-control"]')
    expect(input?.attributes.placeholder).toBe("example.com")
    const [button] = await query(html, "button")
    expect(button?.attributes).toMatchObject({
      type: "button",
      "data-size": "xs",
    })
  })
})
