import { expect, type Page, type TestInfo, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { pageUrl } from "./server-url"

/**
 * Menus with the client script (public/shadcn/menu.js) behave like upstream
 * Base UI: every step runs on both pages and their states must match, and
 * the open menu is compared by screenshots. Run `bun render.ts` first.
 */

/** What the user perceives: open menus, the focused element, checked items. */
const state = (page: Page) =>
  page.evaluate(() => {
    const visible = (element: Element) =>
      (element as HTMLElement).checkVisibility()
    const label = (element: Element | null) => {
      if (!element || element === document.body) return "(body)"
      const role = element.getAttribute("role")
      if (role === "menu") return "menu"
      return `${role ?? element.tagName.toLowerCase()}: ${element.textContent?.trim()}`
    }
    return {
      menus: [...document.querySelectorAll('[role="menu"]')]
        .filter(visible)
        .map((menu) =>
          [...menu.querySelectorAll('[role^="menuitem"]')]
            .filter((item) => item.closest('[role="menu"]') === menu)
            .map((item) => item.textContent?.trim())
            .join(", ")
        ),
      focused: label(document.activeElement),
      expanded: document
        .querySelector('[data-slot="dropdown-menu-trigger"]')
        ?.getAttribute("aria-expanded"),
      checked: [...document.querySelectorAll('[aria-checked="true"]')]
        .filter(visible)
        .map((item) => item.textContent?.trim()),
    }
  })

type Step = [description: string, act: (page: Page) => Promise<void>]

const trigger = (page: Page) => page.getByRole("button", { name: "Open" })
const item = (page: Page, name: string) =>
  page.locator('[role^="menuitem"]', { hasText: name }).first()

const STEPS: Step[] = [
  ["initial", async () => {}],
  ["the trigger opens the menu", (page) => trigger(page).click()],
  [
    "ArrowDown focuses the first item",
    (page) => page.keyboard.press("ArrowDown"),
  ],
  ["ArrowDown moves on", (page) => page.keyboard.press("ArrowDown")],
  ["disabled items", (page) => page.keyboard.press("ArrowDown")],
  ["End", (page) => page.keyboard.press("End")],
  ["Home", (page) => page.keyboard.press("Home")],
  ["typeahead", (page) => page.keyboard.press("b")],
  ["Escape closes", (page) => page.keyboard.press("Escape")],
  ["ArrowDown on the trigger", (page) => page.keyboard.press("ArrowDown")],
  ["ArrowUp loops to the last item", (page) => page.keyboard.press("ArrowUp")],
  ["Enter chooses and closes", (page) => page.keyboard.press("Enter")],
  ["reopen", (page) => trigger(page).click()],
  [
    "hovering a submenu trigger opens the submenu",
    async (page) => {
      await item(page, "Invite users").hover()
      await page.waitForTimeout(400)
    },
  ],
  [
    "ArrowRight enters the submenu",
    (page) => page.keyboard.press("ArrowRight"),
  ],
  ["ArrowLeft leaves the submenu", (page) => page.keyboard.press("ArrowLeft")],
  [
    "choosing an item closes everything",
    (page) => item(page, "Billing").click(),
  ],
  ["reopen with the keyboard", (page) => page.keyboard.press("Enter")],
  ["Tab closes the menu", (page) => page.keyboard.press("Tab")],
  ["reopen", (page) => trigger(page).click()],
  // Base UI forgets uncontrolled checked state when the menu closes (its
  // items unmount); the server-rendered items keep it, so toggles come last.
  ["a checkbox item toggles", (page) => item(page, "Status bar").click()],
  ["a radio item selects", (page) => item(page, "Top").click()],
  ["an outside click closes", (page) => page.mouse.click(700, 500)],
]

test("dropdown menu behaves like upstream Base UI", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
  })
  const hono = await context.newPage()
  const react = await context.newPage()
  await hono.goto(pageUrl("dropdown-menu-hono.html"))
  await react.goto(pageUrl("dropdown-menu-react.html"))
  await trigger(react).waitFor()
  for (const [description, act] of STEPS) {
    await act(hono)
    await act(react)
    await test.step(description, async () => {
      // Let exit animations finish; Base UI also updates focus and mounts
      // popups asynchronously.
      await hono.evaluate(() =>
        Promise.allSettled(document.getAnimations().map((a) => a.finished))
      )
      await expect.poll(() => state(react)).toEqual(await state(hono))
    })
  }
})

