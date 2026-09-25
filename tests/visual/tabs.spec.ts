import { expect, type Page, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { pageUrl } from "./server-url"

/**
 * Tabs with the client script (public/shadcn/tabs.js) behave like upstream
 * Base UI: every step runs on both pages and their states must match, and
 * screenshots are compared after the interactions. Run `bun render.ts` first.
 */

/** What the user perceives: selected tabs, the focused element, visible panels. */
const state = (page: Page) =>
  page.evaluate(() => ({
    selected: [...document.querySelectorAll('[role="tab"]')]
      .filter((tab) => tab.getAttribute("aria-selected") === "true")
      .map((tab) => tab.textContent?.trim()),
    focused:
      document.activeElement === document.body
        ? "(body)"
        : (document.activeElement?.textContent?.trim() ?? null),
    panels: [...document.querySelectorAll('[role="tabpanel"]')]
      .filter((panel) => (panel as HTMLElement).checkVisibility())
      .map((panel) => panel.textContent?.trim()),
  }))

type Step = [description: string, act: (page: Page) => Promise<void>]

const tab = (page: Page, name: string) => page.getByRole("tab", { name })

const STEPS: Step[] = [
  ["initial", async () => {}],
  ["click a tab", (page) => tab(page, "Password").click()],
  ["arrow keys move focus only", (page) => page.keyboard.press("ArrowRight")],
  ["disabled tabs are focusable", (page) => page.keyboard.press("ArrowRight")],
  [
    "Enter on a disabled tab does nothing",
    (page) => page.keyboard.press("Enter"),
  ],
  ["arrow keys move on", (page) => page.keyboard.press("ArrowRight")],
  ["Enter selects the focused tab", (page) => page.keyboard.press("Enter")],
  ["focus loops to the first tab", (page) => page.keyboard.press("ArrowRight")],
  ["End moves to the last tab", (page) => page.keyboard.press("End")],
  ["Space selects", (page) => page.keyboard.press(" ")],
  [
    "clicking a disabled tab does nothing",
    (page) => tab(page, "Billing").click({ force: true }),
  ],
  [
    "vertical lists use up and down",
    async (page) => {
      await tab(page, "Overview").focus()
      await page.keyboard.press("ArrowDown")
    },
  ],
  [
    "activateOnFocus selects while moving",
    (page) => page.keyboard.press("ArrowDown"),
  ],
  ["Tab leaves the list", (page) => page.keyboard.press("Tab")],
]

test("tabs behave like upstream Base UI", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
  })
  const hono = await context.newPage()
  const react = await context.newPage()
  await hono.goto(pageUrl("tabs-hono.html"))
  await react.goto(pageUrl("tabs-react.html"))
  await react.getByRole("tab", { name: "Account" }).waitFor()
  expect(await hono.locator('script[src="/shadcn/tabs.js"]').count()).toBe(1)
  for (const [description, act] of STEPS) {
    await act(hono)
    await act(react)
    await test.step(description, async () => {
      // Base UI keeps the previous panel mounted until its exit transition ends.
      await expect.poll(() => state(react)).toEqual(await state(hono))
    })
  }
})

test("tabs match upstream after switching", async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  })
  const shots: Buffer[] = []
  for (const file of ["tabs-hono.html", "tabs-react.html"]) {
    const page = await context.newPage()
    await page.goto(pageUrl(file))
    await tab(page, "Team").click()
    await tab(page, "Reports").click()
    await page.locator("#after").focus()
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

test("without the script, the selected panel is shown", async ({ page }) => {
  await page.route("**/shadcn/tabs.js", (route) => route.abort())
  await page.goto(pageUrl("tabs-hono.html"))
  await expect(
    page.getByText("Make changes to your account here.")
  ).toBeVisible()
  await expect(page.getByText("Change your password here.")).toBeHidden()
  await tab(page, "Password").click()
  await expect(tab(page, "Account")).toHaveAttribute("aria-selected", "true")
})
