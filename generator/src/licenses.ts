/**
 * Licensing of the distributed files.
 *
 * The notice the CLI installs with the components is fixed, reviewed text. It is
 * never assembled from upstream license files: a change in upstream licensing
 * can change whether and how its code may be redistributed, so it needs a human
 * decision. `upstream:sync` only snapshots the upstream license texts, and
 * `checkUpstreamLicenses` stops generation until a maintainer reviews any change
 * and updates the accepted record below (see docs/adr/0013).
 */

import { ICON_LIBRARIES, type IconLibrary } from "../../cli/src/icons"
import {
  HUGEICONS_LICENSE_TEXT,
  PHOSPHOR_LICENSE_TEXT,
  REMIXICON_LICENSE_TEXT,
  TABLER_LICENSE_TEXT,
} from "./icon-license-texts"
import { sha256 } from "./upstream/hash"
import type { UpstreamLock } from "./upstream/lock"

/** Upstream licensing as reviewed by a maintainer. Update only after review. */
export const ACCEPTED_UPSTREAM_LICENSE = {
  spdx: "MIT",
  copyright: "Copyright (c) 2023 shadcn",
  /** sha256 of shadcn-ui/ui `LICENSE.md` (also shipped in the `shadcn` npm package). */
  sha256: "1564074e13439397221ffd522e2e504d56561994a23d371aa5e3ad43e4f5423f",
  reviewedAt: "2026-09-25",
} as const

/** Verbatim copy of the reviewed `lucide` LICENSE (ISC, with Feather's MIT notice). */
export const LUCIDE_LICENSE_TEXT = `ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

The following Lucide icons are derived from the Feather project:

airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out

The MIT License (MIT) (for the icons listed above)

Copyright (c) 2013-present Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`

/** Icon package licensing as reviewed by a maintainer (icons are inlined, docs/adr/0031). */
export interface AcceptedIconLicense {
  package: string
  title: string
  url: string
  /** The `license` field of the package's package.json. */
  license: string
  /** The license's name in notices and headers. */
  licenseName: string
  copyright: string
  /** sha256 of the package's license file, reproduced verbatim in the notice. */
  sha256: string
  reviewedAt: string
  text: string
  /** A remark for the notice, before the license text. */
  remark?: string
}

export const ACCEPTED_ICON_LICENSES: Readonly<
  Record<IconLibrary, AcceptedIconLicense>
> = {
  lucide: {
    package: "lucide",
    title: "Lucide",
    url: "https://lucide.dev",
    license: "ISC",
    licenseName: "ISC License",
    copyright: "Copyright (c) 2026 Lucide Icons and Contributors",
    sha256: "b495047bd93a9b06913511076f504daba17d5bbeb3e0650f3bb53a4220329c57",
    reviewedAt: "2026-09-25",
    text: LUCIDE_LICENSE_TEXT,
    remark: "including the notice for icons derived from Feather",
  },
  tabler: {
    package: "@tabler/icons",
    title: "Tabler Icons",
    url: "https://tabler.io/icons",
    license: "MIT",
    licenseName: "MIT License",
    copyright: "Copyright (c) 2020-2026 Paweł Kuna",
    sha256: "b740a1d46122672da62833e97f7e7c8a13fa85cbc7445b584b297cc00dde93db",
    reviewedAt: "2026-09-26",
    text: TABLER_LICENSE_TEXT,
  },
  hugeicons: {
    package: "@hugeicons/core-free-icons",
    title: "Hugeicons",
    url: "https://hugeicons.com",
    license: "MIT",
    licenseName: "MIT License",
    copyright: "Copyright (c) 2025 Hugeicons",
    sha256: "1658d8213209df7b9b86dfc05d724ede48d00dbc27abc15976ec7adec9601cde",
    reviewedAt: "2026-09-26",
    text: HUGEICONS_LICENSE_TEXT,
  },
  phosphor: {
    package: "@phosphor-icons/core",
    title: "Phosphor Icons",
    url: "https://phosphoricons.com",
    license: "MIT",
    licenseName: "MIT License",
    copyright: "Copyright (c) 2023 Phosphor Icons",
    sha256: "b5b1f1da112d18ea2147decfd48ddc1bf2b5aeb6c265381579340e95b15a2bb2",
    reviewedAt: "2026-09-26",
    text: PHOSPHOR_LICENSE_TEXT,
  },
  remixicon: {
    package: "remixicon",
    title: "Remix Icon",
    url: "https://remixicon.com",
    // The package.json still says Apache-2.0; its License file is the Remix
    // Icon License v1.0 (since 4.9.0), accepted by the project owner.
    license: "Apache-2.0",
    licenseName: "Remix Icon License v1.0",
    copyright: "Copyright (c) 2017–2026 Remix Design",
    sha256: "6f2f21c5f8db34635d31848e9ff831d5dc421bb83ffc9d37f82651364047ae58",
    reviewedAt: "2026-09-26",
    text: REMIXICON_LICENSE_TEXT,
    remark:
      "which is not an open source license: it forbids selling the icons on their own, building a competing icon library from them and using them as a logo or brand identity",
  },
}

