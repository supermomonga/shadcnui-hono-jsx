import { describe, expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { config } from "../../../generator.config"
import { LICENSE_NOTICE_PATH } from "../../src/licenses"
import { ROOT } from "../../src/paths"
import { ALLOWED_REGISTRY_DEPENDENCIES } from "../../src/policy"
import { collectDependencies, type Registry } from "../../src/registry/build"

const registry = JSON.parse(
  readFileSync(path.join(ROOT, "registry.json"), "utf8")
) as Registry

describe("registry.json", () => {
  test("contains the theme and every configured component, once each", () => {
    const names = registry.items.map((item) => item.name)
    expect(names).toEqual(["theme", ...[...config.components].sort()])
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
  test("ignores hono and rejects local or non-allowlisted imports", () => {
    const file = (text: string) => ({ path: "components/ui/x.tsx", text })
    expect(
      collectDependencies(
        file(`import type { JSX } from "hono/jsx"\nimport { cn } from "cn"`)
      )
    ).toEqual(["cn"])
    expect(() => collectDependencies(file(`import { x } from "./x"`))).toThrow(
      /local imports/
    )
    expect(() =>
      collectDependencies(file(`import { x } from "left-pad"`))
    ).toThrow(/allowlisted/)
  })
})
