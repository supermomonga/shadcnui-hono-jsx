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
* Edits to an installed component's TSX also apply in the browser.

## Considered Options

* Optional hand-written vanilla modules, one per behavior, installed as
  files and loaded with `<script type="module">`
* The same code rendered inline by components
* Client components with `hono/jsx/dom` (as HonoX islands or mounted by our
  own scripts)
* No client JavaScript

## Decision Outcome

Chosen option: "Optional hand-written vanilla modules", decided by the
project owner.

* Browser primitives first; a script adds only what the browser lacks.
  Components render complete, accessible markup with Base UI's state
  attributes (for example `data-active`, `aria-selected`), and a missing
  script leaves the server-rendered state usable.
* Scripts are hand-written ES modules in `public/shadcn/` (JSDoc-typed and
  type-checked), not generated: Base UI's behavior is React code. Behaviors
  listen on the document, never on each component, and find components by
  their `data-slot` attributes, so there is no per-component initialization
  and markup inserted later works too. Behaviors that keep state per element
  (ScrollArea's observers, Toast's timers) set up the elements on the page
  when they load and watch the document for inserted ones. A shared
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
* `hono/jsx/dom` was reconsidered on 2026-09-26. The project owner accepts
  it as a dependency (it is part of `hono`, small, and works in plain Hono),
  but the existing behaviors stay vanilla modules for the reasons under its
  option below. A later component may use it where the browser renders a
  region itself (for example a full Calendar port rendering its day grid)
  if the region contains no server-rendered children of the app, deriving
  the DOM from state replaces synchronization code a vanilla module would
  need, and no DOM is updated both by a vanilla module and by `hono/jsx/dom`.
  The first such component gets its own ADR, which decides how its code
  reaches apps (prebuilt or built by the app), how edits to the installed
  TSX reach the markup rendered in the browser, and how a mounted region is
  cleaned up when a partial update removes it.

### Consequences

* Good, because the remaining components become possible without a
  framework runtime, and scripts are cached and CSP-friendly.
* Bad, because behavior code is maintained by hand and must follow Base UI's
  behavior, checked only by tests.
* Bad, because apps need one more setup step (serve the directory, add the
  script tags).

### Confirmation

`tests/visual/tabs.spec.ts` compares tabs behavior step by step with Base UI
and checks the page without the script; `tests/visual/toast.spec.ts` and
`tests/visual/sidebar.spec.ts` check markup swapped in after the scripts
loaded; `tests/registry` installs the scripts byte for byte; `examples/hono`
and `examples/honox` serve and load them in their tests.

## Pros and Cons of the Options

### Vanilla modules as files

* Good, because they are small, cacheable and independent of the framework.
* Good, because they keep the server-rendered DOM and take new markup from
  it (Toast and Combobox copy templates the installed TSX renders).
* Bad, because apps must serve and include them.

### Inline scripts

* Good, because no setup is needed.
* Bad, because they repeat on every page and instance and need CSP nonces.

### Client components with `hono/jsx/dom`

* Good, because deriving markup from state suits a region the browser
  renders itself (a calendar's day grid, results that arrive while typing).
* Neutral, because `hono/jsx/dom` is part of `hono` and small, and plain Hono
  apps can mount it too; HonoX islands are one way to mount it, not the only
  one.
* Bad, because the first render replaces the server-rendered DOM (in Hono
  4.13.9 `hydrateRoot` is `createRoot().render()`, which replaces the
  container's children): input and focus from before the script loaded are
  lost, and compound components (Tabs, menus, Sidebar) would re-render the
  app's server-rendered children in the browser.
* Bad, because markup rendered in the browser comes from shipped JavaScript,
  so edits to the installed TSX do not reach it unless the app builds its
  own client code.
* Bad, because keyboard, focus, pointer and measuring behavior is still
  written by hand (Base UI cannot be imported), and a mounted region needs
  cleanup when a partial update removes it.

### No client JavaScript

* Bad, because tabs, menus, tooltips and toasts would stay unavailable.
