import { describe, expect, test } from "bun:test"
import {
  findImports,
  findProhibitedImports,
  isProhibitedModule,
  packageNameOf,
} from "../src/policy"

describe("isProhibitedModule", () => {
  test.each([
    "react",
    "react/jsx-runtime",
    "react-dom",
    "react-dom/server",
    "@base-ui/react/button",
    "@base-ui-components/react",
    "@radix-ui/react-slot",
    "radix-ui",
    "lucide-react",
    "next/link",
    "@floating-ui/react-dom",
    "@hono/react-renderer",
  ])("rejects %s", (specifier) => {
    expect(isProhibitedModule(specifier)).toBe(true)
  })

  test.each([
    "hono/jsx",
    "cn",
    "class-variance-authority",
    "reactive-thing",
    "nextra-like",
    "./react",
  ])("allows %s", (specifier) => {
    expect(isProhibitedModule(specifier)).toBe(false)
  })
})

describe("findImports", () => {
  test("collects static, type-only, side-effect, re-export and dynamic imports", () => {
    const source = [
      `import * as React from "react"`,
      `import type { JSX } from "hono/jsx"`,
      `import { cva, type VariantProps } from "class-variance-authority"`,
      `import "./side-effect.css"`,
      `export { cn } from "cn"`,
      `const lazy = import("lucide-react")`,
    ].join("\n")
    expect(findImports(source)).toEqual([
      "react",
      "hono/jsx",
      "class-variance-authority",
      "./side-effect.css",
      "cn",
      "lucide-react",
    ])
    expect(findProhibitedImports(source)).toEqual(["react", "lucide-react"])
  })
})

describe("packageNameOf", () => {
  test.each([
    ["cn", "cn"],
    ["hono/jsx", "hono"],
    ["@base-ui/react/button", "@base-ui/react"],
    ["./button", null],
    ["@/components/ui/button", null],
    ["node:fs", null],
  ])("%s -> %s", (specifier, expected) => {
    expect(packageNameOf(specifier)).toBe(expected)
  })
})
