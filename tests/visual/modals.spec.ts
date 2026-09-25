import path from "node:path"
import { pathToFileURL } from "node:url"
import { expect, type Page, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"

/**
 * Behavior and accessibility of the generated modals (native <dialog> with
 * Invoker Commands, no JavaScript), and their open state compared with
 * upstream shadcn/ui (Base UI). Run `bun render.ts` first.
 */
const OUT = path.join(import.meta.dirname, ".output")
const url = (file: string) => pathToFileURL(path.join(OUT, file)).href

interface Modal {
  /** Demo page name: `<page>-hono.html` and `<page>-react.html`. */
  page: string
  trigger: string
  role: "dialog" | "alertdialog"
  title: string
  description: string
  id: string
  /** Whether a click outside closes it (`closedby="any"`). */
  lightDismiss: boolean
  /** Close buttons, by accessible name, in the order they are tried. */
  closes: string[]
  /** Element focused before the parity screenshot, on both pages. */
  focus: string
}

const MODALS: Modal[] = [
  {
    page: "dialog",
    trigger: "Edit profile",
    role: "dialog",
    title: "Edit profile",
    description:
      "Make changes to your profile here. Click save when you're done.",
    id: "edit-profile",
    lightDismiss: true,
    closes: ["Close", "Close"],
    focus: "#name",
  },
  {
    page: "alert-dialog",
    trigger: "Delete account",
    role: "alertdialog",
    title: "Are you absolutely sure?",
    description:
      "This action cannot be undone. This will permanently delete your account and remove your data from our servers.",
    id: "delete-account",
    lightDismiss: false,
    closes: ["Cancel"],
    focus: '[data-slot="alert-dialog-cancel"]',
  },
  {
    page: "sheet",
    trigger: "Open right",
    role: "dialog",
    title: "Edit profile",
    description:
      "Make changes to your profile here. Click save when you're done.",
    id: "sheet-right",
    lightDismiss: true,
    closes: ["Close", "Close"],
    focus: "#name-right",
  },
  {
    page: "sheet",
    trigger: "Open bottom",
    role: "dialog",
    title: "Edit profile",
    description:
      "Make changes to your profile here. Click save when you're done.",
    id: "sheet-bottom",
    lightDismiss: true,
    closes: ["Close", "Close"],
    focus: "#name-bottom",
  },
]

async function open(page: Page, modal: Modal) {
  await page.getByRole("button", { name: modal.trigger }).click()
  const dialog = page.getByRole(modal.role, { name: modal.title })
  await expect(dialog).toBeVisible()
  return dialog
}

const focusInsideDialog = (page: Page) =>
  page.evaluate(() => Boolean(document.activeElement?.closest("dialog")))

for (const modal of MODALS) {
  test.describe(`generated ${modal.page} (${modal.trigger})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(url(`${modal.page}-hono.html`))
    })

    test("ships no JavaScript and wires the trigger with Invoker Commands", async ({
      page,
    }) => {
      expect(await page.locator("script").count()).toBe(0)
      const trigger = page.getByRole("button", { name: modal.trigger })
      await expect(trigger).toHaveAttribute("aria-haspopup", "dialog")
      await expect(trigger).toHaveAttribute("command", "show-modal")
      await expect(trigger).toHaveAttribute("commandfor", modal.id)
      await expect(page.getByRole(modal.role)).toHaveCount(0)
    })

    test("opens as a labelled, described modal and moves focus inside", async ({
      page,
    }) => {
      const dialog = await open(page, modal)
      await expect(dialog).toHaveAccessibleDescription(modal.description)
      expect(await dialog.evaluate((d) => d.matches(":modal"))).toBe(true)
      expect(await focusInsideDialog(page)).toBe(true)
    })

    test("never moves keyboard focus to page content while open", async ({
      page,
    }) => {
      await open(page, modal)
      // A native modal lets Tab reach the browser UI (document.body) after the
      // last control, then wraps back; the inert page content is never focused.
      let returned = false
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press("Tab")
        const where = await page.evaluate(() => {
          const active = document.activeElement
          if (!active || active === document.body) return "browser"
          return active.closest("dialog") ? "dialog" : "page"
        })
        expect(where).not.toBe("page")
        if (i > 0 && where === "dialog") returned = true
      }
      expect(returned).toBe(true)
    })

    test("closes on Escape and returns focus to the trigger", async ({
      page,
    }) => {
      const dialog = await open(page, modal)
      await page.keyboard.press("Escape")
      await expect(dialog).toBeHidden()
      await expect(
        page.getByRole("button", { name: modal.trigger })
      ).toBeFocused()
    })

    test("animates out before it is hidden", async ({ page }) => {
      const dialog = await open(page, modal)
      const closing = await dialog.evaluate((element) => {
        const popup = element as HTMLDialogElement
        popup.querySelector<HTMLButtonElement>('[command="close"]')?.click()
        return {
          open: popup.open,
          display: getComputedStyle(popup).display,
          animations: popup.getAnimations().length,
        }
      })
      expect(closing.open).toBe(false)
      expect(closing.display).not.toBe("none")
      expect(closing.animations).toBeGreaterThan(0)
      await expect(dialog).toBeHidden()
    })

    test("closes from each close button", async ({ page }) => {
      for (const [index, name] of modal.closes.entries()) {
        const dialog = await open(page, modal)
        await dialog
          .getByRole("button", { name, exact: true })
          .nth(index)
          .click()
        await expect(dialog).toBeHidden()
      }
    })

    test(
      modal.lightDismiss
        ? "closes on an outside click (closedby=any)"
        : "stays open on an outside click (closedby=closerequest)",
      async ({ page }) => {
        const dialog = await open(page, modal)
        await page.mouse.click(5, 5)
        if (modal.lightDismiss) await expect(dialog).toBeHidden()
        else await expect(dialog).toBeVisible()
      }
    )
  })

  test(`open ${modal.page} (${modal.trigger}) matches upstream shadcn/ui`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 800, height: 600 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    })
    const shots: Buffer[] = []
    for (const file of [
      `${modal.page}-hono.html`,
      `${modal.page}-react.html`,
    ]) {
      const page = await context.newPage()
      await page.goto(url(file))
      const dialog = await open(page, modal)
      // Same focus state on both (Base UI refocuses the popup if focus is removed).
      await dialog.locator(modal.focus).focus()
      await page.waitForTimeout(400)
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
