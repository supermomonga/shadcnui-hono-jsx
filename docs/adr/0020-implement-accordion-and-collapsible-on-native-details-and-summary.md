---
number: 20
title: Implement Accordion and Collapsible on native details and summary
status: accepted
date: 2026-09-26
links:
- target: 19
  kind: amends
---

# Implement Accordion and Collapsible on native details and summary

## Context and Problem Statement

Base UI's Accordion and Collapsible toggle panels with client state, measure
panel heights for animations and wire `aria-expanded`/`aria-controls` in
JavaScript. This project ships no client JavaScript so far, and Dialog already
maps onto a browser primitive (ADR 0017). The native disclosure,
`<details>`/`<summary>`, toggles without scripts, is keyboard accessible,
exposes the expanded state to assistive technology, supports exclusive groups
through the `name` attribute (Baseline 2024) and reveals closed content for
find-in-page. It requires `<summary>` to be the first child of `<details>`,
which does not match Base UI's structure (`h3 > button` headers, a trigger
anywhere inside a collapsible). Should these components be built on the
native disclosure?

## Decision Drivers

* No client JavaScript; browser-provided accessibility.
* Mechanical translation through families (ADR 0019).
* Visual parity with upstream in light and dark mode.
* Differences from upstream must be explicit and verifiable.

## Considered Options

* Native `<details>`/`<summary>` families with declared structural differences
* A small client script reproducing Base UI's markup and behavior
* A CSS checkbox toggle (`<input type="checkbox">` with a `<label>` trigger)
* Keep both components unsupported until client JavaScript is decided

## Decision Outcome

Chosen option: "Native `<details>`/`<summary>` families", within the owner's
direction to implement every component that works without JavaScript.

* Families in `generator/src/adapters/families/details.ts` (`native`,
  `domParity: native-structure`). Accordion: the item is a `<details>` that
  shares a generated `name` with its siblings unless `multiple` is set,
  `defaultValue` opens items by `value`, the trigger is the `<summary>` with
  `id`/`aria-controls`, the header element is dropped (a heading cannot wrap
  the summary), and the panel is `role="region"` labelled by the trigger.
  Disabled items render `aria-disabled="true"` and `tabindex="-1"`, and
  upstream's `aria-disabled:pointer-events-none` blocks clicks. Collapsible:
  the root is the `<details>`, the trigger the `<summary>`, the panel a `div`.
* Classes are mapped, not rewritten by hand: the trigger's expanded state
  (`aria-expanded`, `data-panel-open`, and their `group-*` forms) becomes the
  parent `<details open>` (`[[open]>&]`, `group-[[open]>&]/name`), item state
  becomes `open:`/`not-open:`, and panel open/close animations are dropped
  (Base UI measures the panel with JavaScript). A reset hides the disclosure
  marker.
* Collapsible's trigger must be its first child, and every other child
  collapses; rendering throws a descriptive error otherwise. Its trigger does
  not support `render` (it must stay a `<summary>`); style it with `class`.
* Controlled state (`value`/`onValueChange`, `open`/`onOpenChange`) and
  arrow-key navigation between accordion items are not supported. Each
  family's notes list these differences in the manifest and README.
* Visual tests compare pixels and icons for native-structure cases and skip
  the DOM comparison, which remains in force for `exact` families.

### Consequences

* Good, because both components work without JavaScript and get native
  keyboard, assistive technology and find-in-page support.
* Good, because upstream sources are translated unchanged through families.
* Bad, because the DOM differs from Base UI's (no `h3`, `<details>` items), and
  Collapsible layouts with the trigger nested inside other elements must be
  restructured.
* Bad, because opening and closing are not animated.

### Confirmation

`tests/render/{accordion,collapsible}.test.tsx` cover the markup and the
first-child check; `generator/tests/adapters/families-details.test.ts` the
class mapping; `tests/visual` compares screenshots of open, closed, multiple
and disabled states with upstream; `tests/visual/disclosure.spec.ts` checks
that no scripts ship, exclusive and multiple opening, keyboard toggling, the
chevron swap, labelled panels and disabled items in Chromium.

## Pros and Cons of the Options

### Native details and summary

* Good, because behavior and accessibility come from the platform.
* Bad, because the structure is fixed by `<details>`.

### Client script

* Good, because Base UI's markup and animations could be kept.
* Bad, because it introduces client JavaScript, which is still undecided for
  this project.

### Checkbox toggle

* Bad, because a `<label>` trigger is not focusable and does not expose an
  expanded state.

### Keep unsupported

* Bad, because two commonly used components would stay unavailable although a
  platform primitive covers them.
