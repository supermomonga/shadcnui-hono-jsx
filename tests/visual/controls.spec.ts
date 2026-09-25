import { expect, type Locator, type Page, test } from "@playwright/test"
import { pageUrl } from "./server-url"

/**
 * Behavior and accessibility of the generated form controls (native inputs,
 * no JavaScript), using the visual cases page. Their appearance is compared
 * with upstream in parity.spec.ts. Run `bun render.ts` first.
 */
const HONO = pageUrl("hono.html")

const section = (page: Page, id: string) =>
  page.locator(`[data-case="${id}@light"]`)

const checked = (input: Locator) =>
  input.evaluate((element) => (element as HTMLInputElement).checked)

test.beforeEach(async ({ page }) => {
  await page.goto(HONO)
})

test.describe("generated Checkbox", () => {
  test("toggles from the box, its label and the keyboard", async ({ page }) => {
    const cases = section(page, "checkbox/states")
    const box = cases.getByRole("checkbox").first()
    const indicator = cases.locator('[data-slot="checkbox-indicator"]').first()
    await expect(indicator).toBeHidden()
    await cases.locator('[data-slot="checkbox"]').first().click()
    expect(await checked(box)).toBe(true)
    await expect(indicator).toBeVisible()

    const terms = cases.getByRole("checkbox", {
      name: "Accept terms and conditions",
    })
    expect(await checked(terms)).toBe(true)
    await cases.getByText("Accept terms and conditions").click()
    expect(await checked(terms)).toBe(false)
    await terms.focus()
    await page.keyboard.press("Space")
    expect(await checked(terms)).toBe(true)
  })

  test("shows the focus ring on the box for keyboard focus", async ({
    page,
  }) => {
    const cases = section(page, "checkbox/states")
    const second = cases.locator('[data-slot="checkbox"]').nth(1)
    const ring = () => second.evaluate((box) => getComputedStyle(box).boxShadow)
    const before = await ring()
    await cases.getByRole("checkbox").first().focus()
    await page.keyboard.press("Tab")
    await expect(cases.getByRole("checkbox").nth(1)).toBeFocused()
    await expect.poll(ring).not.toBe(before)
  })

  test("disabled boxes do not toggle", async ({ page }) => {
    const box = section(page, "checkbox/states").getByRole("checkbox").nth(2)
    await expect(box).toBeDisabled()
    await box.click({ force: true })
    expect(await checked(box)).toBe(false)
  })
})

test.describe("generated Switch", () => {
  test("is a switch that moves its thumb when toggled", async ({ page }) => {
    const cases = section(page, "switch/states")
    const control = cases.getByRole("switch").first()
    const thumb = cases.locator('[data-slot="switch-thumb"]').first()
    const before = await thumb.evaluate((t) => getComputedStyle(t).translate)
    await cases.locator('[data-slot="switch"]').first().click()
    await expect(control).toBeChecked()
    await expect
      .poll(() => thumb.evaluate((t) => getComputedStyle(t).translate))
      .not.toBe(before)
  })
})

test.describe("generated RadioGroup", () => {
  test("selects the default and moves the selection with arrow keys", async ({
    page,
  }) => {
    const cases = section(page, "radio-group/default")
    await expect(cases.getByRole("radiogroup")).toBeVisible()
    await expect(
      cases.getByRole("radio", { name: "comfortable" })
    ).toBeChecked()
    await cases.getByRole("radio", { name: "comfortable" }).focus()
    await page.keyboard.press("ArrowDown")
    await expect(cases.getByRole("radio", { name: "compact" })).toBeChecked()
    await expect(
      cases.getByRole("radio", { name: "comfortable" })
    ).not.toBeChecked()
    await cases.getByText("default", { exact: true }).click()
    await expect(cases.getByRole("radio", { name: "default" })).toBeChecked()
    await expect(cases.getByRole("radio", { name: "none" })).toBeDisabled()
  })
})

test.describe("generated Toggle", () => {
  test("presses from a click or Space and restyles", async ({ page }) => {
    const cases = section(page, "toggle/states")
    const bold = cases.getByRole("checkbox", { name: "Bold" })
    const label = cases.locator('[data-slot="toggle"]').first()
    const before = await label.evaluate(
      (l) => getComputedStyle(l).backgroundColor
    )
    await label.click()
    await expect(bold).toBeChecked()
    // Move the pointer away so hover styles do not hide the pressed style.
    await page.mouse.move(0, 0)
    await expect
      .poll(() => label.evaluate((l) => getComputedStyle(l).backgroundColor))
      .not.toBe(before)
    await bold.focus()
    await page.keyboard.press("Space")
    await expect(bold).not.toBeChecked()
    await expect(cases.getByRole("checkbox", { name: "Italic" })).toBeChecked()
  })
})

test.describe("generated ToggleGroup", () => {
  test("keeps one item pressed, or several with multiple", async ({ page }) => {
    const cases = section(page, "toggle-group/variants")
    const [single, multiple] = [
      cases.locator('[data-slot="toggle-group"]').nth(0),
      cases.locator('[data-slot="toggle-group"]').nth(1),
    ]
    await expect(single.getByRole("radio", { name: "Center" })).toBeChecked()
    await single.getByText("Left").click()
    await expect(single.getByRole("radio", { name: "Left" })).toBeChecked()
    await expect(
      single.getByRole("radio", { name: "Center" })
    ).not.toBeChecked()

    await expect(multiple.getByRole("checkbox", { name: "B" })).toBeChecked()
    await multiple.getByText("I", { exact: true }).click()
    await expect(multiple.getByRole("checkbox", { name: "I" })).toBeChecked()
    await expect(multiple.getByRole("checkbox", { name: "U" })).toBeChecked()
  })
})

test.describe("generated Field with a Checkbox", () => {
  test("highlights a choice card when its checkbox is checked", async ({
    page,
  }) => {
    const cases = section(page, "field/choice-card")
    // FieldTitle shares the slot name, so select the label elements.
    const card = cases.locator('label[data-slot="field-label"]').nth(1)
    const background = () =>
      card.evaluate((label) => getComputedStyle(label).backgroundColor)
    const before = await background()
    await card.click()
    await expect(
      cases.getByRole("checkbox", { name: /Weekly digest/ })
    ).toBeChecked()
    await expect.poll(background).not.toBe(before)
  })
})
