import { describe, expect, test } from "bun:test"
import { config } from "../../../generator.config"
import { VISUAL_CASES } from "../../../tests/visual/cases"
import {
  buildManifest,
  renderCompatibilityTable,
  replaceReadmeRegion,
} from "../../src/manifest/build"
import { ROOT } from "../../src/paths"
import { UpstreamStore } from "../../src/upstream/store"

const store = new UpstreamStore(ROOT, config.style)
const lock = store.readLock()
if (!lock) throw new Error("missing upstream lock")
const manifest = buildManifest({ config, store, lock })
const byName = new Map(manifest.components.map((c) => [c.name, c]))

describe("buildManifest", () => {
  test("covers every snapshotted upstream item", () => {
    expect(manifest.components.map((c) => c.name)).toEqual(store.listItems())
  })

  test.each([...config.components])(
    "%s is generated and experimental",
    (name) => {
      expect(byName.get(name)).toMatchObject({
        status: "experimental",
        conversion: "generated",
        clientJs: "none",
        visualParity: "verified",
        upstream: { contentSha256: lock.items[name]?.contentSha256 },
      })
      expect(byName.get(name)?.knownDifferences).toContain(
        "Accepts `class` instead of `className`."
      )
    }
  )

  test("every generated component has a visual parity case", () => {
    const covered = new Set(VISUAL_CASES.map((c) => c.component))
    expect(config.components.filter((name) => !covered.has(name))).toEqual([])
  })

  test("unsupported items list their blocking reasons", () => {
    const dialog = byName.get("dialog")
    expect(dialog?.status).toBe("unsupported")
    expect(dialog?.conversion).toBeNull()
    expect(dialog?.reasons).toContain(
      "base-ui-primitive-unmapped:@base-ui/react/dialog#Dialog"
    )
  })

  test("primitive notes flow into known differences", () => {
    expect(byName.get("button")?.knownDifferences.join(" ")).toContain(
      '`type="button"`'
    )
  })

  test("is deterministic", () => {
    expect(buildManifest({ config, store, lock })).toEqual(manifest)
  })
})

describe("README region", () => {
  test("replaces only the marked region", () => {
    const readme =
      "# Title\n<!-- compatibility-table:start -->\nold\n<!-- compatibility-table:end -->\nafter\n"
    expect(replaceReadmeRegion(readme, "new")).toBe(
      "# Title\n<!-- compatibility-table:start -->\nnew\n<!-- compatibility-table:end -->\nafter\n"
    )
    expect(() => replaceReadmeRegion("# no markers", "x")).toThrow(/markers/)
  })

  test("renders generated components before the collapsed unsupported list", () => {
    const table = renderCompatibilityTable(manifest)
    expect(table.indexOf("| button | experimental | generated |")).toBeLessThan(
      table.indexOf("<details>")
    )
    expect(table).toContain("| dialog | unsupported |")
  })
})
