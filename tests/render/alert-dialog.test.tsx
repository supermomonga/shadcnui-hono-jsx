import { describe, expect, test } from "bun:test"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog"
import { Button } from "../../components/ui/button"
import { query, render } from "../helpers/render"

const demo = (
  <AlertDialog id="delete">
    <AlertDialogTrigger render={<Button variant="destructive" />}>
      Delete
    </AlertDialogTrigger>
    <AlertDialogContent size="sm">
      <AlertDialogHeader>
        <AlertDialogTitle>Delete project?</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction type="submit">Delete</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

describe("AlertDialog (native <dialog>, no JavaScript)", () => {
  test("is an alertdialog that only closes on request", async () => {
    const html = await render(demo)
    const [dialog] = await query(html, "dialog")
    expect(dialog?.attributes).toMatchObject({
      id: "delete",
      role: "alertdialog",
      closedby: "closerequest",
      "aria-labelledby": "delete-title",
      "aria-describedby": "delete-description",
      "data-slot": "alert-dialog-content",
      "data-size": "sm",
    })
    expect(dialog?.classes).toEqual(
      expect.arrayContaining(["group/alert-dialog-content", "not-open:hidden"])
    )
    expect(html).not.toContain("<script")
  })

  test("renders the trigger through render and the cancel button as a Button", async () => {
    const html = await render(demo)
    const [trigger] = await query(html, '[data-slot="alert-dialog-trigger"]')
    expect(trigger?.attributes).toMatchObject({
      command: "show-modal",
      commandfor: "delete",
    })
    expect(trigger?.classes).toContain("bg-destructive/10")
    const [cancel] = await query(html, '[data-slot="alert-dialog-cancel"]')
    expect(cancel?.attributes).toMatchObject({
      type: "button",
      command: "close",
      commandfor: "delete",
    })
    expect(cancel?.classes).toContain("border-border")
    const [action] = await query(html, '[data-slot="alert-dialog-action"]')
    expect(action?.attributes.type).toBe("submit")
    expect(action?.attributes).not.toHaveProperty("command")
  })
})
