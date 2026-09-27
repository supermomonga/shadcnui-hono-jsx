import { describe, expect, test } from "bun:test"
import { commandVariants } from "../app/lib/commands"

describe("commandVariants", () => {
  test("runs a package with each package manager", () => {
    expect(commandVariants("npx shadcnui-hono-jsx@latest add button")).toEqual({
      pnpm: "pnpm dlx shadcnui-hono-jsx@latest add button",
      npm: "npx shadcnui-hono-jsx@latest add button",
      yarn: "yarn dlx shadcnui-hono-jsx@latest add button",
      bun: "bunx shadcnui-hono-jsx@latest add button",
    })
  })

  test("adds packages and scaffolds projects", () => {
    expect(commandVariants("npm install tailwindcss")?.bun).toBe(
      "bun add tailwindcss"
    )
    expect(commandVariants("npm create hono@latest my-app")?.pnpm).toBe(
      "pnpm create hono@latest my-app"
    )
  })

  test("leaves other commands alone", () => {
    expect(commandVariants("npxfoo")).toBeNull()
    expect(commandVariants("git clone x")).toBeNull()
  })
})
