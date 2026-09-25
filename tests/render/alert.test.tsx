import { describe, expect, test } from "bun:test"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "../../components/ui/alert"
import { query, render } from "../helpers/render"

describe("Alert", () => {
  test("renders role=alert with its parts", async () => {
    const html = await render(
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something failed.</AlertDescription>
        <AlertAction>Retry</AlertAction>
      </Alert>
    )
    const [alert] = await query(html, '[data-slot="alert"]')
    expect(alert?.attributes.role).toBe("alert")
    expect(alert?.classes).toContain("text-destructive")
    expect(alert?.attributes).not.toHaveProperty("variant")
    const slots = (await query(html, "[data-slot]")).map(
      (el) => el.attributes["data-slot"]
    )
    expect(slots).toEqual([
      "alert",
      "alert-title",
      "alert-description",
      "alert-action",
    ])
  })
})
