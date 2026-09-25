import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { BEHAVIORS_DIR } from "../../generator/src/adapters/families"
import { findImports } from "../../generator/src/policy"

const DIR = path.resolve(import.meta.dir, "../..", BEHAVIORS_DIR)

describe("client scripts (docs/adr/0025)", () => {
  const scripts = readdirSync(DIR).filter((file) => file.endsWith(".js"))

  test.each(scripts)("%s imports only sibling scripts", (file) => {
    const imports = findImports(readFileSync(path.join(DIR, file), "utf8"))
    for (const specifier of imports) {
      expect(specifier).toMatch(/^\.\/[a-z0-9-]+\.js$/)
      expect(scripts).toContain(specifier.slice(2))
    }
  })
})
