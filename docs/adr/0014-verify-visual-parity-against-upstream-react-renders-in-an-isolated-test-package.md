---
number: 14
title: Verify visual parity against upstream React renders in an isolated test package
status: accepted
date: 2026-09-25
---


# Verify visual parity against upstream React renders in an isolated test package

## Context and Problem Statement

The compatibility manifest reported every component's visual parity as
`unverified`. The specification (section 32) asks for visual regression tests
that eventually compare equivalent upstream shadcn/ui and Hono versions using
the same theme. Upstream components are React, which generated components must
never depend on. How can parity be checked automatically without letting React
into the library?

## Decision Drivers

* Compare against the actual upstream implementation, not hand-made golden
  screenshots that drift.
* Keep React out of the root package, generated components, registry items,
  and examples.
* Deterministic, fast checks that fail on small class or markup differences.

## Considered Options

* Render upstream React components from the snapshot and generated Hono
  components from the same case data, share one Tailwind build, and compare
  screenshots with Playwright, in a separate `tests/visual` package
* Store golden screenshots of the Hono components only
* Compare against screenshots of ui.shadcn.com

## Decision Outcome

Chosen option: "Render both from the same case data in `tests/visual`".

* `tests/visual/cases.ts` holds the cases as plain data (element type, props,
  children). `render.ts` renders each case with the generated components and
  with the upstream React sources from `upstream/` (after the shadcn CLI's
  install-time `cn-*` rewrite), in light and dark mode, into two pages that
  share one Tailwind CSS build of the generated theme.
* `parity.spec.ts` (Playwright, Chromium) screenshots every case on both pages
  and fails if sizes differ or more than 0.1% of pixels differ; diffs are
  attached to the report and uploaded by CI.
* `tests/visual` is its own package (React, Base UI, Playwright) with its own
  lockfile. It is not a workspace member, the root `tsconfig.json` excludes it,
  and the React-free policy still applies everywhere else.
* The manifest marks a generated component's visual parity `verified` when a
  case covers it, and a test requires a case for every generated component. The
  `visual` CI job enforces the result.
* Bun applies the JSX import source of the working directory's tsconfig, so the
  harness defaults to `hono/jsx` and each upstream file gets a
  `@jsxImportSource react` pragma.

### Consequences

* Good, because upstream changes that alter appearance, and translation bugs
  that drop or change classes, fail CI with a visual diff.
* Good, because it verified all current components against upstream in light
  and dark mode, including Base UI primitives' rendered attributes.
* Bad, because the comparison uses the generated theme for both sides, so it
  does not check the theme builder against the shadcn CLI's own stylesheet.
* Bad, because CI downloads Chromium and a second dependency tree.

### Confirmation

`bun run test:visual` locally and the `visual` CI job. Injecting a one-class
difference into a rendered case makes the test fail (checked when the harness
was added).

## Pros and Cons of the Options

### Render both implementations

* Good, because the reference is always the current upstream snapshot.

### Golden screenshots of Hono output

* Bad, because goldens would be generated from the code under test and would
  have to be refreshed by hand whenever upstream changes.

### Screenshots of ui.shadcn.com

* Bad, because the site is not pinned to the snapshot and adds network and
  layout noise.
