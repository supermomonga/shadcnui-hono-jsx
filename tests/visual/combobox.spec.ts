import { expect, type Page, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { pageUrl } from "./server-url"

/**
 * Comboboxes with the client script (public/shadcn/combobox.js) behave like
 * upstream Base UI: every step runs on both pages and the input, the visible
 * items, the highlight, the selection, chips, the form data and focus must
 * match. Run `bun render.ts` first.
 */
const state = (page: Page) =>
  page.evaluate(() => {
    const visible = (element: Element | null | undefined) =>
      element instanceof HTMLElement && element.checkVisibility()
    const text = (element: Element | null | undefined) =>
      element?.textContent?.trim() ?? null
    const inputs = [
      ...document.querySelectorAll<HTMLInputElement>('input[role="combobox"]'),
    ]
    const form = document.querySelector("form")
    const active = document.activeElement
    return {
      comboboxes: inputs.map((input) => {
        const list = document.getElementById(
          input.getAttribute("aria-controls") ?? ""
        )
        const popup = list?.closest('[data-slot="combobox-content"]')
        const options = [
          ...(list?.querySelectorAll('[role="option"]') ?? []),
        ].filter(visible)
        const group = input.closest(
          '[data-slot="input-group"], [data-slot="combobox-chips"]'
        )
        return {
          value: input.value,
          expanded: input.getAttribute("aria-expanded"),
          open: visible(popup),
          highlighted: text(
            document.getElementById(
              input.getAttribute("aria-activedescendant") ?? ""
            )
          ),
          options: options.map(text),
          selected: options
            .filter((o) => o.getAttribute("aria-selected") === "true")
            .map(text),
          indicators: options.filter((o) =>
            visible(o.querySelector("span[aria-hidden]"))
          ).length,
          empty: visible(popup?.querySelector('[role="status"]'))
            ? text(popup?.querySelector('[role="status"]'))
            : null,
          chips: [
            ...(group?.querySelectorAll('[data-slot="combobox-chip"]') ?? []),
          ]
            .filter(visible)
            .map(text),
          clear: visible(group?.querySelector('[data-slot="combobox-clear"]')),
          trigger: visible(
            group?.querySelector('[data-slot="input-group-button"]')
          ),
        }
      }),
      form: form ? [...new FormData(form).entries()].map(String) : [],
      focused:
        active === document.body
          ? "body"
          : active instanceof HTMLInputElement
            ? `input ${active.placeholder}`
            : `${active?.tagName.toLowerCase()} ${text(active)}`,
    }
  })

type Step = [description: string, act: (page: Page) => Promise<void>]

const input = (page: Page, index: number) =>
  page.locator('input[role="combobox"]').nth(index)

/** Waits for running animations (a closing popup) to finish. */
const settle = (page: Page) =>
  page.evaluate(async () => {
    await Promise.all(
      document.getAnimations().map((a) => a.finished.catch(() => undefined))
    )
    // Base UI updates its state after the animation ends.
    await new Promise((resolve) => setTimeout(resolve, 50))
  })

const option = (page: Page, name: string) =>
  page.getByRole("option", { name, exact: true })

const STEPS: Step[] = [
  ["initial", async () => {}],
  ["pressing the input opens the list", (page) => input(page, 0).click()],
  ["typing filters", (page) => page.keyboard.type("n")],
  [
    "ArrowDown highlights the first match",
    (page) => page.keyboard.press("ArrowDown"),
  ],
  ["ArrowDown moves on", (page) => page.keyboard.press("ArrowDown")],
  [
    "past the end the highlight leaves the list",
    (page) => page.keyboard.press("ArrowDown"),
  ],
  ["and comes back at the start", (page) => page.keyboard.press("ArrowDown")],
  ["Enter selects", (page) => page.keyboard.press("Enter")],
  [
    "ArrowDown reopens on the selection, unfiltered",
    (page) => page.keyboard.press("ArrowDown"),
  ],
  ["Escape closes", (page) => page.keyboard.press("Escape")],
  [
    "Escape again, once closed, clears",
    async (page) => {
      await settle(page)
      await page.keyboard.press("Escape")
    },
  ],
  ["no match shows the empty state", (page) => page.keyboard.type("zz")],
  ["Tab closes and clears the query", (page) => page.keyboard.press("Tab")],
  [
    "clicking an item selects it",
    async (page) => {
      await input(page, 0).click()
      await option(page, "Astro").click()
    },
  ],
  [
    "hovering highlights, leaving clears",
    async (page) => {
      await input(page, 0).click()
      await option(page, "Remix").hover()
    },
  ],
  [
    "the pointer leaving the items clears the highlight",
    async (page) => {
      await page.mouse.move(600, 500)
    },
  ],
  ["an outside press closes", (page) => page.mouse.click(600, 500)],
  [
    "the clear button clears the value",
    (page) => page.locator('[data-slot="combobox-clear"]').click(),
  ],
  [
    "the trigger opens",
    (page) => page.locator('[data-slot="input-group-button"]').nth(1).click(),
  ],
  [
    "and closes",
    (page) => page.locator('[data-slot="input-group-button"]').nth(1).click(),
  ],
  ["chips: pressing the input opens", (page) => input(page, 2).click()],
  ["choosing an item adds a chip", (page) => option(page, "SvelteKit").click()],
  ["typing highlights the first match", (page) => page.keyboard.type("as")],
  [
    "Enter adds it and clears the query",
    (page) => page.keyboard.press("Enter"),
  ],
  [
    "Backspace removes the last chip",
    (page) => page.keyboard.press("Backspace"),
  ],
  [
    "ArrowLeft focuses the last chip",
    (page) => page.keyboard.press("ArrowLeft"),
  ],
  [
    "Backspace on a chip removes it",
    (page) => page.keyboard.press("Backspace"),
  ],
  [
    "a chip's remove button removes it",
    (page) =>
      page.locator('[data-slot="combobox-chip-remove"]').first().click(),
  ],
]

test("comboboxes behave like upstream Base UI", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
  })
  const hono = await context.newPage()
  const react = await context.newPage()
  await hono.goto(pageUrl("combobox-hono.html"))
  await react.goto(pageUrl("combobox-react.html"))
  await input(react, 0).waitFor()
  for (const [description, act] of STEPS) {
    await act(hono)
    await act(react)
    await test.step(description, async () => {
      await expect.poll(() => state(react)).toEqual(await state(hono))
    })
  }
})

/** Screenshot states: closed, the filtered list with a highlight, and chips with their list. */
const SCENES: [name: string, act: (page: Page) => Promise<void>][] = [
  ["closed", async () => {}],
  [
    "filtered",
    async (page) => {
      await input(page, 0).click()
      await page.keyboard.type("n")
      await page.keyboard.press("ArrowDown")
    },
  ],
  [
    "selected",
    async (page) => {
      await input(page, 1).click()
    },
  ],
  [
    "chips",
    async (page) => {
      await input(page, 2).click()
      await option(page, "Astro").click()
      await page.mouse.move(790, 590)
    },
  ],
  [
    "empty",
    async (page) => {
      await input(page, 2).click()
      await page.keyboard.type("zz")
    },
  ],
]

for (const [scene, act] of SCENES) {
  test(`comboboxes match upstream shadcn/ui: ${scene}`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 800, height: 600 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    })
    const shots: Buffer[] = []
    for (const file of ["combobox-hono.html", "combobox-react.html"]) {
      const page = await context.newPage()
      await page.goto(pageUrl(file))
      await input(page, 0).waitFor()
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
