import { describe, expect, test } from "bun:test"
import { MAX_REPORT_LENGTH, renderSyncReport } from "../../src/upstream/report"
import type { SyncResult } from "../../src/upstream/sync"
import type { UpstreamItem } from "../../src/upstream/types"

const item = (name: string, content: string): UpstreamItem => ({
  name,
  type: "registry:ui",
  files: [{ path: `registry/ui/${name}.tsx`, type: "registry:ui", content }],
})

const empty: SyncResult = {
  added: [],
  changed: [],
  removed: [],
  unchanged: [],
  indexChanged: false,
  themeChanged: false,
  fontsChanged: [],
  presetChanged: false,
  tailwindCssChanged: false,
  theme: null,
  tailwindCss: null,
  license: null,
  packageLicense: null,
  iconLicense: null,
  lockChanged: false,
}

describe("renderSyncReport", () => {
  test("summarizes changes, highlights generated components and shows diffs", () => {
    const report = renderSyncReport({
      style: "base-nova",
      generated: ["button"],
      classifications: [
        { name: "button", before: "direct", after: "unsupported" },
        { name: "card", before: "direct", after: "direct" },
      ],
      result: {
        ...empty,
        changed: [
          {
            name: "button",
            before: item("button", 'const a = "h-8"\n'),
            after: item("button", 'const a = "h-9"\n'),
          },
        ],
        added: [
          { name: "kbd", before: null, after: item("kbd", "export {}\n") },
        ],
        themeChanged: true,
        theme: { before: '{"a":1}\n', after: '{"a":2}\n' },
        tailwindCssChanged: true,
        tailwindCss: {
          before: "a\n",
          after: "b\n",
          fromVersion: "4.21.0",
          toVersion: "4.22.0",
        },
      },
    })

    expect(report).toContain("- Changed: `button`")
    expect(report).toContain("- Added: `kbd`")
    expect(report).toContain("- Generated components affected: `button`")
    expect(report).toContain("- Vendored tailwind.css: 4.21.0 -> 4.22.0")
    expect(report).toContain("| button | direct | unsupported |")
    expect(report).not.toContain("| card |")
    expect(report).toContain("<summary>button (generated)</summary>")
    expect(report).toContain('-const a = "h-8"')
    expect(report).toContain('+const a = "h-9"')
    expect(report).toContain("<summary>theme.json</summary>")
    expect(report).toContain("never merged automatically")
  })

  test("reports no changes without diff sections", () => {
    const report = renderSyncReport({
      style: "s",
      generated: [],
      classifications: [],
      result: empty,
    })
    expect(report).toContain("- Changed: none")
    expect(report).not.toContain("### Upstream diffs")
  })

  test("stays under the PR body limit by omitting diff sections", () => {
    const big = "x\n".repeat(20_000)
    const changed = Array.from({ length: 5 }, (_, i) => ({
      name: `c${i}`,
      before: item(`c${i}`, ""),
      after: item(`c${i}`, big),
    }))
    const report = renderSyncReport({
      style: "s",
      generated: [],
      classifications: [],
      result: { ...empty, changed },
    })
    expect(report.length).toBeLessThanOrEqual(MAX_REPORT_LENGTH + 200)
    expect(report).toMatch(/diff section\(s\) omitted for length/)
  })

  test("puts license changes first with a caution to block merging", () => {
    const report = renderSyncReport({
      style: "base-nova",
      generated: [],
      classifications: [],
      licenseProblems: [
        "upstream shadcn-ui/ui LICENSE.md differs from the reviewed text",
      ],
      result: {
        ...empty,
        changed: [
          {
            name: "kbd",
            before: item("kbd", "a\n"),
            after: item("kbd", "b\n"),
          },
        ],
        license: { before: "MIT License\n", after: "Apache License\n" },
      },
    })
    expect(report).toContain("> [!CAUTION]")
    expect(report).toContain(
      "> - upstream shadcn-ui/ui LICENSE.md differs from the reviewed text"
    )
    expect(report).toContain("- Upstream license: changed")
    expect(report.indexOf("LICENSE.md (shadcn-ui/ui)")).toBeLessThan(
      report.indexOf("<summary>kbd")
    )
    expect(report).toContain("+Apache License")
  })

  test("has no caution when licensing is unchanged", () => {
    const report = renderSyncReport({
      style: "s",
      generated: [],
      classifications: [],
      result: empty,
    })
    expect(report).not.toContain("[!CAUTION]")
    expect(report).toContain("- Upstream license: unchanged")
  })
})