const OPEN_STATES: [name: string, act: (page: Page) => Promise<void>][] = [
  ["menu", (page) => page.keyboard.press("ArrowDown")],
  [
    "submenu",
    async (page) => {
      await page.keyboard.press("End")
      await page.keyboard.press("ArrowUp")
      await page.keyboard.press("ArrowRight")
    },
  ],
]

for (const [name, act] of OPEN_STATES) {
  test(`open dropdown ${name} matches upstream shadcn/ui`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 800, height: 600 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    })
    const shots: Buffer[] = []
    for (const file of [
      "dropdown-menu-hono.html",
      "dropdown-menu-react.html",
    ]) {
      const page = await context.newPage()
      await page.goto(pageUrl(file))
      await trigger(page).click()
      await expect(page.getByRole("menu")).toBeFocused()
      await act(page)
      await page.waitForTimeout(400)
      shots.push(await page.screenshot({ animations: "disabled" }))
    }
    await compare(shots, testInfo)
  })
}

async function compare(shots: Buffer[], testInfo: TestInfo) {
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

test("without the script, the menu opens and its items are reachable", async ({
  page,
}) => {
  await page.route("**/shadcn/menu.js", (route) => route.abort())
  await page.goto(pageUrl("dropdown-menu-hono.html"))
  await trigger(page).click()
  await expect(page.getByRole("menu")).toBeVisible()
  await page.keyboard.press("Tab")
  await expect(page.getByRole("menuitem", { name: /Profile/ })).toBeFocused()
})

const area = (page: Page) => page.getByText("Right click here")
const rightClick = (page: Page, x = 120, y = 80) =>
  area(page).click({ button: "right", position: { x, y } })

const CONTEXT_STEPS: Step[] = [
  ["initial", async () => {}],
  ["a right click opens the menu at the pointer", (page) => rightClick(page)],
  [
    "ArrowDown focuses the first item",
    (page) => page.keyboard.press("ArrowDown"),
  ],
  ["disabled items", (page) => page.keyboard.press("ArrowDown")],
  ["Escape closes", (page) => page.keyboard.press("Escape")],
  ["another right click", (page) => rightClick(page, 200, 40)],
  ["choosing an item closes the menu", (page) => item(page, "Reload").click()],
  ["reopen", (page) => rightClick(page)],
  ["a checkbox item toggles", (page) => item(page, "Show bookmarks").click()],
  [
    "hovering a submenu trigger opens the submenu",
    async (page) => {
      await item(page, "More tools").hover()
      await page.waitForTimeout(400)
    },
  ],
  ["an outside click closes", (page) => page.mouse.click(700, 500)],
]

test("context menu behaves like upstream Base UI", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
  })
  const hono = await context.newPage()
  const react = await context.newPage()
  await hono.goto(pageUrl("context-menu-hono.html"))
  await react.goto(pageUrl("context-menu-react.html"))
  await area(react).waitFor()
  for (const [description, act] of CONTEXT_STEPS) {
    await act(hono)
    await act(react)
    await test.step(description, async () => {
      await hono.evaluate(() =>
        Promise.allSettled(document.getAnimations().map((a) => a.finished))
      )
      await expect.poll(() => state(react)).toEqual(await state(hono))
    })
  }
})

test("context menu opens at the pointer like upstream shadcn/ui", async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  })
  const shots: Buffer[] = []
  for (const file of ["context-menu-hono.html", "context-menu-react.html"]) {
    const page = await context.newPage()
    await page.goto(pageUrl(file))
    await rightClick(page)
    await page.waitForTimeout(400)
    shots.push(await page.screenshot({ animations: "disabled" }))
  }
  await compare(shots, testInfo)
})
