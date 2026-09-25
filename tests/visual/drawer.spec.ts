import { expect, type Page, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { pageUrl } from "./server-url"

/**
 * Drawers (native <dialog>, swiping from /shadcn/drawer.js) behave like
 * upstream Base UI: every step runs on both pages and the open state, the
 * popup position and the swipe state must match. Run `bun render.ts` first.
 */
const state = (page: Page) =>
  page.evaluate(() => {
    const popup = document.querySelector('[data-slot="drawer-popup"]')
    const visible = popup instanceof HTMLElement && popup.checkVisibility()
    return {
      open: visible,
      top: visible ? Math.round(popup.getBoundingClientRect().top) : null,
      swiping: visible ? popup.hasAttribute("data-swiping") : null,
      movement: visible
        ? getComputedStyle(popup).getPropertyValue("--drawer-swipe-movement-y")
        : null,
    }
  })

/** Waits for running transitions and animations to finish. */
const settle = (page: Page) =>
  page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await Promise.all(
      document.getAnimations().map((a) => a.finished.catch(() => undefined))
    )
    await new Promise((resolve) => setTimeout(resolve, 50))
  })

/** Drags the swipe handle down by `distance` pixels, `release`ing or not. */
const drag = async (page: Page, distance: number, release = true) => {
  const box = await page
    .locator('[data-slot="drawer-swipe-handle"]')
    .boundingBox()
  if (!box) throw new Error("no swipe handle")
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let moved = 10; moved <= distance; moved += 10) {
    await page.mouse.move(x, y + moved)
    await page.waitForTimeout(30)
  }
  if (release) {
    await page.waitForTimeout(100)
    await page.mouse.up()
    await settle(page)
  }
}

type Step = [description: string, act: (page: Page) => Promise<void>]

const open = async (page: Page) => {
  await page.getByRole("button", { name: "Open drawer" }).click()
  await settle(page)
}

const STEPS: Step[] = [
  ["initial", async () => {}],
  ["the trigger opens", open],
  ["dragging the handle moves the drawer", (page) => drag(page, 60, false)],
  [
    "a short drag slides back",
    async (page) => {
      await page.waitForTimeout(100)
      await page.mouse.up()
      await settle(page)
    },
  ],
  ["a long drag closes", (page) => drag(page, 180)],
  [
    "Escape closes",
    async (page) => {
      await open(page)
      await page.keyboard.press("Escape")
      await settle(page)
    },
  ],
  [
    "the close button closes",
    async (page) => {
      await open(page)
      await page.getByRole("button", { name: "Cancel" }).click()
      await settle(page)
    },
  ],
]

test("drawers behave like upstream Base UI", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
  })
  const hono = await context.newPage()
  const react = await context.newPage()
  await hono.goto(pageUrl("drawer-hono.html"))
  await react.goto(pageUrl("drawer-react.html"))
  await react.getByRole("button", { name: "Open drawer" }).waitFor()
  for (const [description, act] of STEPS) {
    await act(hono)
    await act(react)
    await test.step(description, async () => {
      await expect.poll(() => state(react)).toEqual(await state(hono))
    })
  }
})

test("an open drawer matches upstream shadcn/ui", async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 1,
  })
  const shots: Buffer[] = []
  for (const file of ["drawer-hono.html", "drawer-react.html"]) {
    const page = await context.newPage()
    await page.goto(pageUrl(file))
    await open(page)
    await page.mouse.move(790, 10)
    // Focus rings differ (the browser focuses the dialog's first control).
    await page.evaluate(() =>
      (document.activeElement as HTMLElement | null)?.blur()
    )
    await settle(page)
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
