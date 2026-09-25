import { expect, type Page, type TestInfo, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { pageUrl } from "./server-url"

/**
 * Tooltips and hover cards with the client script (public/shadcn/hover.js)
 * open, stay and close like upstream Base UI: every step runs on both pages
 * and their states must match. Run `bun render.ts` first.
 */
const state = (page: Page) =>
  page.evaluate(() => ({
    open: [
      ...document.querySelectorAll(
        '[data-slot="tooltip-content"], [data-slot="hover-card-content"]'
      ),
    ]
      .filter((popup) => (popup as HTMLElement).checkVisibility())
      .map((popup) => popup.textContent?.trim()),
    triggers: [
      ...document.querySelectorAll(
        '[data-slot="tooltip-trigger"], [data-slot="hover-card-trigger"]'
      ),
    ].map(
      (trigger) =>
        `${trigger.textContent?.trim()} open=${trigger.hasAttribute("data-popup-open")}`
    ),
    focused:
      document.activeElement === document.body
        ? "(body)"
        : (document.activeElement?.textContent?.trim() ?? null),
  }))

type Step = [description: string, act: (page: Page) => Promise<void>]

const button = (page: Page, name: string) => page.getByRole("button", { name })

const STEPS: Step[] = [
  ["initial", async () => {}],
  [
    "hovering the trigger opens the tooltip",
    (page) => button(page, "Hover").hover(),
  ],
  ["leaving closes it", (page) => page.mouse.move(700, 500)],
  [
    "keyboard focus opens it",
    async (page) => {
      await page.keyboard.press("Tab")
    },
  ],
  ["Escape closes it", (page) => page.keyboard.press("Escape")],
  [
    "hovering the card trigger opens it after the delay",
    async (page) => {
      await button(page, "@nextjs").hover()
      await page.waitForTimeout(900)
    },
  ],
  [
    "the pointer can move onto the card",
    async (page) => {
      await page.getByText("The React Framework").hover()
      await page.waitForTimeout(500)
    },
  ],
  [
    "leaving the card closes it after the delay",
    async (page) => {
      await page.mouse.move(10, 590)
      await page.waitForTimeout(700)
    },
  ],
]

test("tooltips and hover cards behave like upstream Base UI", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
  })
  const hono = await context.newPage()
  const react = await context.newPage()
  await hono.goto(pageUrl("hover-hono.html"))
  await react.goto(pageUrl("hover-react.html"))
  await button(react, "Hover").waitFor()
  for (const [description, act] of STEPS) {
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

for (const [name, trigger] of [
  ["tooltip", "Hover"],
  ["hover card", "@nextjs"],
] as const) {
  test(`open ${name} matches upstream shadcn/ui`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 800, height: 600 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    })
    const shots: Buffer[] = []
    for (const file of ["hover-hono.html", "hover-react.html"]) {
      const page = await context.newPage()
      await page.goto(pageUrl(file))
      await button(page, trigger).hover()
      await page.waitForTimeout(1200)
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
