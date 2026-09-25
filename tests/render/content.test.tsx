import { describe, expect, test } from "bun:test"
import { AspectRatio } from "../../components/ui/aspect-ratio"
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from "../../components/ui/bubble"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../../components/ui/empty"
import { Kbd, KbdGroup } from "../../components/ui/kbd"
import { Marker, MarkerContent, MarkerIcon } from "../../components/ui/marker"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "../../components/ui/message"
import { LEAKY_ATTRIBUTES, query, render, renderOne } from "../helpers/render"

const slotsOf = async (node: unknown) =>
  (await query(await render(node), "[data-slot]")).map(
    (el) => el.attributes["data-slot"]
  )

describe("AspectRatio", () => {
  test("passes the ratio as a unitless custom property", async () => {
    const el = await renderOne(<AspectRatio ratio={16 / 9} />, "div")
    expect(el.attributes.style).toBe(`--ratio:${16 / 9}`)
    expect(el.attributes).not.toHaveProperty("ratio")
    expect(el.classes).toContain("aspect-(--ratio)")
  })
})

describe("Bubble", () => {
  test("renders variant and alignment state as data attributes", async () => {
    const html = await render(
      <BubbleGroup>
        <Bubble variant="secondary" align="end">
          <BubbleContent>Hi</BubbleContent>
          <BubbleReactions side="top">👍</BubbleReactions>
        </Bubble>
      </BubbleGroup>
    )
    const [bubble] = await query(html, '[data-slot="bubble"]')
    expect(bubble?.attributes).toMatchObject({
      "data-variant": "secondary",
      "data-align": "end",
    })
    for (const name of LEAKY_ATTRIBUTES)
      expect(bubble?.attributes).not.toHaveProperty(name)
    expect(await slotsOf(<BubbleContent>x</BubbleContent>)).toEqual([
      "bubble-content",
    ])
  })
})

describe("Empty", () => {
  test("renders every part with its data-slot", async () => {
    expect(
      await slotsOf(
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">i</EmptyMedia>
            <EmptyTitle>No results</EmptyTitle>
            <EmptyDescription>Try again.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>…</EmptyContent>
        </Empty>
      )
    ).toEqual([
      "empty",
      "empty-header",
      "empty-icon",
      "empty-title",
      "empty-description",
      "empty-content",
    ])
  })
})

describe("Kbd", () => {
  test("renders kbd elements", async () => {
    const html = await render(
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    )
    expect(
      (await query(html, "kbd")).map((el) => el.attributes["data-slot"])
    ).toEqual(["kbd-group", "kbd", "kbd"])
  })
})

describe("Marker", () => {
  test("renders variant state and parts", async () => {
    const html = await render(
      <Marker variant="border">
        <MarkerIcon>•</MarkerIcon>
        <MarkerContent>Step</MarkerContent>
      </Marker>
    )
    const [marker] = await query(html, '[data-slot="marker"]')
    expect(marker?.attributes["data-variant"]).toBe("border")
    expect(marker?.attributes).not.toHaveProperty("variant")
  })
})

describe("Message", () => {
  test("renders every part with its data-slot", async () => {
    const slots = await slotsOf(
      <MessageGroup>
        <Message>
          <MessageAvatar>A</MessageAvatar>
          <MessageHeader>Alice</MessageHeader>
          <MessageContent>Hello</MessageContent>
          <MessageFooter>now</MessageFooter>
        </Message>
      </MessageGroup>
    )
    expect(slots).toEqual(
      expect.arrayContaining([
        "message-group",
        "message",
        "message-avatar",
        "message-header",
        "message-content",
        "message-footer",
      ])
    )
  })
})
