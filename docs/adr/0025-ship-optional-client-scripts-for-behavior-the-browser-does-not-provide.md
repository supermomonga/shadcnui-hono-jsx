---
number: 25
title: Ship optional client scripts for behavior the browser does not provide
status: accepted
date: 2026-09-26
links:
- target: 19
  kind: amends
---

# Ship optional client scripts for behavior the browser does not provide

## Context and Problem Statement

Components so far ship no JavaScript: they are built on browser primitives
(`<dialog>`, `popover`, `<details>`, native inputs, the customizable
`<select>`). The remaining Base UI components need behavior no browser
provides: keyboard patterns for tabs and menus, hover intent for tooltips,
dynamic toasts, range sliders that keep their thumbs ordered, swipe gestures.
Base UI implements them in React, which this project cannot ship. Should
components get client scripts, and how should the scripts reach an app?

## Decision Drivers

* Runtime performance and a small, cacheable payload.
* Works in plain Hono and HonoX, with htmx-style partial updates.
* Upstream owns design: markup and classes stay generated from upstream.
* Content stays usable when a script is missing or fails.
* Content Security Policy without `unsafe-inline`.

## Considered Options

* Optional hand-written vanilla modules, one per behavior, installed as
  files and loaded with `<script type="module">`
* The same code rendered inline by components
* HonoX islands (`hono/jsx/dom`)
* No client JavaScript

## Decision Outcome

Chosen option: "Optional hand-written vanilla modules", decided by the
project owner.

* Browser primitives first; a script adds only what the browser lacks.
  Components render complete, accessible markup with Base UI's state
  attributes (for example `data-active`, `aria-selected`), and a missing
  script leaves the server-rendered state usable.
* Scripts are hand-written ES modules in `public/shadcn/` (JSDoc-typed and
  type-checked), not generated: Base UI's behavior is React code. Each
  behavior attaches one delegated listener per event type to the document
  and finds components by their `data-slot` attributes, so there is no
  per-component initialization and markup inserted later works too. A shared
  `core.js` holds helpers.
* A family declares `kind: "script"` and `behaviors` (classified
  `script-adapter`). Registry items then also install `core.js` and the
  behavior files at `~/public/shadcn/`; the item's docs, the component's
  header and the README table name the script to load, and the manifest
  records `clientJs: "required"`. Apps serve `public/shadcn/` statically and
  add `<script type="module" src="/shadcn/<name>.js">`; HonoX serves
  `public/` by default. No dependencies are added.
* Behavior is verified against upstream: `tests/visual` serves the pages over
  HTTP, runs the same interaction steps on the generated component with its
  script and on Base UI, and requires equal states and matching screenshots.
* Tabs is the first script family.

### Consequences

* Good, because the remaining components become possible without a
  framework runtime, and scripts are cached and CSP-friendly.
* Bad, because behavior code is maintained by hand and must follow Base UI's
  behavior, checked only by tests.
* Bad, because apps need one more setup step (serve the directory, add the
  script tags).

### Confirmation

`tests/visual/tabs.spec.ts` compares tabs behavior step by step with Base UI
and checks the page without the script; `tests/registry` installs the
scripts byte for byte; `examples/hono` and `examples/honox` serve and load
them in their tests.

## Pros and Cons of the Options

### Vanilla modules as files

* Good, because they are small, cacheable and independent of the framework.
* Bad, because apps must serve and include them.

### Inline scripts

* Good, because no setup is needed.
* Bad, because they repeat on every page and instance and need CSP nonces.

### HonoX islands

* Bad, because plain Hono apps cannot use them and they add a runtime.

### No client JavaScript

* Bad, because tabs, menus, tooltips and toasts would stay unavailable.
