import { describe, expect, test } from "bun:test"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Dialog, DialogTrigger } from "../../components/ui/dialog"
import { PaginationLink } from "../../components/ui/pagination"
import { query, render, renderOne } from "../helpers/render"

describe("render prop (Base UI compatible, server-side)", () => {
  test("replaces the element and merges props, the render element's winning", async () => {
    const link = await renderOne(
      <Button
        variant="outline"
        data-x="own"
        render={<a href="/docs" data-x="theirs" class="extra" />}
      >
        Docs
      </Button>,
      "a"
    )
    expect(link.attributes).toMatchObject({
      href: "/docs",
      "data-slot": "button",
      "data-x": "theirs",
    })
    // The render element's classes come first, then the component's.
    expect(link.classes[0]).toBe("extra")
    expect(link.classes).toContain("border-border")
  })

  test("does not add button semantics to non-button targets", async () => {
    const link = await renderOne(
      <Button render={<a href="/docs" />}>Docs</Button>,
      "a"
    )
    expect(link.attributes).not.toHaveProperty("type")
    expect(link.attributes).not.toHaveProperty("role")
    expect(link.attributes).not.toHaveProperty("tabindex")
    expect(
      await render(<Button render={<a href="/docs" />}>Docs</Button>)
    ).toContain(">Docs</a>")
  })

  test("keeps the render element's own children when it has them", async () => {
    const html = await render(
      <Badge render={<a href="/">Linked</a>}>ignored</Badge>
    )
    expect(html).toContain(">Linked</a>")
  })

  test("accepts a function that receives the merged props", async () => {
    const html = await render(
      <Badge render={(props) => <mark {...props} />}>Hot</Badge>
    )
    const [mark] = await query(html, "mark")
    expect(mark?.attributes["data-slot"]).toBe("badge")
    expect(html).toContain(">Hot</mark>")
  })

  test("composes generated components, like upstream pagination and dialog triggers", async () => {
    const page = await renderOne(
      <PaginationLink href="#2" isActive>
        2
      </PaginationLink>,
      "a"
    )
    expect(page.attributes).toMatchObject({
      href: "#2",
      "aria-current": "page",
      "data-slot": "pagination-link",
      "data-active": "true",
    })
    expect(page.attributes).not.toHaveProperty("nativebutton")
    const trigger = await renderOne(
      <Dialog id="d">
        <DialogTrigger render={<Button variant="outline" />}>
          Open
        </DialogTrigger>
      </Dialog>,
      "button"
    )
    expect(trigger.attributes).toMatchObject({
      command: "show-modal",
      commandfor: "d",
      "data-slot": "dialog-trigger",
      type: "button",
    })
    expect(trigger.classes).toContain("border-border")
  })
})
