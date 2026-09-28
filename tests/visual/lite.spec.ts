import {
  type Browser,
  expect,
  type Locator,
  type Page,
  type TestInfo,
  test,
} from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { VARIANT } from "./installed"
import { pageUrl } from "./server-url"

/**
 * Lite alternatives (docs/adr/0028, docs/adr/0036). input-otp-lite is
 * compared with upstream's InputOTP at a looser tolerance than ports (the
 * characters are the input's own text, spaced into the slots), and tabs-lite
 * with upstream's Tabs exactly; every alternative is checked for the native behavior
 * it relies on. Run `bun render.ts` first.
 */

/**
 * Share of differing pixels an approximate alternative may have. The
 * characters are the input's own text: in styles with small text (Mira) they
 * sit a pixel off upstream's, which differs by up to 2% of this small shot.
 */
const APPROXIMATE = 0.02

/**
 * tabs-lite renders upstream's Tabs classes on the same boxes, links instead
 * of buttons, so its pixels match upstream's.
 */
const SAME_CLASSES = 0

const LABELS = ["Empty", "Filled", "Partial", "Invalid", "Disabled"]

/** Tabs in tabs-lite-*.html, by the aria-label of their list. */
const TABS_LABELS = ["Default", "Line", "Vertical"]

/** Opens `<name>-hono.html` and `<name>-react.html` side by side. */
async function openPages(browser: Browser, name: string) {
  const context = await browser.newContext({
    viewport: { width: 600, height: 700 },
    deviceScaleFactor: 1,
  })
  const hono = await context.newPage()
  const react = await context.newPage()
  await hono.goto(pageUrl(`${name}-hono.html`))
  await react.goto(pageUrl(`${name}-react.html`))
  return { hono, react }
}

/** Switches the color mode of `pages`, then lets the color transitions finish. */
async function setMode(pages: readonly Page[], dark: boolean) {
  for (const page of pages) {
    await page.evaluate(async (dark) => {
      document.documentElement.classList.toggle("dark", dark)
      await new Promise((resolve) => requestAnimationFrame(resolve))
      await Promise.all(
        document.getAnimations().map((a) => a.finished.catch(() => null))
      )
    }, dark)
  }
}

/** A screenshot of `locator`, with room for its focus ring. */
async function shot(locator: Locator, label: string) {
  const box = await locator.boundingBox()
  if (!box) throw new Error(`${label} is not rendered`)
  return PNG.sync.read(
    await locator.page().screenshot({
      clip: {
        x: box.x - 6,
        y: box.y - 6,
        width: box.width + 12,
        height: box.height + 12,
      },
      animations: "disabled",
    })
  )
}

/** Compares the shots at `tolerance`, attaching them when they differ. */
async function compare(
  testInfo: TestInfo,
  name: string,
  lite: PNG,
  upstream: PNG,
  tolerance: number
) {
  expect([lite.width, lite.height]).toEqual([upstream.width, upstream.height])
  const diff = new PNG({ width: lite.width, height: lite.height })
  const changed = pixelmatch(
    lite.data,
    upstream.data,
    diff.data,
    lite.width,
    lite.height,
    { threshold: 0.1 }
  )
  if (changed > 0) {
    for (const [suffix, png] of [
      ["lite", lite],
      ["upstream", upstream],
      ["diff", diff],
    ] as const) {
      await testInfo.attach(`${name}-${suffix}.png`, {
        body: PNG.sync.write(png),
        contentType: "image/png",
      })
    }
  }
  expect
    .soft(changed / (lite.width * lite.height), name)
    .toBeLessThanOrEqual(tolerance)
}

test("input-otp-lite looks like upstream's InputOTP", async ({
  browser,
}, testInfo) => {
  const { hono, react } = await openPages(browser, "lite")
  await react.locator("[data-input-otp-container]").first().waitFor()
  for (const [mode, label] of ["light", "dark"].flatMap((mode) =>
    LABELS.map((label) => [mode, label] as const)
  )) {
    await setMode([hono, react], mode === "dark")
    const input = (page: Page) => page.locator(`input[aria-label="${label}"]`)
    const lite = await shot(
      hono.locator('[data-slot="input-otp-lite"]').filter({ has: input(hono) }),
      label
    )
    const upstream = await shot(
      react.locator("[data-input-otp-container]").filter({ has: input(react) }),
      label
    )
    await compare(testInfo, `${mode}-${label}`, lite, upstream, APPROXIMATE)
  }
})

