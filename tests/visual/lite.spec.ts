import { expect, type Page, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { pageUrl } from "./server-url"

/**
 * Lite alternatives (docs/adr/0028). input-otp-lite is compared with
 * upstream's InputOTP at a looser tolerance than ports (the characters are
 * the input's own text, spaced into the slots); both alternatives are
 * checked for the native behavior they rely on. Run `bun render.ts` first.
 */

/** Share of differing pixels an approximate alternative may have. */
const APPROXIMATE = 0.01

const LABELS = ["Empty", "Filled", "Partial", "Invalid", "Disabled"]

/** A screenshot of the OTP labelled `label`, with room for its focus ring. */
async function shot(page: Page, selector: string, label: string) {
  const otp = page.locator(selector).filter({
    has: page.locator(`input[aria-label="${label}"]`),
  })
  const box = await otp.boundingBox()
  if (!box) throw new Error(`${label} is not rendered`)
  return PNG.sync.read(
    await page.screenshot({
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

test("input-otp-lite looks like upstream's InputOTP", async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    viewport: { width: 600, height: 700 },
    deviceScaleFactor: 1,
  })
  const hono = await context.newPage()
  const react = await context.newPage()
  await hono.goto(pageUrl("lite-hono.html"))
  await react.goto(pageUrl("lite-react.html"))
  await react.locator("[data-input-otp-container]").first().waitFor()
  for (const [mode, label] of ["light", "dark"].flatMap((mode) =>
    LABELS.map((label) => [mode, label] as const)
  )) {
    for (const page of [hono, react]) {
      // Switch the mode, then let the color transitions finish.
      await page.evaluate(async (dark) => {
        document.documentElement.classList.toggle("dark", dark)
        await new Promise((resolve) => requestAnimationFrame(resolve))
        await Promise.all(
          document.getAnimations().map((a) => a.finished.catch(() => null))
        )
      }, mode === "dark")
    }
    const lite = await shot(hono, '[data-slot="input-otp-lite"]', label)
    const upstream = await shot(react, "[data-input-otp-container]", label)
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
      await testInfo.attach(`${mode}-${label}-lite.png`, {
        body: PNG.sync.write(lite),
        contentType: "image/png",
      })
      await testInfo.attach(`${mode}-${label}-upstream.png`, {
        body: PNG.sync.write(upstream),
        contentType: "image/png",
      })
      await testInfo.attach(`${mode}-${label}-diff.png`, {
        body: PNG.sync.write(diff),
        contentType: "image/png",
      })
    }
    expect
      .soft(changed / (lite.width * lite.height), `${mode} ${label}`)
      .toBeLessThanOrEqual(APPROXIMATE)
  }
})

test("input-otp-lite is a native one-time-code input", async ({ page }) => {
  await page.goto(pageUrl("lite-hono.html"))
  const input = page.locator('input[aria-label="Code"]')
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
  // Focus highlights the group like upstream's focus ring.
  const ring = await page
    .locator('[data-slot="input-otp-lite"]')
    .filter({ has: input })
    .evaluate((group) => getComputedStyle(group).boxShadow)
  expect(ring).not.toBe("none")
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
  // The calendar icon sits inside the field, before the text.
  const icon = await page
    .locator('[data-slot="date-picker-lite"] svg')
    .boundingBox()
  const field = await input.boundingBox()
  expect(icon && field && icon.x > field.x && icon.x < field.x + 32).toBe(true)
})
