---
number: 16
title: Inline Lucide icons at generation time
status: superseded
date: 2026-09-25
links:
- target: 13
  kind: amends
- target: 31
  kind: supersededby
---


# Inline Lucide icons at generation time

## Context and Problem Statement

Upstream components render icons through `IconPlaceholder`, which the shadcn
CLI turns into the configured icon library; the base-nova default is
`lucide-react`. Generated components cannot use React, and there is no official
Lucide package for Hono JSX. Breadcrumb, native select, spinner, pagination,
and dialog need icons. How should generated components render them?

Measured on 2026-09-25 (`lucide@1.48.0`, hono 4.13.9): importing icons from the
`lucide` package entry point adds about 11-13 ms and 11 MB RSS at startup in
unbundled Bun/Node servers (all ~3,700 icon modules load), and converting
Lucide's icon data to Hono JSX on every render costs about 1.39 us per icon
versus 1.28 us for static JSX. Bundled deployments tree-shake unused icons.

## Decision Drivers

* No React at runtime; output identical to lucide-react for visual and DOM
  parity.
* Runtime performance (the project owner asked for the fastest option).
* Every distributed file must keep its license notices.

## Considered Options

* Inline each used icon's SVG into the generated file at generation time
* Depend on the `lucide` package at runtime and convert its icon data

## Decision Outcome

Chosen option: "Inline the SVG at generation time", chosen by the project owner
for runtime performance.

* `lucide` (ISC) is a pinned root devDependency, read only by the generator.
  `generator/src/icons/lucide.ts` resolves `IconPlaceholder lucide="ChevronRightIcon"`-style
  names, canonical names, and deprecated aliases.
* The `icons` transform replaces each `IconPlaceholder` element with a file-local component
  (for example `ChevronRightIcon`) that renders what lucide-react renders: the
  default SVG attributes, `class="lucide lucide-chevron-right"` (plus alias classes such as `lucide-more-horizontal`) merged
  with the caller's class, `aria-hidden="true"` unless the icon has children or
  an `aria-*`, `role`, or `title` prop, then the caller's props.
* Generated headers name the inlined icons and the Lucide version. The shipped
  `LICENSE-shadcnui-hono-jsx.txt` reproduces the reviewed Lucide license (ISC,
  with Feather's MIT notice) verbatim.
* Lucide licensing is gated like upstream licensing (ADR 0013):
  `ACCEPTED_ICON_LICENSE` records the reviewed license, `upstream:sync`
  snapshots the package license, and `generate` stops if it changes.
* `lucide` (root) and `lucide-react` (tests/visual) are bumped together by the
  upstream-check workflow and ignored by Dependabot.
* Unresolvable icons block classification (`icon-unresolved`). Upstream uses of
  `render` on components (element replacement, for example pagination) block
  as `render-prop` until a Hono-native equivalent exists.

### Consequences

* Good, because icons cost nothing at startup and render as static JSX.
* Good, because the visual tests assert pixel and SVG DOM parity with
  lucide-react.
* Bad, because the notice file grows by the Lucide license, and every Lucide
  license change needs review.
* Bad, because switching icon libraries means editing generated files or the
  generator, not swapping a package.

### Confirmation

`generator/tests/icons.test.ts`, `tests/render/icons.test.tsx`, and the visual
parity tests (pixels plus SVG attributes and content compared with
lucide-react).

## Pros and Cons of the Options

### Inline SVG

* Good, because it has the lowest runtime cost and no runtime dependency.
* Neutral, because each file carries the SVG of the icons it uses.

### Runtime `lucide` dependency

* Good, because the license notice travels with the npm package.
* Bad, because unbundled servers load every icon at startup and each render
  converts icon data.
