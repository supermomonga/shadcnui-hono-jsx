import path from "node:path"
import { pathToFileURL } from "node:url"
import { expect, type Page, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"

/**
 * Behavior and accessibility of the generated Dialog (native <dialog> with
 * Invoker Commands, no JavaScript), and its open state compared with upstream
 * shadcn/ui (Base UI). Run `bun render.ts` first.
 */
const OUT = path.join(import.meta.dirname, ".output")
const url = (file: string) => pathToFileURL(path.join(OUT, file)).href

async function open(page: Page) {
  await page.getByRole("button", { name: "Edit profile" }).click()
  const dialog = page.getByRole("dialog", { name: "Edit profile" })
  await expect(dialog).toBeVisible()
  return dialog
}

const focusInsideDialog = (page: Page) =>
  page.evaluate(() => Boolean(document.activeElement?.closest("dialog")))

test.describe("generated Dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url("dialog-hono.html"))
  })

  test("ships no JavaScript and wires the trigger with Invoker Commands", async ({
    page,
  }) => {
    expect(await page.locator("script").count()).toBe(0)
    const trigger = page.getByRole("button", { name: "Edit profile" })
    await expect(trigger).toHaveAttribute("aria-haspopup", "dialog")
    await expect(trigger).toHaveAttribute("command", "show-modal")
    await expect(trigger).toHaveAttribute("commandfor", "edit-profile")
    await expect(page.getByRole("dialog")).toBeHidden()
  })

  test("opens as a labelled, described modal and moves focus inside", async ({
    page,
  }) => {
    const dialog = await open(page)
    await expect(dialog).toHaveAccessibleDescription(
      "Make changes to your profile here. Click save when you're done."
    )
    expect(await dialog.evaluate((d) => d.matches(":modal"))).toBe(true)
    expect(await focusInsideDialog(page)).toBe(true)
  })

  test("never moves keyboard focus to page content while open", async ({
    page,
  }) => {
    await open(page)
    // A native modal lets Tab reach the browser UI (document.body) after the
    // last control, then wraps back; the inert page content is never focused.
    let returned = false
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab")
      const where = await page.evaluate(() => {
        const active = document.activeElement
        if (!active || active === document.body) return "browser"
        return active.closest("dialog") ? "dialog" : "page"
      })
      expect(where).not.toBe("page")
      if (i > 0 && where === "dialog") returned = true
    }
    expect(returned).toBe(true)
  })

  test("closes on Escape and returns focus to the trigger", async ({
    page,
  }) => {
    const dialog = await open(page)
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    await expect(
      page.getByRole("button", { name: "Edit profile" })
    ).toBeFocused()
  })

  test("closes from the close icon button and the footer button", async ({
    page,
  }) => {
    let dialog = await open(page)
    await dialog.locator('[data-slot="dialog-close"]').click()
    await expect(dialog).toBeHidden()

    dialog = await open(page)
    await dialog.getByRole("button", { name: "Close" }).last().click()
    await expect(dialog).toBeHidden()
  })

  test("closes on an outside click (closedby=any)", async ({ page }) => {
    const dialog = await open(page)
    await page.mouse.click(5, 5)
    await expect(dialog).toBeHidden()
  })
})

test("open dialog matches upstream shadcn/ui", async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  })
  const shots: Buffer[] = []
  for (const file of ["dialog-hono.html", "dialog-react.html"]) {
    const page = await context.newPage()
    await page.goto(url(file))
    await open(page)
    // Same focus state on both (Base UI refocuses the popup if focus is removed).
    await page.locator("#name").focus()
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
    {
      threshold: 0.1,
    }
  )
  if (changed > 0) {
    await testInfo.attach("diff.png", {
      body: PNG.sync.write(diff),
      contentType: "image/png",
    })
  }
  expect(changed / (hono.width * hono.height)).toBeLessThanOrEqual(0.001)
})
