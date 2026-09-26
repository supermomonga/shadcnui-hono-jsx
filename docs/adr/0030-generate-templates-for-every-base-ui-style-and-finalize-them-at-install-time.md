---
number: 30
title: Generate templates for every Base UI style and finalize them at install time
status: proposed
date: 2026-09-26
links:
- target: 3
  kind: amends
- target: 4
  kind: amends
- target: 14
  kind: amends
- target: 28
  kind: amends
---

# Generate templates for every Base UI style and finalize them at install time

## Context and Problem Statement

A preset (ADR 0029) changes component source in four ways: the style (eight
Base UI styles: nova, vega, maia, lyra, mira, luma, sera, rhea), the icon
library (five), the menu color (four) and RTL, 320 variants of a component.
shadcn/ui builds one registry per style, with the style's classes resolved
but install-time markers left in: `IconPlaceholder` elements that name the
icon of every library, and the `cn-menu-target`, `cn-menu-translucent`,
`cn-rtl-flip` and `cn-font-heading` classes. The shadcn CLI resolves them
from `components.json` (`transformIcons`, `transformMenu`, `transformRtl`,
`transformFont`, `transformCleanup`). This project translates only
`base-nova` and resolves the markers at generation time with fixed values.
How should it produce components for any preset?

Measured on 2026-09-26 over the 63 `registry:ui` items of all eight styles
(434 files):

* With string literals masked, every style's TypeScript syntax trees equal
  base-nova's. Only strings differ: classes in `className`, `cn()` and
  `cva()` (1,351 strings), and the `@/registry/base-<style>/` import paths
  (210).
* Compared with base-nova, no style adds Base UI state attributes or `cn-*`
  markers. Some add selectors on `data-slot`, `data-align`, `data-variant`,
  `data-size`, `:has()` and `peer`, which rely on the upstream DOM contract
  that ADR 0007 keeps.
* Adapters read classes from upstream instead of hard-coding them; the only
  class literal in an adapter (sidebar) is the same in every style.

## Decision Drivers

* Every combination of preset options must be installable.
* Users receive output that CI verified (ADR 0003); upstream owns design.
* The install step stays small and deterministic.
* Repository and package size stay reasonable.

## Considered Options

* Translate every style into templates that keep the install-time markers,
  and finalize them at install time
* Generate and commit every combination
* Ship the generator and translate on the user's machine

## Decision Outcome

Chosen option: "Templates per style, finalized at install time", because it
splits the work the way shadcn/ui does (built per style, resolved at install),
keeps every translated line committed and reviewed, and leaves a small,
testable step for install time.

* `generator.config.ts` lists the Base UI styles instead of one, and
  `upstream:sync` snapshots each into `upstream/base-<style>/` (amends
  ADR 0004). `/init` responses are snapshotted only for the presets that tests
  use; users' themes come from `/init` at install time (ADR 0029).
* A component is supported when it translates in every style. `analyze` and
  `compatibility.json` report per component, with the blocking reasons of
  each style.
* `generate` translates every style into templates in the CLI package, for
  example `cli/templates/<style>/<name>.tsx`, committed and freshness-checked
  (amends ADR 0003). Templates are the final Hono JSX except for the
  install-time markers: icon references (ADR 0031), `cn-menu-target`,
  `cn-menu-translucent` and `cn-rtl-flip`. `cn-font-heading` is still
  resolved to `font-heading` at generation time, because the theme always
  defines `--font-heading`. `components/ui/` and `styles/shadcn/` are no
  longer written in this repository; examples and tests install through the
  CLI or call finalize.
* `finalize(template, { iconLibrary, menuColor, rtl })` is a pure function
  shared by the CLI, the generator's tests and the visual tests. It
  reproduces the shadcn CLI's install-time transforms on Hono templates:
  * icons: inserts the chosen library's file-local icon components
    (ADR 0031);
  * menu color: `cn-menu-target` becomes `dark` for the inverted colors,
    `cn-menu-translucent` merges upstream's translucent classes with
    tailwind-merge for the translucent ones, as the shadcn CLI does, and both
    are removed otherwise;
  * RTL: physical classes become logical ones, `cn-rtl-flip` becomes
    `rtl:rotate-180`, and `side` values become `inline-start` and
    `inline-end`, following `transformRtl`.

  Menu accent, pointer, colors, radius and fonts only affect CSS and are
  handled by the theme (ADR 0029).
* Lite alternatives follow presets (amends ADR 0028). Their sources refer to
  classes of upstream parts, such as the slot of `input-otp`, instead of
  copying base-nova's, and the generator resolves those references per style.
  The record of base items covers every style.
* Visual parity (amends ADR 0014) runs for each style with default options,
  and for base-nova with each other icon library, menu color, menu accent,
  RTL and pointer. `tests/visual` resolves upstream React's markers the way
  the shadcn CLI does, and installs the React icon packages there only.

### Consequences

* Good, because any preset can be installed, and every translated line is in
  a reviewed diff.
* Good, because a drift between finalize and the shadcn CLI's transforms is
  detected (see Confirmation).
* Bad, because the snapshot and the generated output grow eightfold (about
  500 upstream files and 480 templates), and upstream sync pull requests get
  larger.
* Bad, because finalize re-implements part of the shadcn CLI and has to
  follow its changes.
* Bad, because lite alternatives need references into upstream parts instead
  of plain classes.
* Neutral, because only a sample of combinations is compared visually; the
  others rely on finalize's tests.

### Confirmation

Unit tests run finalize on every template with every option value. A
differential test applies the pinned `shadcn` package's own transforms
(`shadcn/utils`) to upstream React source and asserts that the resulting
class strings equal finalize's for every style and option value, so a change
in the shadcn CLI fails CI. `bun run generate --check` covers the templates,
and the visual matrix above covers rendering.

## Pros and Cons of the Options

### Templates per style, finalized at install time

* Good, because output varies only at a few well-defined markers.
* Bad, because part of the output is produced outside the generator.

### Every combination committed

* Good, because installing only copies files.
* Bad, because 320 variants per component (about 19,000 files) cannot be
  reviewed.

### Translate on the user's machine

* Good, because nothing is pre-generated.
* Bad, because users would receive untested output, the CLI would carry
  ts-morph and the generator, and upstream license changes could not be gated
  (ADR 0013).
