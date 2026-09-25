import { describe, expect, test } from "bun:test"
import {
  createToastManager,
  Toaster,
  toast,
  useToastManager,
} from "../../components/ui/toast"
import { query, render } from "../helpers/render"

describe("Toast (server toasts and templates, /shadcn/toast.js)", () => {
  test("renders server toasts newest first in a live region", async () => {
    const html = await render(
      <Toaster
        toasts={[
          { title: "Newest", type: "success" },
          { title: "Older", description: "Details", timeout: 0 },
        ]}
      />
    )
    const [viewport] = await query(html, '[data-slot="toast-viewport"]')
    expect(viewport?.attributes).toMatchObject({
      role: "region",
      "aria-live": "polite",
      "aria-label": "Notifications",
      "data-timeout": "5000",
      "data-limit": "3",
    })
    const live = html.replace(/<template[\s\S]*?<\/template>/g, "")
    const toasts = await query(live, '[data-slot="toast"]')
    expect(toasts.map((t) => t.attributes["data-type"])).toEqual([
      "success",
      undefined,
    ])
    expect(toasts[1]?.attributes).toMatchObject({
      role: "dialog",
      "aria-modal": "false",
      "data-toast-timeout": "0",
    })
    expect(toasts[1]?.attributes.style).toContain("--toast-index:1")
    const contents = await query(live, '[data-slot="toast-content"]')
    expect(contents.map((c) => "data-behind" in c.attributes)).toEqual([
      false,
      true,
    ])
    // The newest toast has no description, so none is rendered.
    expect(await query(live, '[data-slot="toast-description"]')).toHaveLength(1)
  })

  test("renders a template per toast type for the script", async () => {
    const html = await render(<Toaster />)
    const templates = await query(html, "template[data-toast-template]")
    expect(templates.map((t) => t.attributes["data-toast-template"])).toEqual([
      "",
      "success",
      "info",
      "warning",
      "error",
      "loading",
    ])
    expect(html).toContain('data-toast-part="action"')
  })

  test("a per-response manager feeds the Toaster", async () => {
    const manager = createToastManager()
    const id = manager.add({ title: "Saved" })
    manager.update(id, { description: "All changes saved." })
    const html = await render(<Toaster toastManager={manager} />)
    expect(html).toContain("All changes saved.")
    function Count() {
      return <output>{useToastManager().toasts.length}</output>
    }
    expect(
      await render(
        <Toaster toastManager={manager}>
          <Count />
        </Toaster>
      )
    ).toContain("<output>1</output>")
  })

  test("the shared module manager refuses server toasts", () => {
    expect(() => toast.add({ title: "Leak" })).toThrow(
      "toast.add() runs in the browser"
    )
  })
})
