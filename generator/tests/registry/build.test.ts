import { describe, expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { config } from "../../../generator.config"
import { LICENSE_NOTICE_PATH } from "../../src/licenses"
import { LITE_COMPONENTS } from "../../src/lite"
import { ROOT } from "../../src/paths"
import { ALLOWED_REGISTRY_DEPENDENCIES } from "../../src/policy"
import {
  collectComponentImports,
  collectDependencies,
  type Registry,
} from "../../src/registry/build"

const registry = JSON.parse(
  readFileSync(path.join(ROOT, "registry.json"), "utf8")
) as Registry

describe("registry.json", () => {
  test("contains the theme, every configured component and every lite alternative, once each", () => {
    const names = registry.items.map((item) => item.name)
    expect(names).toEqual([
      "theme",
      ...[...config.components, ...Object.keys(LITE_COMPONENTS)].sort(),
    ])
  })

  test.each(registry.items.map((item) => [item.name, item] as const))(
    "%s is a universal item with existing files and ~/ targets",
    (_name, item) => {
      expect(item.type).toBe("registry:item")
      expect(item.files.length).toBeGreaterThan(0)
      for (const file of item.files) {
        expect(file.type).toBe("registry:file")
        expect(file.target).toBe(`~/${file.path}`)
        expect(existsSync(path.join(ROOT, file.path))).toBe(true)
      }
      expect(item.files.map((file) => file.path)).toContain(LICENSE_NOTICE_PATH)
      expect(item).not.toHaveProperty("registryDependencies")
      for (const dependency of item.dependencies ?? []) {
        expect(ALLOWED_REGISTRY_DEPENDENCIES).toContain(dependency)
      }
    }
  )

  test("component dependencies come from generated imports", () => {
    const button = registry.items.find((item) => item.name === "button")
    const card = registry.items.find((item) => item.name === "card")
    expect(button?.dependencies).toEqual(["class-variance-authority", "cn"])
    expect(card?.dependencies).toEqual(["cn"])
  })
})

describe("collectDependencies", () => {
  const file = (text: string) => ({ path: "components/ui/x.tsx", text })

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

describe("items with sibling components", () => {
  test("ship every transitively imported component file", () => {
    for (const item of registry.items) {
      if (item.name === "theme") continue
      const own = `components/ui/${item.name}.tsx`
      expect(item.files[0]?.path).toBe(own)
      const text = readFileSync(path.join(ROOT, own), "utf8")
      for (const sibling of collectComponentImports({ path: own, text })) {
        expect(item.files.map((f) => f.path)).toContain(
          `components/ui/${sibling}.tsx`
        )
      }
    }
  })
})
