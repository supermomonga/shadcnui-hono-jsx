import { expect, type Page, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { pageUrl } from "./server-url"

/**
 * Avatars with the client script (public/shadcn/avatar.js) show like
 * upstream Base UI: a loaded image replaces the fallback and a broken one
 * leaves the fallback. Run `bun render.ts` first.
 */
const state = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('[data-slot="avatar"]')].map((avatar) => {
      const visible = (selector: string) =>
        [...avatar.querySelectorAll(selector)].some(
          (e) => e instanceof HTMLElement && e.checkVisibility()
        )
      return {
        image: visible('[data-slot="avatar-image"]'),
        fallback: visible('[data-slot="avatar-fallback"]'),
      }
    })
  )

/** Waits until every image has loaded or failed. */
const loaded = (page: Page) =>
  page.waitForFunction(() =>
    [...document.images].every((image) => image.complete)
  )

test("avatars show images and fallbacks like upstream Base UI", async ({
  browser,
}) => {
  const context = await browser.newContext()
  const hono = await context.newPage()
  const react = await context.newPage()
  await hono.goto(pageUrl("avatar-hono.html"))
  await react.goto(pageUrl("avatar-react.html"))
  await react.locator('[data-slot="avatar"]').first().waitFor()
  await loaded(hono)
  await expect.poll(() => state(react)).toEqual(await state(hono))
  expect(await state(hono)).toEqual([
    { image: true, fallback: false },
    { image: false, fallback: true },
    { image: false, fallback: true },
  ])
})

test("avatars match upstream shadcn/ui", async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    viewport: { width: 400, height: 120 },
    deviceScaleFactor: 1,
  })
  const shots: Buffer[] = []
  for (const file of ["avatar-hono.html", "avatar-react.html"]) {
    const page = await context.newPage()
    await page.goto(pageUrl(file))
    await page.locator('[data-slot="avatar"]').first().waitFor()
    await loaded(page)
    await page.waitForTimeout(200)
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
