import { expect, type Page, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { pageUrl } from "./server-url"

/**
 * Toasts from the client script (public/shadcn/toast.js) behave like
 * upstream Base UI: every step runs on both pages and the stacked toasts,
 * their state attributes and positions must match. Run `bun render.ts` first.
 */
const state = (page: Page) =>
  page.evaluate(() => {
    const viewport = document.querySelector('[data-slot="toast-viewport"]')
    return {
      expanded: viewport?.hasAttribute("data-expanded") ?? false,
      toasts: [...document.querySelectorAll('[data-slot="toast"]')]
        .filter((root) => root.closest("template") === null)
        .filter((root) => !root.hasAttribute("data-ending-style"))
        .map((root) => {
          const rect = root.getBoundingClientRect()
          const content = root.querySelector('[data-slot="toast-content"]')
          return {
            text: root.textContent,
            type: root.getAttribute("data-type"),
            role: root.getAttribute("role"),
            limited: root.hasAttribute("data-limited"),
            behind: content?.hasAttribute("data-behind") ?? false,
            index: getComputedStyle(root).getPropertyValue("--toast-index"),
            box: [rect.left, rect.top, rect.width, rect.height].map(Math.round),
          }
        }),
    }
  })

/** Adds a toast with the page's toast manager. */
const add = (page: Page, options: Record<string, unknown>) =>
  page.evaluate(async (options) => {
    const manager =
      (window as unknown as { __toast?: { add(o: unknown): string } })
        .__toast ??
      // @ts-expect-error: served by tests/visual/serve.ts
      (await import("/shadcn/toast.js")).toast
    manager.add(options)
  }, options)

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

const toastBox = async (page: Page) => {
  const box = await page
    .locator('[data-slot="toast"]:not([data-ending-style])')
    .first()
    .boundingBox()
  if (!box) throw new Error("no toast")
  return box
}

const STEPS: Step[] = [
  ["initial", async () => {}],
  [
    "a trigger adds a toast",
    async (page) => {
      await page.locator("#plain").click()
      await page.mouse.move(10, 590)
      await settle(page)
    },
  ],
  [
    "a newer toast stacks in front",
    async (page) => {
      await add(page, {
        title: "Done",
        type: "success",
        timeout: 0,
        actionProps: { children: "Undo" },
      })
      await settle(page)
    },
  ],
  [
    "hovering expands the stack",
    async (page) => {
      const box = await toastBox(page)
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await settle(page)
    },
  ],
  [
    "the close button closes a toast",
    async (page) => {
      await page
        .locator('[data-slot="toast"]:not([data-ending-style])')
        .first()
        .locator('[data-slot="toast-close"]')
        .click()
      await settle(page)
    },
  ],
  [
    "leaving collapses the stack",
    async (page) => {
      await page.mouse.move(10, 590)
      await settle(page)
    },
  ],
  [
    "only three toasts show at once",
    async (page) => {
      for (const title of ["One", "Two", "Three"]) {
        await add(page, { title, timeout: 0 })
      }
      await settle(page)
    },
  ],
  [
    "a swipe down closes the front toast",
    async (page) => {
      const box = await toastBox(page)
      const x = box.x + 40
      const y = box.y + box.height / 2
      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.mouse.move(x, y + 60, { steps: 6 })
      await page.mouse.up()
      await page.mouse.move(10, 590)
      await settle(page)
    },
  ],
  [
    "a toast closes after its timeout",
    async (page) => {
      await add(page, { title: "Brief", timeout: 300 })
      await page.waitForTimeout(700)
      await settle(page)
    },
  ],
]

test("toasts behave like upstream Base UI", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
  })
  const hono = await context.newPage()
  const react = await context.newPage()
  await hono.goto(pageUrl("toast-hono.html"))
  await react.goto(pageUrl("toast-react.html"))
  await react.locator("#plain").waitFor()
  for (const [description, act] of STEPS) {
    await act(hono)
    await act(react)
    await test.step(description, async () => {
      await expect.poll(() => state(react)).toEqual(await state(hono))
    })
  }
})

const SCENES: [
  name: string,
  file: string,
  act: (page: Page) => Promise<void>,
][] = [
  ["server-rendered toast", "toast-server", async () => {}],
  [
    "stacked toasts",
    "toast",
    async (page) => {
      await add(page, {
        title: "Saved",
        description: "Your changes were saved.",
        timeout: 0,
      })
      await add(page, {
        title: "Done",
        type: "success",
        timeout: 0,
        actionProps: { children: "Undo" },
      })
    },
  ],
  [
    "expanded toasts",
    "toast",
    async (page) => {
      await add(page, {
        title: "Saved",
        description: "Your changes were saved.",
        timeout: 0,
      })
      await add(page, { title: "Failed", type: "error", timeout: 0 })
      await settle(page)
      const box = await toastBox(page)
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    },
  ],
]

for (const [scene, file, act] of SCENES) {
  test(`toasts match upstream shadcn/ui: ${scene}`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 800, height: 600 },
      deviceScaleFactor: 1,
    })
    const shots: Buffer[] = []
    for (const kind of ["hono", "react"]) {
      const page = await context.newPage()
      await page.goto(pageUrl(`${file}-${kind}.html`))
      await page.locator("main").waitFor()
      await page.waitForTimeout(100)
      await act(page)
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
