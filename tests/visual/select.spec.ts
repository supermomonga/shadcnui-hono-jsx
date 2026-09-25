import path from "node:path"
import { pathToFileURL } from "node:url"
import { expect, type Page, type TestInfo, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"

/**
 * Behavior of the generated Select (customizable native select, no
 * JavaScript), and its closed and open states compared with upstream
 * shadcn/ui (Base UI). Run `bun render.ts` first.
 */
const OUT = path.join(import.meta.dirname, ".output")
const url = (file: string) => pathToFileURL(path.join(OUT, file)).href

const value = (page: Page, id: string) =>
  page
    .locator(`#${id}`)
    .evaluate((select) => (select as HTMLSelectElement).value)

test.describe("generated Select", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url("select-hono.html"))
  })

  test("is a named native select with a placeholder", async ({ page }) => {
    expect(await page.locator("script").count()).toBe(0)
    const fruit = page.locator("#fruit")
    await expect(fruit).toHaveAttribute("name", "fruit")
    expect(await value(page, "fruit")).toBe("")
    await expect(fruit.locator('[data-slot="select-value"]')).toHaveText(
      "Select a fruit"
    )
    expect(await value(page, "size")).toBe("medium")
    await expect(page.getByRole("option", { name: "Apple" })).toBeHidden()
  })

  test("selects an option with the pointer", async ({ page }) => {
    const fruit = page.locator("#fruit")
    const color = () => fruit.evaluate((s) => getComputedStyle(s).color)
    const placeholderColor = await color()
    await fruit.click()
    await page.getByRole("option", { name: "Banana" }).click()
    await expect(page.getByRole("option", { name: "Banana" })).toBeHidden()
    expect(await value(page, "fruit")).toBe("banana")
    await expect(fruit.locator('[data-slot="select-value"]')).toHaveText(
      "Banana"
    )
    await expect.poll(color).not.toBe(placeholderColor)
  })

  test("selects with the keyboard and closes on Escape", async ({ page }) => {
    // Like any native select, Space and the arrow keys open it (Enter does not).
    await page.locator("#size").focus()
    await page.keyboard.press("Space")
    await expect(page.getByRole("option", { name: "Large" })).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")
    expect(await value(page, "size")).toBe("large")

    await page.keyboard.press("ArrowDown")
    await expect(page.getByRole("option", { name: "Small" })).toBeVisible()
    await page.keyboard.press("ArrowUp")
    await page.keyboard.press("Escape")
    await expect(page.getByRole("option", { name: "Small" })).toBeHidden()
    expect(await value(page, "size")).toBe("large")
  })

  test("does not select disabled options", async ({ page }) => {
    await page.locator("#fruit").click()
    await page.getByRole("option", { name: "Leek" }).click({ force: true })
    expect(await value(page, "fruit")).toBe("")
  })
})

async function compare(page: Page, other: Page, testInfo: TestInfo) {
  const shots = [
    await page.screenshot({ animations: "disabled" }),
    await other.screenshot({ animations: "disabled" }),
  ]
  const [hono, upstream] = shots.map((b) => PNG.sync.read(b))
  if (!hono || !upstream) throw new Error("missing screenshots")
  await testInfo.attach("hono.png", {
    body: shots[0],
    contentType: "image/png",
  })
  await testInfo.attach("upstream.png", {
    body: shots[1],
    contentType: "image/png",
  })
  const diff = new PNG({ width: hono.width, height: hono.height })
  const changed = pixelmatch(
    hono.data,
    upstream.data,
    diff.data,
    hono.width,
    hono.height,
    { threshold: 0.1 }
  )
  if (changed > 0) {
    await testInfo.attach("diff.png", {
      body: PNG.sync.write(diff),
      contentType: "image/png",
    })
  }
  expect(changed / (hono.width * hono.height)).toBeLessThanOrEqual(0.001)
}

test("select matches upstream shadcn/ui, closed and open", async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 400 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  })
  const pages = await Promise.all(
    ["select-hono.html", "select-react.html"].map(async (file) => {
      const page = await context.newPage()
      await page.goto(url(file))
      return page
    })
  )
  const [hono, react] = pages as [Page, Page]
  await react.getByText("Medium").waitFor()
  await compare(hono, react, testInfo)
  // With a selected item, both highlight it when the list opens.
  for (const page of pages) {
    await page.locator("#size").click()
    await expect(page.getByRole("option", { name: "Large" })).toBeVisible()
    await page.waitForTimeout(400)
  }
  await compare(hono, react, testInfo)
})
