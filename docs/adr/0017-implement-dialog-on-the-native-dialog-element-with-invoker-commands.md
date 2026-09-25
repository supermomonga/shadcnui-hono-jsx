---
number: 17
title: Implement Dialog on the native dialog element with Invoker Commands
status: accepted
date: 2026-09-25
links:
- target: 7
  kind: amends
- target: 18
  kind: amendedby
- target: 19
  kind: amendedby
- target: 21
  kind: amendedby
---


# Implement Dialog on the native dialog element with Invoker Commands

## Context and Problem Statement

Dialog is the first interactive component (specification section 41). Upstream
builds it from Base UI's React dialog: open state, focus management, Escape,
outside clicks, and portals all run in client JavaScript. Generated components
must stay React-free and ship as little JavaScript as possible. The project
owner decided to target Baseline browsers and ship no JavaScript, dropping
older browsers.

Findings (2026-09-25): Invoker Commands (`command` and `commandfor` on
`<button>`) are Baseline since 2025-12 (Chrome 135, Firefox 144, Safari 26.2)
and can call `showModal()` and `close()` on a `<dialog>` declaratively.
`closedby="any"` (light dismiss) is not Baseline (no Safari). hono/jsx supports
`createContext`, `useContext`, and `useId` during server rendering.

## Decision Drivers

* No React and no client JavaScript.
* Accessibility and keyboard behavior equal or better than upstream.
* Keep upstream in charge of the design.

## Considered Options

* Native `<dialog>` with Invoker Commands, structure owned by a component
  adapter, classes read from upstream
* A small client script (hono/jsx/dom island or vanilla) reproducing Base UI
* Keep Dialog unsupported

## Decision Outcome

Chosen option: "Native `<dialog>` with Invoker Commands".

* `generator/src/adapters/components/dialog.ts` is a `native` component adapter
  (classification `native-adapter`, mode `adapter`). It replaces the upstream
  structure with a template and reads every class string and both close
  buttons (their Button props and children) from the upstream source; generation
  fails if upstream no longer has that shape.
* `Dialog` provides ids through context (`id` prop or `useId`); `DialogTrigger`
  renders `command="show-modal" commandfor`; `DialogClose` and the close
  buttons render `command="close"`; `DialogContent` renders
  `<dialog closedby="any" aria-labelledby aria-describedby>`; `DialogTitle` and
  `DialogDescription` render `h2` and `p` with the matching ids; `DialogPortal`
  and `DialogOverlay` render nothing (top layer, `::backdrop`).
* Upstream `data-open:` classes become `open:`, `data-closed:` classes are
  dropped (closing is immediate), `not-open:hidden` keeps utilities such as
  `grid` from overriding the closed state, and overlay classes move to
  `backdrop:`.
* Unsupported and documented in the manifest notes: controlled state (`open`,
  `defaultOpen`, `onOpenChange`), `render`, `aria-expanded` on the trigger,
  exit animations, and outside-click closing where `closedby` is missing. Focus
  follows the native modal: Tab may reach the browser UI after the last
  control (page content stays inert), whereas Base UI keeps focus inside.

### Consequences

* Good, because Dialog ships no JavaScript and relies on the browser's modal
  semantics (inert background, focus, Escape, return focus).
* Good, because the open dialog matches upstream pixel for pixel in the tests.
* Bad, because browsers older than the Baseline versions cannot open dialogs.
* Bad, because the adapter must be updated when upstream restructures Dialog.

### Confirmation

`tests/visual/dialog.spec.ts` (Playwright, Chromium) checks that the page has
no scripts, the trigger wiring, the accessible name and description, modality,
initial focus, that focus never reaches page content, Escape with focus return,
both close buttons, outside clicks, and a screenshot of the open dialog against
upstream Base UI rendered in the browser. `tests/render/dialog.test.tsx` and
`generator/tests/adapters/dialog.test.ts` cover the markup and class mapping.

## Pros and Cons of the Options

### Native dialog with Invoker Commands

* Good, because it is declarative and uses platform accessibility.
* Neutral, because it depends on Baseline 2025 features.

### Client script

* Good, because it could support older browsers and controlled state.
* Bad, because it ships JavaScript, which the owner ruled out for now.

### Unsupported

* Bad, because Dialog is the milestone that proves interactive components.
