/**
 * Licensing of the distributed (registry) files.
 *
 * The notice shipped with every registry item is fixed, reviewed text. It is
 * never assembled from upstream license files: a change in upstream licensing
 * can change whether and how its code may be redistributed, so it needs a human
 * decision. `upstream:sync` only snapshots the upstream license texts, and
 * `checkUpstreamLicenses` stops generation until a maintainer reviews any change
 * and updates the accepted record below (see docs/adr/0013).
 */

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

/** Lucide icon licensing as reviewed by a maintainer (icons are inlined into generated sources). */
export const ACCEPTED_ICON_LICENSE = {
  package: "lucide",
  spdx: "ISC",
  copyright: "Copyright (c) 2026 Lucide Icons and Contributors",
  /** sha256 of the `lucide` package LICENSE, reproduced verbatim in the notice below. */
  sha256: "b495047bd93a9b06913511076f504daba17d5bbeb3e0650f3bb53a4220329c57",
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

/** This project's notice for its own additions and modifications. */
export const PROJECT_COPYRIGHT = "Copyright (c) 2026 supermomonga"

/** Notice file installed next to every registry item (`~/<path>`). */
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

/** Content of `LICENSE-shadcnui-hono-jsx.txt`. Deterministic; no dates or item lists. */
export function buildLicenseNotice(repository: string): string {
  return `shadcnui-hono-jsx - https://github.com/${repository}

This notice applies to the component and stylesheet sources installed from the
shadcnui-hono-jsx registry (for example components/ui/*.tsx and
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

Some installed sources inline SVG icons from Lucide (https://lucide.dev),
version-pinned in their headers. Lucide is licensed as follows (reproduced
from the lucide package, including the notice for icons derived from Feather):

${LUCIDE_LICENSE_TEXT}`
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

/** Extra header line for sources that inline Lucide icons. */
export function iconNoticeLines(names: string[], version: string): string[] {
  return [
    `Icons: lucide@${version} (${names.join(", ")}). ${ACCEPTED_ICON_LICENSE.copyright}. ${ACCEPTED_ICON_LICENSE.spdx} License (see ${LICENSE_NOTICE_PATH}).`,
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
  /** `LICENSE` of the pinned `lucide` package from the snapshot. */
  icons: string | null
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
  const icons = lock.icons
  const iconLicense = ACCEPTED_ICON_LICENSE
  if (!icons) {
    problems.push("icon package metadata is missing from upstream/lock.json")
  } else {
    if (icons.license !== iconLicense.spdx) {
      problems.push(
        `${icons.package}@${icons.version} declares license "${icons.license}", expected "${iconLicense.spdx}"`
      )
    }
    if (texts.icons === null) {
      problems.push(`${icons.package} LICENSE is missing from the snapshot`)
    } else if (sha256(texts.icons) !== iconLicense.sha256) {
      problems.push(
        `${icons.package}@${icons.version} LICENSE differs from the reviewed text`
      )
    }
  }
  return problems
}
