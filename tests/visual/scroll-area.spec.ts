import { expect, type Page, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { pageUrl } from "./server-url"

/**
 * Scroll areas with the client script (public/shadcn/scroll-area.js) behave
 * like upstream Base UI: every step runs on both pages and the scroll
 * positions, the scrollbars, their thumbs and the overflow attributes must
 * match. Run `bun render.ts` first.
 */
const state = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('[data-slot="scroll-area"]')].map((root) => {
      const box = (element: Element | null) => {
        if (!(element instanceof HTMLElement) || !element.checkVisibility())
          return null
        const rect = element.getBoundingClientRect()
        return [rect.left, rect.top, rect.width, rect.height].map(Math.round)
      }
      const viewport = root.querySelector('[data-slot="scroll-area-viewport"]')
      const scrollbars = [
        ...root.querySelectorAll('[data-slot="scroll-area-scrollbar"]'),
      ]
      return {
        scroll: [viewport?.scrollLeft, viewport?.scrollTop].map((n) =>
          Math.round(n ?? 0)
        ),
        tabindex: viewport?.getAttribute("tabindex"),
        attributes: [...root.attributes]
          .map((a) => a.name)
          .filter((name) => /^data-(has-)?overflow/.test(name))
          .sort(),
        scrollbars: scrollbars
          .map((s) => [
            s.getAttribute("data-orientation"),
            box(s),
            box(s.querySelector('[data-slot="scroll-area-thumb"]')),
          ])
          .filter(([, rect]) => rect !== null),
      }
    })
  )

type Step = [description: string, act: (page: Page) => Promise<void>]

const frame = (page: Page) =>
  page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
  )

const area = (page: Page, index: number) =>
  page.locator('[data-slot="scroll-area"]').nth(index)

const thumb = (page: Page, index: number) =>
  area(page, index).locator('[data-slot="scroll-area-thumb"]')

const STEPS: Step[] = [
  ["initial", async () => {}],
  [
    "wheel scrolling moves the thumb",
    async (page) => {
      await area(page, 0).hover()
      await page.mouse.wheel(0, 120)
    },
  ],
  [
    "pressing the track jumps there",
    async (page) => {
      const box = await area(page, 0)
        .locator('[data-slot="scroll-area-scrollbar"]')
        .boundingBox()
      if (!box) throw new Error("no scrollbar")
      await page.mouse.click(box.x + box.width / 2, box.y + box.height - 10)
    },
  ],
  [
    "dragging the thumb scrolls",
    async (page) => {
      const box = await thumb(page, 0).boundingBox()
      if (!box) throw new Error("no thumb")
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width / 2, box.y - 60, { steps: 5 })
      await page.mouse.up()
    },
  ],
  [
    "horizontal scrolling",
    async (page) => {
      await area(page, 1).hover()
      await page.mouse.wheel(150, 0)
    },
  ],
]

test("scroll areas behave like upstream Base UI", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 400 },
  })
  const hono = await context.newPage()
  const react = await context.newPage()
  await hono.goto(pageUrl("scroll-area-hono.html"))
  await react.goto(pageUrl("scroll-area-react.html"))
  await area(react, 0).waitFor()
  for (const [description, act] of STEPS) {
    await act(hono)
    await act(react)
    // Scroll events (and the thumb updates) follow the next frame.
    await frame(hono)
    await test.step(description, async () => {
      await expect.poll(() => state(react)).toEqual(await state(hono))
    })
  }
})

test("scroll areas match upstream shadcn/ui", async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 400 },
    deviceScaleFactor: 1,
  })
  const shots: Buffer[] = []
  for (const file of ["scroll-area-hono.html", "scroll-area-react.html"]) {
    const page = await context.newPage()
    await page.goto(pageUrl(file))
    await area(page, 0).waitFor()
    await area(page, 0).hover()
    await page.mouse.wheel(0, 200)
    await page.mouse.move(790, 390)
    await page.waitForTimeout(700)
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
