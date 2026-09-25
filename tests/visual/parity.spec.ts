import { readFileSync } from "node:fs"
import path from "node:path"
import { expect, type Page, test } from "@playwright/test"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import { PRIMITIVE_FAMILIES } from "../../generator/src/adapters/families"
import { BASE_UI_PRIMITIVES } from "../../generator/src/adapters/primitives/base-ui"
import { rewriteControlState } from "../../generator/src/transformers/steps/control-state"
import { pageUrl } from "./server-url"

/**
 * Compares screenshots of each case rendered by the generated Hono JSX
 * components against upstream shadcn/ui (React). Run `bun render.ts` first.
 */
const OUT = path.join(import.meta.dirname, ".output")
const cases = JSON.parse(
  readFileSync(path.join(OUT, "cases.json"), "utf8")
) as { id: string; compareDom: boolean }[]

/**
 * Attributes Base UI renders that generated components deliberately omit,
 * as declared in the primitive table (docs/adr/0018). Only these are removed
 * from the upstream DOM before comparing.
 */
const OMITTED = [...BASE_UI_PRIMITIVES, ...PRIMITIVE_FAMILIES].flatMap(
  (rule) => rule.omittedAttrs ?? []
)

interface DomNode {
  tag: string
  attributes: Record<string, string>
  text: string
  children: DomNode[]
}

const domTree = (page: Page, selector: string, omit: typeof OMITTED) =>
  page.locator(selector).evaluate((root, omitted) => {
    const walk = (el: Element): DomNode => {
      const tag = el.tagName.toLowerCase()
      const attributes: Record<string, string> = {}
      for (const { name, value } of [...el.attributes]) {
        const skip = omitted.some(
          (o) =>
            o.attr === name &&
            (o.value === undefined || o.value === value) &&
            (o.valuePattern === undefined ||
              new RegExp(o.valuePattern).test(value)) &&
            (!o.nonButtonOnly || (tag !== "button" && tag !== "input"))
        )
        if (!skip) attributes[name] = value
      }
      const text = [...el.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent ?? "")
        .join("")
      return { tag, attributes, text, children: [...el.children].map(walk) }
    }
    return walk(root)
  }, omit)

/**
 * Applies the generator's declared class rewrites to the upstream tree:
 * other components' reactions to Base UI control state read the native
 * inputs' `:checked` instead (`has-data-checked:` becomes `has-checked:`).
 */
const rewriteClasses = (node: DomNode): DomNode => ({
  ...node,
  attributes:
    node.attributes.class === undefined
      ? node.attributes
      : {
          ...node.attributes,
          class: rewriteControlState(node.attributes.class),
        },
  children: node.children.map(rewriteClasses),
})

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
  await hono.goto(pageUrl("hono.html"))
  await react.goto(pageUrl("react.html"))
})

for (const { id, compareDom } of cases) {
  // biome-ignore lint/correctness/noEmptyPattern: Playwright requires a destructuring pattern for fixtures.
  test(id, async ({}, testInfo) => {
    const selector = `[data-case="${id}"]`
    const [a, b] = await Promise.all([
      hono.locator(selector).screenshot({ animations: "disabled" }),
      react.locator(selector).screenshot({ animations: "disabled" }),
    ])
    // The DOM must match upstream except for the declared omissions. Only the
    // upstream side is normalized, so extra attributes on ours still fail.
    // Native-structure families (<details>, <dialog>) are compared by pixels.
    if (compareDom) {
      expect(
        await domTree(hono, selector, []),
        "DOM must match upstream"
      ).toEqual(rewriteClasses(await domTree(react, selector, OMITTED)))
    }

    // Icons must match lucide-react's SVG exactly (attributes and shapes).
    // Native-structure families map state variants in classes and keep
    // hidden parts in the page, so there only visible icons are compared,
    // without classes (left to the pixel comparison).
    const svgs = (page: Page) =>
      page.locator(`${selector} svg`).evaluateAll(
        (elements, exact) =>
          elements
            .filter((svg) => exact || svg.checkVisibility())
            .map((svg) => ({
              attributes: Object.fromEntries(
                [...svg.attributes]
                  .filter((a) => exact || a.name !== "class")
                  .map((a) => [a.name, a.value])
              ),
              content: svg.innerHTML,
            })),
        compareDom
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
