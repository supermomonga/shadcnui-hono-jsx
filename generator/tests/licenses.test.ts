import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"
import { ICON_LIBRARIES } from "../../cli/src/icons"
import { config } from "../../generator.config"
import {
  ACCEPTED_ICON_LICENSES,
  ACCEPTED_UPSTREAM_LICENSE,
  buildLicenseNotice,
  buildPackageLicense,
  checkUpstreamLicenses,
  derivedNoticeLines,
  iconHeaderLine,
  LICENSE_NOTICE_PATH,
  PROJECT_COPYRIGHT,
  vendoredNoticeLines,
} from "../src/licenses"
import { ROOT } from "../src/paths"
import { sha256 } from "../src/upstream/hash"
import { UpstreamStore } from "../src/upstream/store"

const store = new UpstreamStore(ROOT, config.style)
const lock = store.readLock()
if (!lock) throw new Error("missing upstream lock")
const texts = {
  repository: store.readOptional(store.licenseFile),
  package: store.readOptional(store.packageLicenseFile),
  icons: Object.fromEntries(
    ICON_LIBRARIES.map((library) => [
      library,
      store.readOptional(store.iconLicenseFile(library)),
    ])
  ),
}

describe("buildLicenseNotice", () => {
  const notice = buildLicenseNotice("owner/repo", "lucide")

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

  test.each([...ICON_LIBRARIES])(
    "reproduces the reviewed %s license verbatim, and only that one",
    (library) => {
      const accepted = ACCEPTED_ICON_LICENSES[library]
      expect(sha256(accepted.text)).toBe(accepted.sha256)
      const text = buildLicenseNotice("owner/repo", library)
      expect(text).toContain(accepted.text)
      expect(text.replace(/\s+/g, " ")).toContain(
        `${accepted.title} (${accepted.url})`
      )
      for (const other of ICON_LIBRARIES) {
        if (other === library) continue
        expect(text).not.toContain(ACCEPTED_ICON_LICENSES[other].text)
      }
    }
  )

  test("keeps Feather's notice for Lucide and flags the Remix Icon License", () => {
    expect(notice).toContain("Copyright (c) 2013-present Cole Bemis")
    expect(buildLicenseNotice("owner/repo", "remixicon")).toContain(
      "which is not an open source license"
    )
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

  test("is deterministic and matches the generated files", () => {
    expect(buildLicenseNotice("owner/repo", "lucide")).toBe(notice)
    for (const library of ICON_LIBRARIES) {
      expect(
        readFileSync(
          path.join(ROOT, "cli", "generated", "notices", `${library}.txt`),
          "utf8"
        )
      ).toBe(buildLicenseNotice(config.repository, library))
    }
  })
})

describe("buildPackageLicense", () => {
  const license = buildPackageLicense("owner/repo")

  test("carries both copyright notices and every icon license", () => {
    expect(license).toContain(
      `${ACCEPTED_UPSTREAM_LICENSE.copyright}\n${PROJECT_COPYRIGHT}\n`
    )
    expect(license).toContain("Permission is hereby granted, free of charge")
    for (const library of ICON_LIBRARIES) {
      expect(license).toContain(ACCEPTED_ICON_LICENSES[library].text)
    }
    expect(license).toContain("which is not an open source license")
  })

  test("matches the generated file", () => {
    expect(readFileSync(path.join(ROOT, "cli", "LICENSE"), "utf8")).toBe(
      buildPackageLicense(config.repository)
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

  test("name the icon package, its copyright and license", () => {
    expect(iconHeaderLine("tabler", "3.48.0")).toBe(
      `Icons: @tabler/icons@3.48.0 ({names}). Copyright (c) 2020-2026 Paweł Kuna. MIT License (see ${LICENSE_NOTICE_PATH}).`
    )
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
      checkUpstreamLicenses(lock, {
        repository: null,
        package: null,
        icons: {},
      })
    ).toHaveLength(2 + ICON_LIBRARIES.length)
  })

  test("rejects a changed icon package license", () => {
    const tabler = lock.icons.tabler
    if (!tabler) throw new Error("missing icon lock")
    const relicensed = {
      ...lock,
      icons: { ...lock.icons, tabler: { ...tabler, license: "GPL-3.0" } },
    }
    expect(checkUpstreamLicenses(relicensed, texts)).toEqual([
      `@tabler/icons@${tabler.version} declares license "GPL-3.0", expected "MIT"`,
    ])
    expect(
      checkUpstreamLicenses(lock, {
        ...texts,
        icons: { ...texts.icons, tabler: "changed\n" },
      })
    ).toEqual([
      `@tabler/icons@${tabler.version} license differs from the reviewed text`,
    ])
  })
})