test("input-otp-lite is a native one-time-code input", async ({ page }) => {
  await page.goto(pageUrl("lite-hono.html"))
  const input = page.locator('input[aria-label="Code"]')
  const otp = page
    .locator('[data-slot="input-otp-lite"]')
    .filter({ has: input })
  // The group's ring (most styles) or the slots' border (Sera's underlines).
  const highlight = () =>
    otp.evaluate((group) => ({
      ring: getComputedStyle(group).boxShadow,
      border: getComputedStyle(
        group.querySelector('[data-slot="input-otp-slot"]') as Element
      ).borderBottomColor,
    }))
  const unfocused = await highlight()
  await expect(input).toHaveAttribute("autocomplete", "one-time-code")
  await expect(input).toHaveAttribute("inputmode", "numeric")
  await input.pressSequentially("1234567")
  // maxlength stops at six characters, and the form submits them.
  await expect(input).toHaveValue("123456")
  const form = () =>
    page.evaluate(() => {
      const form = document.querySelector("#lite-form") as HTMLFormElement
      return {
        valid: form.checkValidity(),
        code: new FormData(form).get("code"),
      }
    })
  expect(await form()).toMatchObject({ valid: true, code: "123456" })
  // A partial code is too short once edited.
  await input.press("Backspace")
  expect(await form()).toMatchObject({ valid: false })
  // Focus highlights the group like upstream highlights the active slot.
  expect(await highlight()).not.toEqual(unfocused)
})

test("date-picker-lite is a native date input", async ({ page }) => {
  await page.goto(pageUrl("lite-hono.html"))
  const input = page.locator('input[aria-label="Date"]')
  await expect(input).toHaveAttribute("type", "date")
  await input.fill("2026-09-26")
  expect(
    await page.evaluate(() =>
      new FormData(document.querySelector("#lite-form") as HTMLFormElement).get(
        "date"
      )
    )
  ).toBe("2026-09-26")
  const scheme = () =>
    input.evaluate((element) => getComputedStyle(element).colorScheme)
  expect(await scheme()).toBe("light")
  await page.evaluate(() => document.documentElement.classList.add("dark"))
  expect(await scheme()).toBe("dark")
  // The calendar icon sits inside the field, before the text (at its right
  // edge in right-to-left text).
  const icon = await page
    .locator('[data-slot="date-picker-lite"] svg')
    .boundingBox()
  const field = await input.boundingBox()
  if (!icon || !field) throw new Error("date-picker-lite is not rendered")
  const inset = VARIANT.rtl
    ? field.x + field.width - (icon.x + icon.width)
    : icon.x - field.x
  expect(inset >= 0 && inset < 32).toBe(true)
})

test("tabs-lite looks like upstream's Tabs", async ({ browser }, testInfo) => {
  const { hono, react } = await openPages(browser, "tabs-lite")
  await react.locator('[data-slot="tabs"]').first().waitFor()
  for (const [mode, label] of ["light", "dark"].flatMap((mode) =>
    TABS_LABELS.map((label) => [mode, label] as const)
  )) {
    await setMode([hono, react], mode === "dark")
    const lite = await shot(
      hono.locator('[data-slot="tabs-lite"]').filter({
        has: hono.locator(`nav[aria-label="${label}"]`),
      }),
      label
    )
    const upstream = await shot(
      react.locator('[data-slot="tabs"]').filter({
        has: react.locator(`[data-slot="tabs-list"][aria-label="${label}"]`),
      }),
      label
    )
    await compare(testInfo, `${mode}-${label}`, lite, upstream, SAME_CLASSES)
  }
})

test("tabs-lite is a navigation of links", async ({ page }) => {
  await page.goto(pageUrl("tabs-lite-hono.html"))
  await expect(page.locator("script")).toHaveCount(0)
  await expect(page.getByRole("tablist")).toHaveCount(0)
  await expect(page.getByRole("tab")).toHaveCount(0)
  await expect(page.getByRole("tabpanel")).toHaveCount(0)
  const nav = page.getByRole("navigation", { name: "Default" })
  await expect(nav.getByRole("link")).toHaveText([
    "Account",
    "Password",
    "Billing",
    "Team",
  ])
  const link = (name: string) => nav.getByRole("link", { name })
  await expect(link("Account")).toHaveAttribute("aria-current", "page")
  await expect(link("Password")).not.toHaveAttribute("aria-current")
  // The disabled trigger is an unavailable link: no href, no pointer, and
  // the keyboard skips it.
  await expect(link("Billing")).toHaveAttribute("aria-disabled", "true")
  await expect(link("Billing")).not.toHaveAttribute("href")
  expect(
    await link("Billing").evaluate(
      (element) => getComputedStyle(element).pointerEvents
    )
  ).toBe("none")
  await link("Account").focus()
  await page.keyboard.press("Tab")
  await expect(link("Password")).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(link("Team")).toBeFocused()
  // The arrow keys are the page's (they do not move between the links).
  await page.keyboard.press(VARIANT.rtl ? "ArrowLeft" : "ArrowRight")
  await expect(link("Team")).toBeFocused()
  await link("Password").click()
  await expect(page).toHaveURL(/#password$/)
})
