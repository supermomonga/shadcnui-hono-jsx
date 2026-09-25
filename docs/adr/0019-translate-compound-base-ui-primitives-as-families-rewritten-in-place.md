---
number: 19
title: Translate compound Base UI primitives as families rewritten in place
status: accepted
date: 2026-09-26
links:
- target: 17
  kind: amends
- target: 20
  kind: amendedby
- target: 21
  kind: amendedby
- target: 22
  kind: amendedby
- target: 23
  kind: amendedby
- target: 24
  kind: amendedby
---

# Translate compound Base UI primitives as families rewritten in place

## Context and Problem Statement

The primitive table (ADR 0005) maps one Base UI element to one HTML element.
Compound primitives such as Progress and Dialog are a Root plus parts
connected through React context (`<Progress.Root>`, `<Progress.Indicator>`,
`<Dialog.Trigger>`, `<Dialog.Popup>`). Several upstream components are built
on the same compound primitive: Dialog and Sheet both use Base UI's Dialog,
and AlertDialog uses its AlertDialog variant. The Dialog adapter of ADR 0017
replaced the whole upstream file with a template, which would have to be
copied for every component on the same primitive and drifts from upstream
structure. How should compound primitives be translated?

## Decision Drivers

* Mechanical translation of upstream code with few special cases.
* One rule per Base UI primitive, reused by every component built on it.
* Upstream structure, props and classes stay visible in the generated code.
* Differences from upstream must be explicit and verifiable.

## Considered Options

* Family rules that rewrite each `<Local.Part>` in place to file-local helpers
* One template adapter per upstream component (ADR 0017's approach)
* Hand-written shared primitive modules installed as a registry dependency

## Decision Outcome

Chosen option: "Family rules that rewrite each part in place".

* A family rule (`generator/src/adapters/families/`) matches a named Base UI
  import (`module`, `exportName`) under any local alias. It rewrites every
  `<Local.Part>` element to a file-local helper component
  (`<ProgressIndicatorElement>`, `<DialogPopupElement>`), rewrites
  `Local.Part.Props` and `React.ComponentProps<typeof Local.Part>` types, and
  inserts the helpers after the imports. Unknown parts fail generation.
* Helpers share state through `hono/jsx` context, like Base UI's parts, and
  render the markup Base UI renders on the server. Everything stays in the
  generated file, so items remain self-contained (ADR 0015).
* A rule declares `kind` (`intrinsic`, or `native` when behavior comes from a
  browser primitive, classified `native-adapter`), user-visible `notes`,
  `renderableParts` that accept `render` (ADR 0018; upstream `render` on them
  is classified `render-composition`), declared `omittedAttrs`, and
  `domParity`: `exact` families are compared with the upstream DOM,
  `native-structure` families replace Base UI's markup with native elements
  and are compared by pixels and behavior only.
* Progress (`intrinsic`, `exact`) computes Base UI's value, percentage,
  formatting, status attributes and ARIA values on the server.
* Dialog and AlertDialog (`native`, `native-structure`) implement ADR 0017's
  design as families: Root provides ids, Trigger and Close use Invoker
  Commands, Popup becomes `<dialog>` (`closedby="any"`, or `role="alertdialog"`
  with `closedby="closerequest"`), Title and Description get the ids, Portal
  renders its children and Backdrop renders nothing. Backdrop classes are
  moved to the popup's `::backdrop`; `data-open:` becomes `open:`,
  `data-starting-style:` becomes `starting:` (`@starting-style`), exit-state
  classes are dropped, and a reset undoes the user-agent `dialog:modal` box so
  the popup lays out like Base UI's `div`. Dialog, AlertDialog and Sheet are
  generated from their unmodified upstream sources; the Dialog template
  adapter is removed.

### Consequences

* Good, because each Base UI primitive is translated once and every upstream
  component on it (including future ones) is generated without adapters.
* Good, because the generated code keeps upstream component structure,
  props, classes and `data-slot`s.
* Bad, because each file carries the helpers of the families it uses.
* Neutral, because component adapters remain available for cases that
  families cannot express.

### Confirmation

`tests/render/{progress,dialog,alert-dialog,sheet}.test.tsx` cover the
markup. `tests/visual` compares Progress's normalized DOM and pixels with
upstream, and `tests/visual/modals.spec.ts` checks behavior (no scripts,
Invoker Commands wiring, accessible names, modality, focus, Escape, close
buttons, outside clicks) and open-state screenshots against upstream for
Dialog, AlertDialog and Sheet (right and bottom).

## Pros and Cons of the Options

### Family rules rewriting parts in place

* Good, because translation stays mechanical and shared across components.
* Bad, because helpers need care to match Base UI's server output.

### One template adapter per component

* Bad, because Dialog, AlertDialog and Sheet would need three templates that
  duplicate behavior and drift from upstream.

### Shared primitive modules as a registry dependency

* Bad, because users would install and update an extra item, and ADR 0015
  keeps each item self-contained.

## More Information

Supersedes the template-based implementation described in ADR 0017; that
ADR's native `<dialog>` design, browser requirements and notes still apply.
