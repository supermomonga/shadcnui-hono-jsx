import { expect, type Page, test } from "@playwright/test"
import { pageUrl } from "./server-url"

/**
 * Input groups with the client script (public/shadcn/input-group.js) behave
 * like upstream: clicking an addon focuses the group's input, except when a
 * button in the addon is pressed. Run `bun render.ts` first.
 */
const focused = (page: Page) =>
  page.evaluate(() => {
    const element = document.activeElement
    return element === document.body
      ? "body"
      : `${element?.tagName.toLowerCase()} ${element?.getAttribute("placeholder") ?? element?.textContent}`
  })

type Step = [description: string, act: (page: Page) => Promise<void>]

const addon = (page: Page, index: number) =>
  page.locator('[data-slot="input-group-addon"]').nth(index)

const blur = (page: Page) =>
  page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())

const STEPS: Step[] = [
  ["initial", async () => {}],
  [
    "clicking text in an addon focuses the input",
    (page) => addon(page, 0).click(),
  ],
  [
    "clicking an addon's padding focuses the input",
    async (page) => {
      await blur(page)
      await addon(page, 0).click({ position: { x: 2, y: 2 } })
    },
  ],
  [
    "an addon button keeps the focus",
    (page) => addon(page, 1).locator("button").click(),
  ],
  [
    "only inputs are focused, not textareas",
    async (page) => {
      await blur(page)
      await addon(page, 2).click()
    },
  ],
]

test("input groups behave like upstream", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
  })
  const hono = await context.newPage()
  const react = await context.newPage()
  await hono.goto(pageUrl("input-group-hono.html"))
  await react.goto(pageUrl("input-group-react.html"))
  await addon(react, 0).waitFor()
  for (const [description, act] of STEPS) {
    await act(hono)
    await act(react)
    await test.step(description, async () => {
      await expect.poll(() => focused(react)).toEqual(await focused(hono))
    })
  }
})
