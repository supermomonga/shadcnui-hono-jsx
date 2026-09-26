import { describe, expect, test } from "bun:test"
import { config } from "../../generator.config"
import { GenerationError } from "../src/generate"
import { generateLite, LITE_COMPONENTS } from "../src/lite"
import { ROOT } from "../src/paths"
import { UpstreamStore } from "../src/upstream/store"

const lock = (() => {
  const value = new UpstreamStore(ROOT, config.style).readLock()
  if (!value) throw new Error("upstream/lock.json is missing")
  return value
})()

describe("lite alternatives (docs/adr/0028)", () => {
  test.each(Object.keys(LITE_COMPONENTS))(
    "%s is named -lite and translates without blocking reasons",
    (name) => {
      expect(name.endsWith("-lite")).toBe(true)
      expect(config.components).not.toContain(name)
      const generated = generateLite(name, { config, lock })
      expect(generated.mode).toBe("lite")
      expect(generated.file.path).toBe(
        `cli/generated/templates/${config.style}/${name}.tsx`
      )
      expect(generated.file.text).toContain("not a port of upstream code")
    }
  )

  test("an upstream change stops generation until the alternative is reviewed", () => {
    const changed = structuredClone(lock)
    const entry = changed.items["input-otp"]
    if (!entry) throw new Error("input-otp is not snapshotted")
    entry.contentSha256 = "0".repeat(64)
    expect(() =>
      generateLite("input-otp-lite", { config, lock: changed })
    ).toThrow(GenerationError)
    expect(() =>
      generateLite("input-otp-lite", { config, lock: changed })
    ).toThrow(/upstream input-otp changed/)
  })
})
