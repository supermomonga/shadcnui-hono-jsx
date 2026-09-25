import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"
import { config } from "../../generator.config"
import {
  ACCEPTED_UPSTREAM_LICENSE,
  buildLicenseNotice,
  checkUpstreamLicenses,
  derivedNoticeLines,
  LICENSE_NOTICE_PATH,
  PROJECT_COPYRIGHT,
  vendoredNoticeLines,
} from "../src/licenses"
import { ROOT } from "../src/paths"
import { UpstreamStore } from "../src/upstream/store"

const store = new UpstreamStore(ROOT, config.style)
const lock = store.readLock()
if (!lock) throw new Error("missing upstream lock")
const texts = {
  repository: store.readOptional(store.licenseFile),
  package: store.readOptional(store.packageLicenseFile),
}

describe("buildLicenseNotice", () => {
  const notice = buildLicenseNotice("owner/repo")

  test("carries both copyright notices and the full MIT permission notice", () => {
    expect(notice).toContain(
      `${ACCEPTED_UPSTREAM_LICENSE.copyright}\n${PROJECT_COPYRIGHT}\n`
    )
    expect(notice).toContain("Permission is hereby granted, free of charge")
    expect(notice).toContain(
      "The above copyright notice and this permission notice shall be included in all"
    )
    expect(notice).toContain('THE SOFTWARE IS PROVIDED "AS IS"')
  })

  test("states its scope and that the project is unofficial", () => {
    expect(notice).toContain("It does not apply to\nunrelated code")
    expect(notice).toContain(
      "not affiliated\nwith, maintained by, or endorsed by shadcn"
    )
  })

  test("matches the upstream MIT text it was reviewed against", () => {
    const upstream = texts.repository ?? ""
    const permission = upstream.slice(
      upstream.indexOf("Permission is hereby granted")
    )
    expect(notice).toContain(permission.trim())
  })

  test("is deterministic and matches the generated file", () => {
    expect(buildLicenseNotice("owner/repo")).toBe(notice)
    expect(readFileSync(path.join(ROOT, LICENSE_NOTICE_PATH), "utf8")).toBe(
      buildLicenseNotice(config.repository)
    )
  })
})

describe("notice lines", () => {
  test("point at the installed notice file", () => {
    for (const lines of [derivedNoticeLines(), vendoredNoticeLines()]) {
      expect(lines).toContain("SPDX-License-Identifier: MIT")
      expect(lines.at(-1)).toBe(
        `Full license: ${LICENSE_NOTICE_PATH} at the project root.`
      )
    }
    expect(vendoredNoticeLines().join()).not.toContain("supermomonga")
  })
})

describe("checkUpstreamLicenses", () => {
  test("accepts the committed snapshot", () => {
    expect(checkUpstreamLicenses(lock, texts)).toEqual([])
  })

  test("rejects any change to the upstream license text", () => {
    const changed = {
      ...texts,
      repository: `${texts.repository}\nAdditional terms.\n`,
    }
    expect(checkUpstreamLicenses(lock, changed)).toEqual([
      "upstream shadcn-ui/ui LICENSE.md differs from the reviewed text",
    ])
  })

  test("rejects a changed package license field or text", () => {
    const vendored = lock.tailwindCss
    if (!vendored) throw new Error("missing vendored lock")
    const relicensed = {
      ...lock,
      tailwindCss: { ...vendored, license: "BUSL-1.1" },
    }
    expect(checkUpstreamLicenses(relicensed, texts)).toEqual([
      `shadcn@${vendored.version} declares license "BUSL-1.1", expected "MIT"`,
    ])
    expect(
      checkUpstreamLicenses(lock, { ...texts, package: "other\n" })
    ).toEqual([
      `shadcn@${vendored.version} LICENSE.md differs from the reviewed text`,
    ])
  })

  test("rejects missing snapshots", () => {
    expect(
      checkUpstreamLicenses(lock, { repository: null, package: null })
    ).toHaveLength(2)
  })
})
