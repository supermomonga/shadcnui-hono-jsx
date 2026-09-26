import { describe, expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import type { Catalog } from "../../../cli/src/catalog"
import { CLIENT_DIR, TEMPLATES_DIR } from "../../../cli/src/paths"
import { config } from "../../../generator.config"
import {
  collectComponentImports,
  collectDependencies,
  collectThemeDependencies,
} from "../../src/catalog/build"
import { derivedNoticeLines } from "../../src/licenses"
import { LITE_COMPONENTS } from "../../src/lite"
import { ROOT } from "../../src/paths"
import { ALLOWED_REGISTRY_DEPENDENCIES } from "../../src/policy"

const catalog = JSON.parse(
  readFileSync(path.join(ROOT, "cli/generated/catalog.json"), "utf8")
) as Catalog

const template = (name: string) =>
  path.join(TEMPLATES_DIR, config.style, `${name}.tsx`)

describe("catalog.json", () => {
  test("lists every configured component and every lite alternative, once each", () => {
    expect(catalog.items.map((item) => item.name)).toEqual(
      [...config.components, ...Object.keys(LITE_COMPONENTS)].sort()
    )
    expect(catalog.styles).toEqual([config.style])
    expect(catalog.themeDependencies).toEqual(["tw-animate-css"])
    expect(catalog.noticeLines).toEqual(derivedNoticeLines())
  })

  test.each(catalog.items.map((item) => [item.name, item] as const))(
    "%s has templates, client scripts and allowlisted dependencies",
    (name, item) => {
      expect(item.kind).toBe(LITE_COMPONENTS[name] ? "lite" : "port")
      expect(item.components[0]).toBe(name)
      for (const component of item.components) {
        expect(existsSync(template(component))).toBe(true)
      }
      for (const script of item.scripts) {
        expect(existsSync(path.join(CLIENT_DIR, `${script}.js`))).toBe(true)
      }
      for (const dependency of item.dependencies) {
        expect(ALLOWED_REGISTRY_DEPENDENCIES).toContain(dependency)
      }
    }
  )

  test("component dependencies come from generated imports", () => {
    const button = catalog.items.find((item) => item.name === "button")
    const card = catalog.items.find((item) => item.name === "card")
    expect(button?.dependencies).toEqual(["class-variance-authority", "cn"])
    expect(card?.dependencies).toEqual(["cn"])
  })

  test("items install every transitively imported component", () => {
    for (const item of catalog.items) {
      const text = readFileSync(template(item.name), "utf8")
      for (const sibling of collectComponentImports({
        path: item.name,
        text,
      })) {
        expect(item.components).toContain(sibling)
      }
    }
  })
})

describe("collectDependencies", () => {
  const file = (text: string) => ({ path: "templates/x.tsx", text })

  test("ignores hono and sibling components, rejects other local or non-allowlisted imports", () => {
    expect(
      collectDependencies(
        file(
          `import type { JSX } from "hono/jsx"\nimport { cn } from "cn"\nimport { Button } from "./button"`
        )
      )
    ).toEqual(["cn"])
    expect(() => collectDependencies(file(`import { x } from "../x"`))).toThrow(
      /local imports/
    )
    expect(() =>
      collectDependencies(file(`import { x } from "@/lib/x"`))
    ).toThrow(/local imports/)
    expect(() =>
      collectDependencies(file(`import { x } from "left-pad"`))
    ).toThrow(/allowlisted/)
  })

  test("collects sibling component imports", () => {
    expect(
      collectComponentImports(
        file(
          `import { Button } from "./button"\nimport { Separator } from "./separator"`
        )
      )
    ).toEqual(["button", "separator"])
  })
})

describe("collectThemeDependencies", () => {
  test("keeps package imports except the vendored shadcn/tailwind.css", () => {
    expect(
      collectThemeDependencies({
        name: "t",
        type: "registry:base",
        cssVars: {},
        css: {
          '@import "tw-animate-css"': {},
          '@import "shadcn/tailwind.css"': {},
          "@layer base": {},
        },
      })
    ).toEqual(["tw-animate-css"])
  })

  test("rejects packages that are not allowlisted", () => {
    expect(() =>
      collectThemeDependencies({
        name: "t",
        type: "registry:base",
        cssVars: {},
        css: { '@import "left-pad"': {} },
      })
    ).toThrow(/allowlisted/)
  })
})
