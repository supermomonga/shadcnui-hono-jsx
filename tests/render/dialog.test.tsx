import { describe, expect, test } from "bun:test"
import { buttonVariants } from "../../components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { query, render } from "../helpers/render"

const demo = (id?: string) => (
  <Dialog id={id}>
    <DialogTrigger class={buttonVariants({ variant: "outline" })}>
      Open
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Title</DialogTitle>
        <DialogDescription>Description</DialogDescription>
      </DialogHeader>
      <DialogFooter showCloseButton>
        <DialogClose>Cancel</DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

describe("Dialog (native <dialog>, no JavaScript)", () => {
  test("wires trigger, dialog, title and description through ids", async () => {
    const html = await render(demo("profile"))
    const [trigger] = await query(html, '[data-slot="dialog-trigger"]')
    expect(trigger?.attributes).toMatchObject({
      type: "button",
      command: "show-modal",
      commandfor: "profile",
      "aria-haspopup": "dialog",
    })
    const [dialog] = await query(html, "dialog")
    expect(dialog?.attributes).toMatchObject({
      id: "profile",
      closedby: "any",
      "aria-labelledby": "profile-title",
      "aria-describedby": "profile-description",
      "data-slot": "dialog-content",
    })
    expect(dialog?.attributes).not.toHaveProperty("open")
    expect(dialog?.classes).toEqual(
      expect.arrayContaining([
        "not-open:hidden",
        "open:animate-in",
        "backdrop:bg-black/10",
      ])
    )
    expect(dialog?.classes.some((c) => c.includes("data-closed"))).toBe(false)
    expect((await query(html, "h2"))[0]?.attributes.id).toBe("profile-title")
    expect((await query(html, "p"))[0]?.attributes.id).toBe(
      "profile-description"
    )
  })

  test("renders close buttons with the close command", async () => {
    const html = await render(demo("profile"))
    const closes = (await query(html, '[command="close"]')).map((el) => ({
      slot: el.attributes["data-slot"],
      target: el.attributes.commandfor,
      text: el.tag,
    }))
    // DialogClose ("Cancel"), the footer close button, then the icon close button.
    expect(closes).toEqual([
      { slot: "dialog-close", target: "profile", text: "button" },
      { slot: "button", target: "profile", text: "button" },
      { slot: "dialog-close", target: "profile", text: "button" },
    ])
    expect(html).not.toContain("<script")
  })

  test("generates distinct ids when none is given", async () => {
    const html = await render(
      <div>
        {demo()}
        {demo()}
      </div>
    )
    const ids = (await query(html, "dialog")).map((d) => d.attributes.id)
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
    for (const id of ids) expect(id).toMatch(/^dialog-[a-z0-9-]+$/)
  })

  test("renders no portal or overlay element", async () => {
    const html = await render(
      <DialogPortal>
        <DialogOverlay class="bg-red-500" />
      </DialogPortal>
    )
    expect(html).toBe("")
  })

  test("requires a Dialog around its parts", () => {
    expect(() => render(<DialogTrigger>Open</DialogTrigger>)).toThrow(
      "Dialog parts must be rendered inside <Dialog>"
    )
  })
})
