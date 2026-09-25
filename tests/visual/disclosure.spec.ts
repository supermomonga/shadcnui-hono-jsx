import { expect, type Locator, type Page, test } from "@playwright/test"
import { pageUrl } from "./server-url"

/**
 * Behavior and accessibility of the generated Accordion and Collapsible
 * (native <details>/<summary>, no JavaScript), using the visual cases page,
 * and of a Collapsible whose trigger is not its first child (with its script).
 * Their appearance is compared with upstream in parity.spec.ts. Run
 * `bun render.ts` first.
 */
const HONO = pageUrl("hono.html")

const isOpen = (item: Locator) =>
  item.evaluate((details) => (details as HTMLDetailsElement).open)

test.beforeEach(async ({ page }) => {
  await page.goto(HONO)
})

test("ships no JavaScript", async ({ page }) => {
  expect(await page.locator("script").count()).toBe(0)
})

test.describe("generated Accordion", () => {
  const item = (section: Locator, title: string) =>
    section.locator("details", {
      has: section.page().locator("summary", { hasText: title }),
    })

  test("opens the default item and labels its panel", async ({ page }) => {
    const section = page.locator('[data-case="accordion/default@light"]')
    expect(await isOpen(item(section, "Shipping Details"))).toBe(true)
    expect(await isOpen(item(section, "Product Information"))).toBe(false)
    await expect(
      section.getByRole("region", { name: "Shipping Details" })
    ).toBeVisible()
    await expect(
      section.getByText("Our flagship product combines")
    ).toBeHidden()
  })

  test("opening an item closes the open one", async ({ page }) => {
    const section = page.locator('[data-case="accordion/default@light"]')
    await section.locator("summary", { hasText: "Return Policy" }).click()
    expect(await isOpen(item(section, "Return Policy"))).toBe(true)
    expect(await isOpen(item(section, "Shipping Details"))).toBe(false)
    await expect(
      section.getByText("We stand behind our products")
    ).toBeVisible()
  })

  test("toggles from the keyboard and swaps the chevron", async ({ page }) => {
    const section = page.locator('[data-case="accordion/default@light"]')
    const trigger = section.locator("summary", {
      hasText: "Product Information",
    })
    await trigger.focus()
    await page.keyboard.press("Enter")
    expect(await isOpen(item(section, "Product Information"))).toBe(true)
    await expect(trigger.locator("svg.lucide-chevron-up")).toBeVisible()
    await expect(trigger.locator("svg.lucide-chevron-down")).toBeHidden()
    await page.keyboard.press("Space")
    expect(await isOpen(item(section, "Product Information"))).toBe(false)
    await expect(trigger.locator("svg.lucide-chevron-down")).toBeVisible()
  })

  test("keeps items independent with multiple", async ({ page }) => {
    const section = page.locator('[data-case="accordion/multiple@light"]')
    expect(await isOpen(item(section, "Is it accessible?"))).toBe(true)
    expect(await isOpen(item(section, "Is it styled?"))).toBe(true)
    await section.locator("summary", { hasText: "Is it styled?" }).click()
    expect(await isOpen(item(section, "Is it styled?"))).toBe(false)
    expect(await isOpen(item(section, "Is it accessible?"))).toBe(true)
  })

  test("disabled items cannot be focused or opened", async ({ page }) => {
    const section = page.locator('[data-case="accordion/multiple@light"]')
    const trigger = section.locator("summary", { hasText: "Is it disabled?" })
    await expect(trigger).toHaveAttribute("aria-disabled", "true")
    await expect(trigger).toHaveAttribute("tabindex", "-1")
    const box = await trigger.boundingBox()
    if (!box) throw new Error("disabled trigger is not rendered")
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    expect(await isOpen(item(section, "Is it disabled?"))).toBe(false)

    await section.locator("summary", { hasText: "Is it styled?" }).focus()
    await page.keyboard.press("Tab")
    const focused = await page.evaluate(
      () => document.activeElement?.textContent ?? ""
    )
    expect(focused).not.toContain("Is it disabled?")
  })
})

test.describe("generated Collapsible", () => {
  test("toggles its content from the trigger", async ({ page }) => {
    const section = page.locator('[data-case="collapsible/states@light"]')
    const [open, closed] = [
      section.locator("details").nth(0),
      section.locator("details").nth(1),
    ]
    await expect(open.getByText("Shipped on September 12")).toBeVisible()
    await expect(closed.getByText("Processing")).toBeHidden()

    await closed.locator("summary").click()
    await expect(closed.getByText("Processing")).toBeVisible()
    await open.locator("summary").focus()
    await page.keyboard.press("Enter")
    await expect(open.getByText("Shipped on September 12")).toBeHidden()
  })
})

/**
 * With the trigger elsewhere than first, the client script
 * (public/shadcn/collapsible.js) toggles the panel like upstream Base UI.
 */
test.describe("generated Collapsible with the trigger in a header", () => {
  const collapsibleState = (page: Page) =>
    page.evaluate(() => {
      const root = document.querySelector('[data-slot="collapsible"]')
      const trigger = document.querySelector(
        '[data-slot="collapsible-trigger"]'
      )
      const panel = document.querySelector('[data-slot="collapsible-content"]')
      return {
        open: root?.hasAttribute("data-open"),
        closed: root?.hasAttribute("data-closed"),
        expanded: trigger?.getAttribute("aria-expanded"),
        panelOpen: trigger?.hasAttribute("data-panel-open"),
        controls:
          trigger?.getAttribute("aria-controls") === (panel?.id ?? null) ||
          trigger?.getAttribute("aria-controls") === null,
        visible: panel instanceof HTMLElement ? panel.checkVisibility() : false,
        focused:
          document.activeElement === document.body
            ? "body"
            : document.activeElement?.textContent?.trim(),
      }
    })

  const STEPS: [string, (page: Page) => Promise<void>][] = [
    ["initial", async () => {}],
    [
      "a click opens",
      (page) => page.getByRole("button", { name: "Toggle" }).click(),
    ],
    ["Enter closes", (page) => page.keyboard.press("Enter")],
    ["Space opens", (page) => page.keyboard.press(" ")],
  ]

  test("toggles like upstream Base UI", async ({ browser }) => {
    const context = await browser.newContext()
    const hono = await context.newPage()
    const react = await context.newPage()
    await hono.goto(pageUrl("collapsible-hono.html"))
    await react.goto(pageUrl("collapsible-react.html"))
    await react.locator('[data-slot="collapsible"]').waitFor()
    for (const [description, act] of STEPS) {
      await act(hono)
      await act(react)
      await test.step(description, async () => {
        await expect
          .poll(() => collapsibleState(react))
          .toEqual(await collapsibleState(hono))
      })
    }
  })
})
