---
number: 18
title: Support Base UI render props on the server and omit client-only button semantics
status: accepted
date: 2026-09-25
links:
- target: 7
  kind: amends
- target: 17
  kind: amends
---


# Support Base UI render props on the server and omit client-only button semantics

## Context and Problem Statement

ADR 0007 omitted Base UI's `render` prop (element replacement). Upstream
base-nova uses it inside components (pagination renders
`<Button render={<a />}>`, dialog closes render `<Button />`) and its examples
use it for triggers and links, so each such component would need its own
adapter. Base UI also adds button semantics to non-button render targets
(`role="button"`, `tabindex="0"`) and implements the matching keyboard behavior
in client JavaScript, which this project does not ship.

## Decision Drivers

* Mechanical translation of upstream code with few special cases.
* Familiar shadcn/ui (Base UI) API.
* Accessibility and semantic HTML over DOM-level parity when parity would
  promise behavior that is not shipped.
* Differences from upstream must be explicit and verifiable.

## Considered Options

* Support `render` generically on the server, and omit attributes that promise
  client-side behavior (declared per primitive)
* Support `render` and reproduce every Base UI attribute
* Keep `render` unsupported and write per-component adapters

## Decision Outcome

Chosen option: "Support `render` generically and omit declared client-only
attributes", decided by the project owner.

* Components whose upstream props include Base UI's `render` (useRender
  components, and primitives marked `renderable` in
  `generator/src/adapters/primitives/base-ui.ts`: Button, Separator; the
  Dialog adapter's DialogTrigger and DialogClose) accept
  `render?: RenderProp` (an element or a function). A file-local
  `renderElement` helper merges props like Base UI's `mergeProps`: the render
  element's props win, classes are joined (render element's first), styles
  merge, children fall back to the component's, and `type` is dropped for
  targets other than `button` and `input`. Plain HTML components keep
  `render?: never`.
* Base UI-only props of primitives (`nativeButton`, `focusableWhenDisabled`)
  are consumed so they never leak into the HTML.
* Upstream code that passes `render` to a generated sibling component is
  classified as `render-composition` and translated as-is (pagination).
* The primitive table declares `omittedAttrs` with reasons: Button omits
  `tabindex="0"`, and on non-button targets `role="button"` and `type`; Input
  omits Base UI's generated `id`. Links rendered through Button therefore
  stay links. The visual parity tests compare the full DOM with upstream and
  remove exactly these declared attributes from the upstream side.

### Consequences

* Good, because pagination is generated unchanged and future `render` uses
  need no adapters.
* Good, because every intentional DOM difference is declared once and checked
  mechanically.
* Bad, because generated files that support `render` carry a small helper.
* Neutral, because `render` works on the server only; function render props
  receive the component's props like Base UI.

### Confirmation

`tests/render/render-prop.test.tsx` covers merging, children, functions, and
composition; `tests/visual` compares pixels, SVG, and the normalized DOM with
upstream for every case, including pagination and `Button render={<a />}`.

## Pros and Cons of the Options

### Generic `render` with declared omissions

* Good, because it keeps translation mechanical and links semantic.

### Reproduce every Base UI attribute

* Bad, because `role="button"` on a link without the client-side Space/Enter
  handling is an accessibility defect this project would introduce.

### Per-component adapters

* Bad, because every upstream use of `render` would need its own special case.
