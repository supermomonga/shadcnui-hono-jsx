import path from "node:path"
import { pathToFileURL } from "node:url"
import { expect, type Locator, type Page, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"

/**
 * Behavior and placement of the generated Popover (native popover, Invoker
 * Commands and CSS anchor positioning, no JavaScript), and its open state
 * compared with upstream shadcn/ui (Base UI). Run `bun render.ts` first.
 */
const OUT = path.join(import.meta.dirname, ".output")
const url = (file: string) => pathToFileURL(path.join(OUT, file)).href

async function open(page: Page, trigger: string) {
  await page.getByRole("button", { name: trigger }).click()
  const popover = page.getByRole("dialog", { name: trigger })
  await expect(popover).toBeVisible()
  // Wait for the entry animation (slide and zoom) to settle.
  await popover.evaluate((element) =>
    Promise.all(element.getAnimations().map((a) => a.finished))
  )
  return popover
}

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox()
  if (!rect) throw new Error("element is not rendered")
  return rect
}

test.describe("generated Popover", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url("popover-hono.html"))
  })

  test("ships no JavaScript and wires the trigger", async ({ page }) => {
    expect(await page.locator("script").count()).toBe(0)
    const trigger = page.getByRole("button", { name: "Dimensions" })
    await expect(trigger).toHaveAttribute("command", "toggle-popover")
    await expect(trigger).toHaveAttribute("commandfor", "dimensions")
    await expect(page.getByRole("dialog")).toHaveCount(0)
  })

  test("opens below the trigger, centered, with the side offset", async ({
    page,
  }) => {
    const popover = await open(page, "Dimensions")
    await expect(popover).toHaveAccessibleDescription(
      "Set the dimensions for the layer."
    )
    const trigger = await box(page.getByRole("button", { name: "Dimensions" }))
    const content = await box(popover)
    expect(content.y).toBeCloseTo(trigger.y + trigger.height + 4, 0)
    expect(content.x + content.width / 2).toBeCloseTo(
      trigger.x + trigger.width / 2,
      0
    )
  })

  test("places side=right align=start next to the trigger", async ({
    page,
  }) => {
    const popover = await open(page, "Details")
    const trigger = await box(page.getByRole("button", { name: "Details" }))
    const content = await box(popover)
    expect(content.x).toBeCloseTo(trigger.x + trigger.width + 8, 0)
    expect(content.y).toBeCloseTo(trigger.y, 0)
  })

  test("closes on Escape, an outside click and the trigger", async ({
    page,
  }) => {
    let popover = await open(page, "Dimensions")
    await page.getByLabel("Width").focus()
    await page.keyboard.press("Escape")
    await expect(popover).toBeHidden()
    await expect(page.getByRole("button", { name: "Dimensions" })).toBeFocused()

    popover = await open(page, "Dimensions")
    await page.mouse.click(5, 5)
    await expect(popover).toBeHidden()

    popover = await open(page, "Dimensions")
    await page.getByRole("button", { name: "Dimensions" }).click()
    await expect(popover).toBeHidden()
  })

  test("opening another popover closes the first", async ({ page }) => {
    const first = await open(page, "Dimensions")
    await open(page, "Details")
    await expect(first).toBeHidden()
  })

  test("animates out before it is hidden", async ({ page }) => {
    const popover = await open(page, "Dimensions")
    const closing = await popover.evaluate((element: HTMLElement) => {
      element.hidePopover()
      return {
        open: element.matches(":popover-open"),
        display: getComputedStyle(element).display,
        animations: element.getAnimations().length,
      }
    })
    expect(closing.open).toBe(false)
    expect(closing.display).not.toBe("none")
    expect(closing.animations).toBeGreaterThan(0)
    await expect(popover).toBeHidden()
  })
})

for (const trigger of ["Dimensions", "Details"]) {
  test(`open popover (${trigger}) matches upstream shadcn/ui`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 800, height: 600 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    })
    const shots: Buffer[] = []
    for (const file of ["popover-hono.html", "popover-react.html"]) {
      const page = await context.newPage()
      await page.goto(url(file))
      await open(page, trigger)
      // Same focus state on both pages (Base UI moves focus into the popup).
      // The demo trigger sits at whole-pixel coordinates: Base UI rounds
      // positions to pixels, anchor positioning does not, and text would
      // otherwise render at a sub-pixel offset.
      await page.locator("#after").focus()
      await page.waitForTimeout(400)
      shots.push(await page.screenshot({ animations: "disabled" }))
    }
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
  })
}
