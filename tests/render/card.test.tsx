import { describe, expect, test } from "bun:test"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card"
import { query, render } from "../helpers/render"

describe("Card", () => {
  const page = (
    <Card size="sm" class="max-w-sm">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Manage</CardDescription>
        <CardAction>…</CardAction>
      </CardHeader>
      <CardContent>Body</CardContent>
      <CardFooter>Footer</CardFooter>
    </Card>
  )

  test("renders every part with its data-slot, in order", async () => {
    const html = await render(page)
    const slots = (await query(html, "[data-slot]")).map(
      (el) => el.attributes["data-slot"]
    )
    expect(slots).toEqual([
      "card",
      "card-header",
      "card-title",
      "card-description",
      "card-action",
      "card-content",
      "card-footer",
    ])
  })

  test("exposes size as data-size and keeps class overrides", async () => {
    const [card] = await query(await render(page), '[data-slot="card"]')
    expect(card?.attributes["data-size"]).toBe("sm")
    expect(card?.classes).toContain("max-w-sm")
    expect(card?.attributes).not.toHaveProperty("size")
  })

  test("defaults size to default", async () => {
    const [card] = await query(await render(<Card />), "div")
    expect(card?.attributes["data-size"]).toBe("default")
  })

  test("resolves the cn-font-heading marker to font-heading", async () => {
    const [title] = await query(await render(page), '[data-slot="card-title"]')
    expect(title?.classes).toContain("font-heading")
    expect(title?.classes.some((c) => c.startsWith("cn-"))).toBe(false)
  })
})
