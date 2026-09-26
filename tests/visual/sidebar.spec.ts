import { expect, type Page, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { pageUrl } from "./server-url"

/**
 * Sidebars with the client script (public/shadcn/sidebar.js) behave like
 * upstream: every step runs on both pages and the sidebar state, its size,
 * the tooltip, the mobile sheet and the cookie must match. Run
 * `bun render.ts` first.
 */
const state = (page: Page) =>
  page.evaluate(() => {
    const box = (element: Element | null | undefined) => {
      if (!(element instanceof HTMLElement) || !element.checkVisibility())
        return null
      const rect = element.getBoundingClientRect()
      return [rect.left, rect.top, rect.width, rect.height].map(Math.round)
    }
    const desktop = document.querySelector(
      '[data-slot="sidebar"]:not([data-mobile])'
    )
    const sheet = document.querySelector(
      '[data-slot="sidebar"][data-mobile="true"]'
    )
    const tooltip = [
      ...document.querySelectorAll('[data-slot="tooltip-content"]'),
    ].find((t) => t instanceof HTMLElement && t.checkVisibility())
    // Upstream renders no desktop sidebar on narrow screens; ours is hidden.
    const shown = desktop instanceof HTMLElement && desktop.checkVisibility()
    return {
      state: shown ? desktop.getAttribute("data-state") : null,
      collapsible: shown ? desktop.getAttribute("data-collapsible") : null,
      container: box(document.querySelector('[data-slot="sidebar-container"]')),
      inset: box(document.querySelector('[data-slot="sidebar-inset"]')),
      sheet: box(sheet),
      sheetText:
        sheet instanceof HTMLElement && sheet.checkVisibility()
          ? sheet.innerText.replace(/\s+/g, " ").trim()
          : null,
      tooltip: tooltip?.textContent ?? null,
      cookie: document.cookie,
    }
  })

/** Waits for running transitions and animations to finish. */
const settle = (page: Page) =>
  page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await Promise.all(
      document.getAnimations().map((a) => a.finished.catch(() => undefined))
    )
    await new Promise((resolve) => setTimeout(resolve, 100))
  })

type Step = [description: string, act: (page: Page) => Promise<void>]

const trigger = (page: Page) =>
  page.locator('[data-slot="sidebar-trigger"]').click()

const DESKTOP: Step[] = [
  ["initial", async () => {}],
  ["the trigger collapses to icons", trigger],
  [
    "a collapsed menu button shows its tooltip",
    async (page) => {
      await page.locator('[data-slot="sidebar-menu-button"]').nth(2).hover()
      // Past the tooltip's opening delay.
      await page.waitForTimeout(800)
    },
  ],
  [
    "the rail expands",
    async (page) => {
      await page.mouse.move(700, 500)
      await page.locator('[data-slot="sidebar-rail"]').click({ force: true })
    },
  ],
  [
    "an expanded menu button shows no tooltip",
    async (page) => {
      await page.locator('[data-slot="sidebar-menu-button"]').nth(2).hover()
      // Past the tooltip's opening delay.
      await page.waitForTimeout(800)
    },
  ],
  [
    "Ctrl+B toggles",
    async (page) => {
      await page.mouse.move(700, 500)
      await page.keyboard.press("Control+b")
    },
  ],
]

const MOBILE: Step[] = [
  ["initial", async () => {}],
  ["the trigger opens the sheet", trigger],
  ["Escape closes it", (page) => page.keyboard.press("Escape")],
  ["the trigger opens it again", trigger],
]

for (const [layout, viewport, steps] of [
  ["wide", { width: 1024, height: 600 }, DESKTOP],
  ["narrow", { width: 500, height: 700 }, MOBILE],
] as const) {
  test(`${layout} sidebars behave like upstream`, async ({ browser }) => {
    const context = await browser.newContext({ viewport })
    const hono = await context.newPage()
    const react = await context.newPage()
    await hono.goto(pageUrl("sidebar-hono.html"))
    await react.goto(pageUrl("sidebar-react.html"))
    await react.locator('[data-slot="sidebar-wrapper"]').waitFor()
    for (const [description, act] of steps) {
      await act(hono)
      await settle(hono)
      await act(react)
      await settle(react)
      await test.step(description, async () => {
        await expect.poll(() => state(react)).toEqual(await state(hono))
      })
    }
  })
}

test("a sidebar inserted later hides its tooltips in the mobile sheet", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 600 },
  })
  const page = await context.newPage()
  await page.goto(pageUrl("sidebar-hono.html"))
  await trigger(page)
  await settle(page)
  // What the server renders for a collapsed sidebar.
  const wrapper = page.locator('[data-slot="sidebar-wrapper"]')
  const html = await wrapper.evaluate((element) => element.outerHTML)
  await page.setViewportSize({ width: 500, height: 700 })
  // The script has handled the resize, before the swap.
  await expect(page.locator("[data-sidebar-tooltip]").first()).toHaveAttribute(
    "hidden",
    ""
  )
  // Swapped in on a narrow screen, like htmx does.
  await wrapper.evaluate((element, html) => {
    const template = document.createElement("template")
    template.innerHTML = html
    element.replaceWith(template.content)
  }, html)
  await trigger(page)
  await settle(page)
  // Hidden tooltips never open, however long a menu button is hovered.
  const tooltips = page.locator(
    '[data-slot="sidebar"][data-mobile="true"] [data-sidebar-tooltip]'
  )
  await expect(tooltips).toHaveCount(4)
  expect(
    await tooltips.evaluateAll((all) =>
      all.every((tooltip) => (tooltip as HTMLElement).hidden)
    )
  ).toBe(true)
})

const SCENES: [
  name: string,
  viewport: { width: number; height: number },
  act: (page: Page) => Promise<void>,
][] = [
  ["expanded", { width: 1024, height: 600 }, async () => {}],
  ["collapsed to icons", { width: 1024, height: 600 }, trigger],
  ["mobile sheet", { width: 500, height: 700 }, trigger],
]

for (const [scene, viewport, act] of SCENES) {
  test(`sidebars match upstream shadcn/ui: ${scene}`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
    const shots: Buffer[] = []
    for (const kind of ["hono", "react"]) {
      const page = await context.newPage()
      await page.goto(pageUrl(`sidebar-${kind}.html`))
      await page.locator('[data-slot="sidebar-wrapper"]').waitFor()
      await act(page)
      await page.mouse.move(viewport.width - 10, viewport.height - 10)
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
}
