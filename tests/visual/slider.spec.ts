import { expect, type Page, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { pageUrl } from "./server-url"

/**
 * Sliders with the client script (public/shadcn/slider.js) behave like
 * upstream Base UI: every step runs on both pages and values, focus and the
 * thumb and indicator geometry must match. Run `bun render.ts` first.
 */
const state = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('[data-slot="slider"]')].map((slider) => {
      const box = (element: Element | null) => {
        const rect = element?.getBoundingClientRect()
        return rect
          ? [rect.left, rect.top, rect.right, rect.bottom].map(Math.round)
          : null
      }
      return {
        values: [...slider.querySelectorAll('input[type="range"]')].map(
          (input) => (input as HTMLInputElement).value
        ),
        focused: [...slider.querySelectorAll('input[type="range"]')].findIndex(
          (input) => input.matches(":focus")
        ),
        // The indicator's end hides under the thumb (Base UI ends it at the
        // thumb's center, the server-rendered one within the thumb), so only
        // the thumbs are compared here and the pixels below.
        thumbs: [...slider.querySelectorAll('[data-slot="slider-thumb"]')].map(
          box
        ),
      }
    })
  )

type Step = [description: string, act: (page: Page) => Promise<void>]

const slider = (page: Page, index: number) =>
  page.locator('[data-slot="slider"]').nth(index)

/** Presses a slider's control at a fraction of its length. */
const press = async (page: Page, index: number, fraction: number) => {
  const control = slider(page, index).locator("> div").first()
  const box = await control.boundingBox()
  if (!box) throw new Error("slider not rendered")
  const vertical = box.height > box.width
  await page.mouse.click(
    vertical ? box.x + box.width / 2 : box.x + box.width * fraction,
    vertical ? box.y + box.height * (1 - fraction) : box.y + box.height / 2
  )
}

const STEPS: Step[] = [
  ["initial", async () => {}],
  ["pressing the control moves the thumb", (page) => press(page, 0, 0.75)],
  ["arrow keys step", (page) => page.keyboard.press("ArrowRight")],
  ["Page Up takes a large step", (page) => page.keyboard.press("PageUp")],
  ["End", (page) => page.keyboard.press("End")],
  ["Home", (page) => page.keyboard.press("Home")],
  ["the nearest range thumb moves", (page) => press(page, 1, 0.9)],
  ["the other one too", (page) => press(page, 1, 0.1)],
  [
    "range thumbs do not cross",
    async (page) => {
      for (let i = 0; i < 20; i++) await page.keyboard.press("ArrowRight")
    },
  ],
  [
    "dragging moves a thumb",
    async (page) => {
      const control = slider(page, 0).locator("> div").first()
      const box = await control.boundingBox()
      if (!box) throw new Error("slider not rendered")
      await page.mouse.move(box.x + 10, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width * 0.4, box.y + box.height / 2, {
        steps: 5,
      })
      await page.mouse.up()
    },
  ],
  ["disabled sliders do not move", (page) => press(page, 2, 0.8)],
  ["vertical sliders", (page) => press(page, 3, 0.25)],
]

test("sliders behave like upstream Base UI", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
  })
  const hono = await context.newPage()
  const react = await context.newPage()
  await hono.goto(pageUrl("slider-hono.html"))
  await react.goto(pageUrl("slider-react.html"))
  await slider(react, 0).waitFor()
  for (const [description, act] of STEPS) {
    await act(hono)
    await act(react)
    await test.step(description, async () => {
      await expect.poll(() => state(react)).toEqual(await state(hono))
    })
  }
})

test("sliders match upstream shadcn/ui", async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  })
  const shots: Buffer[] = []
  for (const file of ["slider-hono.html", "slider-react.html"]) {
    const page = await context.newPage()
    await page.goto(pageUrl(file))
    await page.waitForTimeout(300)
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
