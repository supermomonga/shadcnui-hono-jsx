import { describe, expect, test } from "bun:test"
import { app } from "../src/app"

describe("example-hono", () => {
  test("renders the demo page with the generated components", async () => {
    const response = await app.request("/")
    expect(response.status).toBe(200)
    const html = await response.text()
    for (const slot of [
      "button",
      "badge",
      "alert",
      "card",
      "input",
      "label",
      "separator",
      "table",
      "dialog-trigger",
      "dialog-content",
    ]) {
      expect(html).toContain(`data-slot="${slot}"`)
    }
    expect(html).toContain('type="submit"')
    expect(html).toContain('command="show-modal" commandfor="edit-profile"')
    expect(html).toContain('data-disabled=""')
  })

  test("does not leak component props or React conventions into the HTML", async () => {
    const html = await (await app.request("/")).text()
    for (const attribute of [
      "className=",
      " variant=",
      " size=",
      " render=",
      " asChild",
    ]) {
      expect(html).not.toContain(attribute)
    }
    expect(html).not.toContain("<script")
  })
})
