import { describe, expect, test } from "bun:test"
import {
  Attachment,
  AttachmentContent,
  AttachmentTitle,
  AttachmentTrigger,
} from "../../components/ui/attachment"
import { Button } from "../../components/ui/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "../../components/ui/button-group"
import {
  Item,
  ItemContent,
  ItemSeparator,
  ItemTitle,
} from "../../components/ui/item"
import { query, render, renderOne } from "../helpers/render"

describe("ButtonGroup", () => {
  test("renders a group role with orientation and a vertical separator", async () => {
    const html = await render(
      <ButtonGroup>
        <Button>A</Button>
        <ButtonGroupSeparator />
        <Button>B</Button>
      </ButtonGroup>
    )
    const [group] = await query(html, '[data-slot="button-group"]')
    expect(group?.attributes.role).toBe("group")
    // Like upstream, orientation is only reflected when given.
    expect(group?.attributes).not.toHaveProperty("data-orientation")
    const vertical = await renderOne(
      <ButtonGroup orientation="vertical" />,
      "div"
    )
    expect(vertical.attributes["data-orientation"]).toBe("vertical")
    const [separator] = await query(
      html,
      '[data-slot="button-group-separator"]'
    )
    expect(separator?.attributes).toMatchObject({
      role: "separator",
      "aria-orientation": "vertical",
      "data-orientation": "vertical",
    })
  })
})

describe("Attachment", () => {
  test("exposes state and orientation, and the trigger defaults to type=button", async () => {
    const html = await render(
      <Attachment state="error" orientation="vertical">
        <AttachmentContent>
          <AttachmentTitle>file.pdf</AttachmentTitle>
        </AttachmentContent>
        <AttachmentTrigger aria-label="Open" />
      </Attachment>
    )
    const [attachment] = await query(html, '[data-slot="attachment"]')
    expect(attachment?.attributes).toMatchObject({
      "data-state": "error",
      "data-orientation": "vertical",
    })
    const trigger = await renderOne(<AttachmentTrigger />, "button")
    expect(trigger.attributes.type).toBe("button")
    expect(
      (await renderOne(<AttachmentTrigger type="submit" />, "button"))
        .attributes.type
    ).toBe("submit")
  })
})

describe("Item", () => {
  test("renders item parts and a horizontal separator", async () => {
    const html = await render(
      <div>
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Title</ItemTitle>
          </ItemContent>
        </Item>
        <ItemSeparator />
      </div>
    )
    const [item] = await query(html, '[data-slot="item"]')
    expect(item?.attributes["data-variant"]).toBe("outline")
    const [separator] = await query(html, '[data-slot="item-separator"]')
    expect(separator?.attributes["data-orientation"]).toBe("horizontal")
  })
})
