import { describe, expect, test } from "bun:test"
import path from "node:path"
import { config } from "../../../generator.config"
import { COMPONENT_ADAPTERS } from "../../src/adapters/components"
import { behaviorsOf } from "../../src/adapters/families"
import { collectFacts } from "../../src/analyzer/facts"
import { transformSource } from "../../src/transformers/pipeline"
import { UpstreamStore } from "../../src/upstream/store"

const ROOT = path.resolve(import.meta.dir, "../../..")
const adapter = COMPONENT_ADAPTERS["input-group"]
const item = new UpstreamStore(ROOT, config.style).readItem("input-group")
const [file] = item.files ?? []
const [facts] = collectFacts(item).files

const transform = (source: string) => {
  if (!facts) throw new Error("no facts")
  return transformSource({ name: "input-group", source, facts, adapter })
}

describe("input-group adapter", () => {
  test("moves the addon's click handler into /shadcn/input-group.js", () => {
    const output = transform(file?.content ?? "")
    expect(output.text).not.toContain("onClick")
    expect(behaviorsOf([], adapter)).toEqual(["core", "input-group"])
  })

  test("fails when upstream changes the handler", () => {
    const changed = (file?.content ?? "").replace(
      '.querySelector("input")',
      '.querySelector("input, textarea")'
    )
    expect(() => transform(changed)).toThrow(/onClick changed upstream/)
  })
})
