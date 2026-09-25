import { describe, expect, test } from "bun:test"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "../../components/ui/combobox"
import { LEAKY_ATTRIBUTES, query, render } from "../helpers/render"

const FRAMEWORKS = ["Next.js", "Remix", "Astro"]

const list = (
  <ComboboxContent>
    <ComboboxEmpty>No items found.</ComboboxEmpty>
    <ComboboxList>
      {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
)

describe("Combobox (native popover, /shadcn/combobox.js)", () => {
  test("renders the input, the listbox and the form value", async () => {
    const html = await render(
      <Combobox
        id="fw"
        items={FRAMEWORKS}
        defaultValue="Remix"
        name="framework"
      >
        <ComboboxInput placeholder="Framework" />
        {list}
      </Combobox>
    )
    const [input] = await query(html, "input[role=combobox]")
    expect(input?.attributes).toMatchObject({
      id: "fw-input",
      value: "Remix",
      "aria-expanded": "false",
      "aria-haspopup": "listbox",
      "aria-autocomplete": "list",
      autocomplete: "off",
      "data-combobox": "fw",
      "data-slot": "input-group-control",
    })
    expect(input?.attributes.style).toContain("anchor-name:--fw")
    const [popup] = await query(html, "[data-combobox-popup]")
    expect(popup?.attributes).toMatchObject({
      id: "fw-popup",
      popover: "manual",
      "data-side": "bottom",
      "data-align": "start",
    })
    expect(popup?.attributes.style).toContain("position-anchor:--fw")
    const options = await query(html, "[role=option]")
    expect(options.map((o) => o.attributes["aria-selected"])).toEqual([
      "false",
      "true",
      "false",
    ])
    expect(options[1]?.attributes).toMatchObject({
      "data-value": "Remix",
      "data-label": "Remix",
      "data-selected": "",
    })
    const indicators = await query(html, "[data-combobox-indicator]")
    expect(indicators.map((i) => "hidden" in i.attributes)).toEqual([
      true,
      false,
      true,
    ])
    const [field] = await query(html, "[data-combobox-field]")
    expect(field?.attributes).toMatchObject({
      name: "framework",
      value: "Remix",
      tabindex: "-1",
      "aria-hidden": "true",
      "data-filter": "",
    })
    for (const attribute of LEAKY_ATTRIBUTES) {
      expect(html).not.toContain(` ${attribute}=`)
    }
  })

  test("the clear button waits in a template until there is a value", async () => {
    const empty = await render(
      <Combobox items={FRAMEWORKS}>
        <ComboboxInput showClear />
        {list}
      </Combobox>
    )
    expect(empty).toMatch(/<template data-combobox-clear="[^"]+"><button/)
    const filled = await render(
      <Combobox items={FRAMEWORKS} defaultValue="Astro">
        <ComboboxInput showClear />
        {list}
      </Combobox>
    )
    expect(filled).not.toContain("<template data-combobox-clear")
    expect(await query(filled, '[data-slot="combobox-clear"]')).toHaveLength(1)
  })

  test("labels objects and renders groups through collections", async () => {
    const html = await render(
      <Combobox
        items={[{ value: "Fruits", items: [{ value: "a", label: "Apple" }] }]}
      >
        <ComboboxInput />
        <ComboboxContent>
          <ComboboxList>
            {(group: { value: string; items: { value: string }[] }) => (
              <ComboboxGroup items={group.items}>
                <ComboboxLabel>{group.value}</ComboboxLabel>
                <ComboboxCollection>
                  {(item: { value: string; label: string }) => (
                    <ComboboxItem value={item}>{item.label}</ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    )
    const [group] = await query(html, "[role=group][aria-labelledby]")
    const [label] = await query(html, '[data-slot="combobox-label"]')
    expect(group?.attributes["aria-labelledby"]).toBe(label?.attributes.id)
    const [option] = await query(html, "[role=option]")
    expect(option?.attributes).toMatchObject({
      "data-value": "a",
      "data-label": "Apple",
    })
  })

  test("renders chips, one hidden input per value and a chip template", async () => {
    function Chips() {
      const anchor = useComboboxAnchor()
      return (
        <Combobox
          id="stack"
          multiple
          items={FRAMEWORKS}
          defaultValue={["Next.js", "Astro"]}
          name="stack"
        >
          <ComboboxChips ref={anchor}>
            <ComboboxValue>
              {(values: string[]) => (
                <>
                  {values.map((value) => (
                    <ComboboxChip key={value}>{value}</ComboboxChip>
                  ))}
                  <ComboboxChipsInput />
                </>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem value={item}>{item}</ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      )
    }
    const html = await render(<Chips />)
    const [chips] = await query(html, '[data-slot="combobox-chips"]')
    const [popup] = await query(html, "[data-combobox-popup]")
    const anchor = chips?.attributes.style?.match(/anchor-name:(--[\w-]+)/)?.[1]
    expect(anchor).toBeDefined()
    expect(popup?.attributes.style).toContain(`position-anchor:${anchor}`)
    expect(popup?.attributes["data-chips"]).toBe("true")
    const [value] = await query(html, "[data-combobox-value]")
    expect(value?.attributes["data-initial"]).toBe('["Next.js","Astro"]')
    // Two rendered chips plus the one in the template.
    expect(html).toMatch(
      /<template data-label="Next.js">.*data-slot="combobox-chip"/
    )
    expect(await query(html, '[data-slot="combobox-chip"]')).toHaveLength(3)
    const hidden = await query(html, 'input[type="hidden"]')
    expect(hidden.map((i) => [i.attributes.name, i.attributes.value])).toEqual([
      ["stack", "Next.js"],
      ["stack", "Astro"],
    ])
    const [list] = await query(html, "[role=listbox]")
    expect(list?.attributes["aria-multiselectable"]).toBe("true")
  })
})