/** This project's notice for its own additions and modifications. */
export const PROJECT_COPYRIGHT = "Copyright (c) 2026 supermomonga"

/** Notice file the CLI installs at the project root (docs/adr/0029). */
export const LICENSE_NOTICE_PATH = "LICENSE-shadcnui-hono-jsx.txt"

const MIT_PERMISSION_NOTICE = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`

/**
 * Content of `LICENSE-shadcnui-hono-jsx.txt` for a project with icons from
 * `library`. Deterministic; no dates or item lists.
 */
export function buildLicenseNotice(
  repository: string,
  library: IconLibrary
): string {
  const icons = ACCEPTED_ICON_LICENSES[library]
  return `shadcnui-hono-jsx - https://github.com/${repository}

This notice applies to the component and stylesheet sources installed by the
shadcnui-hono-jsx CLI (for example components/ui/*.tsx and
styles/shadcn/*.css) and to their derivative portions. It does not apply to
unrelated code in the project that receives them.

Upstream portions are derived from shadcn/ui (https://github.com/shadcn-ui/ui),
including the shadcn package's tailwind.css. The supermomonga notice applies
only to original additions and modifications made by shadcnui-hono-jsx; no
additional copyright is claimed in the vendored tailwind.css.

shadcnui-hono-jsx is an unofficial community project and is not affiliated
with, maintained by, or endorsed by shadcn or shadcn/ui.

Keep this file with the installed sources when you copy or redistribute them.

MIT License

${ACCEPTED_UPSTREAM_LICENSE.copyright}
${PROJECT_COPYRIGHT}

${MIT_PERMISSION_NOTICE}

-------------------------------------------------------------------------------

Icons

${wrap(`Some installed sources inline SVG icons from ${icons.title} (${icons.url}), version-pinned in their headers. ${iconLicenseIntro(library)}`)}

${icons.text}`
}

/** `text` as lines of at most 80 characters. */
function wrap(text: string): string {
  const lines: string[] = []
  let line = ""
  for (const word of text.split(" ")) {
    if (line && line.length + 1 + word.length > 80) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  return [...lines, line].join("\n")
}

/** "Lucide is licensed as follows (reproduced from …):" */
function iconLicenseIntro(library: IconLibrary): string {
  const icons = ACCEPTED_ICON_LICENSES[library]
  return `${icons.title} is licensed as follows (reproduced from the ${icons.package} package${icons.remark ? `, ${icons.remark}` : ""}):`
}

const RULE =
  "-------------------------------------------------------------------------------"

/**
 * `cli/LICENSE`, the license of the npm package: its CLI code, the templates
 * and vendored files derived from shadcn/ui, and the icons of every library.
 */
export function buildPackageLicense(repository: string): string {
  const icons = ICON_LIBRARIES.map((library) => {
    const icon = ACCEPTED_ICON_LICENSES[library]
    return `${RULE}

${wrap(`${icon.title} (${icon.url}). ${iconLicenseIntro(library)}`)}

${icon.text}`
  })
  return `shadcnui-hono-jsx - https://github.com/${repository}

This package contains the shadcnui-hono-jsx CLI, component templates and
stylesheets derived from shadcn/ui (https://github.com/shadcn-ui/ui), files
vendored from the shadcn package (generated/tailwind.css and
generated/shadcn-preset.js), and SVG icons inlined from the icon libraries
below (generated/templates/ for Lucide, generated/icons/ for the others). The
supermomonga notice applies only to original additions and modifications made
by shadcnui-hono-jsx. The CLI installs LICENSE-shadcnui-hono-jsx.txt
(generated/notices/) with the sources it installs, with the license of the
icon library they use.

shadcnui-hono-jsx is an unofficial community project and is not affiliated
with, maintained by, or endorsed by shadcn or shadcn/ui.

MIT License

${ACCEPTED_UPSTREAM_LICENSE.copyright}
${PROJECT_COPYRIGHT}

${MIT_PERMISSION_NOTICE}

${RULE}

Icons

The icons are licensed as follows.

${icons.join("\n")}`
}

/** License lines for generated sources that include this project's changes. */
export function derivedNoticeLines(): string[] {
  return [
    `Derived from shadcn/ui. ${ACCEPTED_UPSTREAM_LICENSE.copyright}.`,
    `Original additions and modifications: ${PROJECT_COPYRIGHT}.`,
    `SPDX-License-Identifier: ${ACCEPTED_UPSTREAM_LICENSE.spdx}`,
    `Full license: ${LICENSE_NOTICE_PATH} at the project root.`,
  ]
}

/** The header line of sources with icons of `library`; `{names}` lists them. */
export function iconHeaderLine(library: IconLibrary, version: string): string {
  const icons = ACCEPTED_ICON_LICENSES[library]
  return `Icons: ${icons.package}@${version} ({names}). ${icons.copyright}. ${icons.licenseName} (see ${LICENSE_NOTICE_PATH}).`
}

/** Extra header line for sources that inline Lucide icons (the templates). */
export function iconNoticeLines(names: string[], version: string): string[] {
  return [
    iconHeaderLine("lucide", version).replace("{names}", names.join(", ")),
  ]
}

/** License lines for files copied verbatim from upstream. */
export function vendoredNoticeLines(): string[] {
  return [
    `${ACCEPTED_UPSTREAM_LICENSE.copyright}.`,
    `SPDX-License-Identifier: ${ACCEPTED_UPSTREAM_LICENSE.spdx}`,
    `Full license: ${LICENSE_NOTICE_PATH} at the project root.`,
  ]
}

export interface UpstreamLicenseTexts {
  /** shadcn-ui/ui `LICENSE.md` from the snapshot. */
  repository: string | null
  /** `LICENSE.md` of the pinned `shadcn` npm package from the snapshot. */
  package: string | null
  /** License files of the pinned icon packages from the snapshot. */
  icons: Partial<Record<IconLibrary, string | null>>
}

/**
 * Compares the snapshotted upstream licensing with the accepted record.
 * Returns human-readable problems; an empty list means generation may proceed.
 */
export function checkUpstreamLicenses(
  lock: UpstreamLock,
  texts: UpstreamLicenseTexts
): string[] {
  const problems: string[] = []
  const accepted = ACCEPTED_UPSTREAM_LICENSE
  if (texts.repository === null) {
    problems.push(
      "upstream shadcn-ui/ui LICENSE.md is missing from the snapshot"
    )
  } else if (sha256(texts.repository) !== accepted.sha256) {
    problems.push(
      "upstream shadcn-ui/ui LICENSE.md differs from the reviewed text"
    )
  }
  const vendored = lock.tailwindCss
  if (!vendored) {
    problems.push(
      "vendored package metadata is missing from upstream/lock.json"
    )
  } else {
    if (vendored.license !== accepted.spdx) {
      problems.push(
        `${vendored.package}@${vendored.version} declares license "${vendored.license}", expected "${accepted.spdx}"`
      )
    }
    if (texts.package === null) {
      problems.push(
        `${vendored.package} LICENSE.md is missing from the snapshot`
      )
    } else if (sha256(texts.package) !== accepted.sha256) {
      problems.push(
        `${vendored.package}@${vendored.version} LICENSE.md differs from the reviewed text`
      )
    }
  }
  for (const library of ICON_LIBRARIES) {
    const accepted = ACCEPTED_ICON_LICENSES[library]
    const icons = lock.icons[library]
    const text = texts.icons[library] ?? null
    if (!icons) {
      problems.push(`${accepted.package} is missing from upstream/lock.json`)
      continue
    }
    if (icons.license !== accepted.license) {
      problems.push(
        `${icons.package}@${icons.version} declares license "${icons.license}", expected "${accepted.license}"`
      )
    }
    if (text === null) {
      problems.push(`${icons.package} license is missing from the snapshot`)
    } else if (sha256(text) !== accepted.sha256) {
      problems.push(
        `${icons.package}@${icons.version} license differs from the reviewed text`
      )
    }
  }
  return problems
}
