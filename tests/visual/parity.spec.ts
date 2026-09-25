import { readFileSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { expect, type Page, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"

/**
 * Compares screenshots of each case rendered by the generated Hono JSX
 * components against upstream shadcn/ui (React). Run `bun render.ts` first.
 */
const OUT = path.join(import.meta.dirname, ".output")
const ids = JSON.parse(
  readFileSync(path.join(OUT, "cases.json"), "utf8")
) as string[]

/** Share of differing pixels tolerated per case (anti-aliasing noise only). */
const MAX_DIFF_RATIO = 0.001

test.describe.configure({ mode: "serial" })

let hono: Page
let react: Page

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  })
  hono = await context.newPage()
  react = await context.newPage()
  await hono.goto(pathToFileURL(path.join(OUT, "hono.html")).href)
  await react.goto(pathToFileURL(path.join(OUT, "react.html")).href)
})

for (const id of ids) {
  // biome-ignore lint/correctness/noEmptyPattern: Playwright requires a destructuring pattern for fixtures.
  test(id, async ({}, testInfo) => {
    const selector = `[data-case="${id}"]`
    const [a, b] = await Promise.all([
      hono.locator(selector).screenshot({ animations: "disabled" }),
      react.locator(selector).screenshot({ animations: "disabled" }),
    ])
    // Icons must match lucide-react's SVG exactly (attributes and shapes).
    const svgs = (page: Page) =>
      page.locator(`${selector} svg`).evaluateAll((elements) =>
        elements.map((svg) => ({
          attributes: Object.fromEntries(
            [...svg.attributes].map((a) => [a.name, a.value])
          ),
          content: svg.innerHTML,
        }))
      )
    expect(
      await svgs(hono),
      "inline SVG icons must match lucide-react"
    ).toEqual(await svgs(react))

    const actual = PNG.sync.read(a)
    const expected = PNG.sync.read(b)
    await testInfo.attach("hono.png", { body: a, contentType: "image/png" })
    await testInfo.attach("upstream.png", { body: b, contentType: "image/png" })
    expect(
      { width: actual.width, height: actual.height },
      "screenshot size must match upstream"
    ).toEqual({ width: expected.width, height: expected.height })

    const diff = new PNG({ width: actual.width, height: actual.height })
    const changed = pixelmatch(
      actual.data,
      expected.data,
      diff.data,
      actual.width,
      actual.height,
      { threshold: 0.1 }
    )
    if (changed > 0) {
      await testInfo.attach("diff.png", {
        body: PNG.sync.write(diff),
        contentType: "image/png",
      })
    }
    expect(changed / (actual.width * actual.height)).toBeLessThanOrEqual(
      MAX_DIFF_RATIO
    )
  })
}
