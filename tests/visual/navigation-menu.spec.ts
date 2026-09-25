import { expect, type Page, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { pageUrl } from "./server-url"

/**
 * Navigation menus with the client script (public/shadcn/navigation-menu.js)
 * behave like upstream Base UI: every step runs on both pages and the open
 * item, the shown content, its geometry and focus must match. Run
 * `bun render.ts` first.
 */
const state = (page: Page) =>
  page.evaluate(() => {
    const box = (element: Element | null | undefined) => {
      const rect = element?.getBoundingClientRect()
      return rect
        ? [rect.left, rect.top, rect.width, rect.height].map(Math.round)
        : null
    }
    const visible = (element: Element) =>
      element instanceof HTMLElement && element.checkVisibility()
    const root = document.querySelector('[data-slot="navigation-menu"]')
    const content = [
      ...document.querySelectorAll('[data-slot="navigation-menu-content"]'),
    ].find(visible)
    const popup = content?.parentElement?.closest("nav")
    const active = document.activeElement
    return {
      open: root?.hasAttribute("data-open") ?? false,
      triggers: [
        ...document.querySelectorAll('[data-slot="navigation-menu-trigger"]'),
      ].map((t) => [
        t.textContent?.trim(),
        t.getAttribute("aria-expanded"),
        t.hasAttribute("data-popup-open"),
      ]),
      content: content?.textContent ?? null,
      popup: box(popup),
      controls: [
        ...document.querySelectorAll('[data-slot="navigation-menu-trigger"]'),
      ].some(
        (t) =>
          t.getAttribute("aria-controls") !== null &&
          document.getElementById(t.getAttribute("aria-controls") ?? "") ===
            popup
      ),
      current: [...document.querySelectorAll('[aria-current="page"]')]
        .filter(visible)
        .map((a) => a.textContent),
      focused:
        active === document.body
          ? "body"
          : `${active?.tagName.toLowerCase()} ${active?.textContent?.trim()}`,
    }
  })

type Step = [description: string, act: (page: Page) => Promise<void>]

const center = async (page: Page, name: string) => {
  const box = await page
    .getByRole("button", { name, exact: true })
    .or(page.getByRole("link", { name, exact: true }))
    .first()
    .boundingBox()
  if (!box) throw new Error(`${name} not rendered`)
  return [box.x + box.width / 2, box.y + box.height / 2] as const
}

/** Waits for running transitions and animations to finish. */
const settle = (page: Page) =>
  page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await Promise.all(
      document.getAnimations().map((a) => a.finished.catch(() => undefined))
    )
    await new Promise((resolve) => setTimeout(resolve, 50))
  })

const hover = async (page: Page, name: string) => {
  await page.mouse.move(...(await center(page, name)), { steps: 5 })
  await page.waitForTimeout(150)
  await settle(page)
}

const click = async (page: Page, name: string) => {
  await page.mouse.click(...(await center(page, name)))
  await settle(page)
}

const press = async (page: Page, key: string) => {
  await page.keyboard.press(key)
  await settle(page)
}

const STEPS: Step[] = [
  ["initial", async () => {}],
  ["resting on a trigger opens it", (page) => hover(page, "Getting started")],
  ["moving to another trigger switches", (page) => hover(page, "Components")],
  [
    "leaving closes a hover-opened menu",
    async (page) => {
      await page.mouse.move(700, 500, { steps: 5 })
      await page.waitForTimeout(150)
      await settle(page)
    },
  ],
  ["a click opens and sticks", (page) => click(page, "Components")],
  [
    "leaving keeps a click-opened menu",
    async (page) => {
      await page.mouse.move(700, 500, { steps: 5 })
      await page.waitForTimeout(150)
      await settle(page)
    },
  ],
  ["clicking the trigger again closes", (page) => click(page, "Components")],
  [
    "Tab reaches the first trigger",
    async (page) => {
      await page.mouse.move(700, 500)
      await page.evaluate(() =>
        (document.activeElement as HTMLElement | null)?.blur()
      )
      await press(page, "Tab")
    },
  ],
  [
    "ArrowRight moves between triggers without opening",
    (page) => press(page, "ArrowRight"),
  ],
  ["ArrowDown opens", (page) => press(page, "ArrowDown")],
  ["Tab enters the content", (page) => press(page, "Tab")],
  ["arrow keys move inside the content", (page) => press(page, "ArrowDown")],
  ["and loop", (page) => press(page, "ArrowDown")],
  ["ArrowUp", (page) => press(page, "ArrowUp")],
  ["Escape closes and focuses the trigger", (page) => press(page, "Escape")],
  ["Enter opens", (page) => press(page, "Enter")],
  [
    "Tab past the content continues after the trigger",
    async (page) => {
      for (let i = 0; i < 4; i++) await press(page, "Tab")
    },
  ],
  ["Tab out of the menu closes it", (page) => press(page, "Tab")],
  [
    "a click outside closes",
    async (page) => {
      await click(page, "Getting started")
      await page.mouse.click(700, 500)
      await settle(page)
    },
  ],
]

test("navigation menus behave like upstream Base UI", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
  })
  const hono = await context.newPage()
  const react = await context.newPage()
  await hono.goto(pageUrl("navigation-menu-hono.html"))
  await react.goto(pageUrl("navigation-menu-react.html"))
  await react.locator('[data-slot="navigation-menu"]').waitFor()
  for (const [description, act] of STEPS) {
    await act(hono)
    await act(react)
    await test.step(description, async () => {
      await expect.poll(() => state(react)).toEqual(await state(hono))
    })
  }
})

const SCENES: [name: string, act: (page: Page) => Promise<void>][] = [
  ["closed", async () => {}],
  ["first item", (page) => click(page, "Getting started")],
  ["second item", (page) => click(page, "Components")],
]

for (const [scene, act] of SCENES) {
  test(`navigation menus match upstream shadcn/ui: ${scene}`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 800, height: 600 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    })
    const shots: Buffer[] = []
    for (const file of [
      "navigation-menu-hono.html",
      "navigation-menu-react.html",
    ]) {
      const page = await context.newPage()
      await page.goto(pageUrl(file))
      await page.locator('[data-slot="navigation-menu"]').waitFor()
      await act(page)
      await page.mouse.move(790, 590)
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
