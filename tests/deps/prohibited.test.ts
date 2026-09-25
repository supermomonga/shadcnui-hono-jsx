import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { ROOT } from "../../generator/src/paths"
import {
  ALLOWED_REGISTRY_DEPENDENCIES,
  findImports,
  findProhibitedImports,
  packageNameOf,
} from "../../generator/src/policy"

const componentsDir = path.join(ROOT, "components", "ui")
const components = readdirSync(componentsDir)
  .filter((f) => f.endsWith(".tsx"))
  .sort()

describe("generated components", () => {
  test("exist", () => {
    expect(components.length).toBeGreaterThan(0)
  })

  test.each(components)("%s imports no prohibited modules", (file) => {
    const source = readFileSync(path.join(componentsDir, file), "utf8")
    expect(findProhibitedImports(source)).toEqual([])
    expect(source).not.toMatch(/\bReact\b/)
    expect(source).not.toContain("use client")
  })

  test.each(components)(
    "%s only imports hono, allowlisted packages and sibling components",
    (file) => {
      const source = readFileSync(path.join(componentsDir, file), "utf8")
      for (const specifier of findImports(source)) {
        const sibling = specifier.match(/^\.\/([a-z0-9-]+)$/)?.[1]
        if (sibling) {
          expect(components).toContain(`${sibling}.tsx`)
          continue
        }
        const pkg = packageNameOf(specifier)
        expect(
          pkg === "hono" || ALLOWED_REGISTRY_DEPENDENCIES.includes(pkg ?? "")
        ).toBe(true)
      }
    }
  )
})

describe("repository", () => {
  test("does not depend on React", () => {
    const pkg = JSON.parse(
      readFileSync(path.join(ROOT, "package.json"), "utf8")
    )
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const name of Object.keys(deps)) {
      expect(findProhibitedImports(`import "${name}"`)).toEqual([])
      expect(name).not.toMatch(/^@types\/react/)
    }
  })
})
