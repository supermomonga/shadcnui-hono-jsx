import { describe, expect, test } from "bun:test"
import { config } from "../../../generator.config"
import { BROWSER_SPECS, VISUAL_CASES } from "../../../tests/visual/cases"
import { COMPONENT_ADAPTERS } from "../../src/adapters/components"
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

  // Components whose behavior needs a client script (docs/adr/0025).
  const SCRIPTED = new Set([
    "context-menu",
    "dropdown-menu",
    "hover-card",
    "input-group",
    "menubar",
    "slider",
    "tabs",
    "tooltip",
  ])

  test.each([...config.components])(
    "%s is generated and experimental",
    (name) => {
      expect(byName.get(name)).toMatchObject({
        status: "experimental",
        conversion:
          name in COMPONENT_ADAPTERS ? "generated-with-adapter" : "generated",
        clientJs: SCRIPTED.has(name) ? "required" : "none",
        visualParity: "verified",
        upstream: { contentSha256: lock.items[name]?.contentSha256 },
      })
      expect(byName.get(name)?.knownDifferences).toContain(
        "Accepts `class` instead of `className`."
      )
    }
  )

  test("every generated component has a visual parity case or browser spec", () => {
    const covered = new Set([
      ...VISUAL_CASES.map((c) => c.component),
      ...Object.keys(BROWSER_SPECS),
    ])
    expect(config.components.filter((name) => !covered.has(name))).toEqual([])
  })

  test("unsupported items list their blocking reasons", () => {
    const toast = byName.get("toast")
    expect(toast?.status).toBe("unsupported")
    expect(toast?.conversion).toBeNull()
    expect(toast?.reasons).toContain(
      "base-ui-primitive-unmapped:@base-ui/react/toast#Toast"
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
      table.indexOf("\n<details>\n")
    )
    expect(table).toContain("| toast | unsupported |")
  })
})
