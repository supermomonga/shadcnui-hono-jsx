import { describe, expect, test } from "bun:test"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"
import { query, render } from "../helpers/render"

const demo = (value?: string) => (
  <Select name="fruit" defaultValue={value} required>
    <SelectTrigger id="fruit" aria-invalid="true" class="w-48">
      <SelectValue placeholder="Pick one" />
    </SelectTrigger>
    <SelectContent side="top" sideOffset={8}>
      <SelectGroup>
        <SelectLabel>Fruits</SelectLabel>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="kiwi" disabled>
          Kiwi
        </SelectItem>
      </SelectGroup>
      <SelectSeparator />
    </SelectContent>
  </Select>
)

describe("Select (customizable native select, no JavaScript)", () => {
  test("the trigger is the select, holding the items", async () => {
    const html = await render(demo())
    const [select] = await query(html, "select")
    expect(select?.attributes).toMatchObject({
      name: "fruit",
      id: "fruit",
      required: "",
      "aria-invalid": "true",
      "data-slot": "select-trigger",
      "data-size": "default",
      "data-side": "top",
    })
    expect(select?.attributes.style).toContain("--select-picker-area:top;")
    expect(select?.attributes.style).toContain(
      "--select-picker-margin:0 0 8px 0px;"
    )
    expect(select?.classes).toEqual(
      expect.arrayContaining([
        "[appearance:base-select]",
        "[&::picker(select)]:bg-popover",
        "open:[&::picker(select)]:animate-in",
        "w-48",
        "has-[option[data-placeholder]:checked]:text-muted-foreground",
      ])
    )
    expect(select?.classes.some((c) => c.includes("data-open"))).toBe(false)
    const tags = (await query(html, "select > *")).map((el) => el.tag)
    expect(tags).toEqual(["button", "option", "optgroup", "hr"])
    const [placeholder] = await query(html, "option[data-placeholder]")
    expect(placeholder?.attributes).toMatchObject({
      value: "",
      disabled: "",
      hidden: "",
      selected: "",
    })
    expect(html).toContain(">Pick one</option>")
    expect(
      (await query(html, "selectedcontent"))[0]?.attributes["data-slot"]
    ).toBe("select-value")
    expect((await query(html, "optgroup > legend"))[0]?.tag).toBe("legend")
    expect(html).not.toContain("<script")
  })

  test("selects the default value", async () => {
    const html = await render(demo("apple"))
    const options = await query(html, "option")
    expect(
      options.map((o) => [o.attributes.value, "selected" in o.attributes])
    ).toEqual([
      ["", false],
      ["apple", true],
      ["kiwi", false],
    ])
    expect(options[2]?.attributes.disabled).toBe("")
  })

  test("requires the content as a child of the root", async () => {
    expect(() =>
      render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      )
    ).toThrow("<SelectContent> must be a child of <Select>")
  })
})
