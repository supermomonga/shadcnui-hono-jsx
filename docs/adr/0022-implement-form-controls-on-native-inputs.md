---
number: 22
title: Implement form controls on native inputs
status: accepted
date: 2026-09-26
links:
- target: 19
  kind: amends
---

# Implement form controls on native inputs

## Context and Problem Statement

Base UI renders Checkbox, Switch and Radio as a styled `span` with
`role="checkbox"` (or `switch`, `radio`) plus a hidden `<input>` next to it,
and keeps both in sync with JavaScript; Toggle is a `<button aria-pressed>`
toggled by JavaScript. This project ships no client JavaScript. Native
`<input type="checkbox">` and `<input type="radio">` check, handle the
keyboard, connect to labels and submit forms without scripts, but their DOM
differs from Base UI's. Should the form controls be built on native inputs?

## Decision Drivers

* No client JavaScript; forms that work without scripts.
* Visual parity with upstream in light and dark mode.
* Mechanical translation through families (ADR 0019).
* Differences from upstream must be explicit and verifiable.

## Considered Options

* Native inputs inside upstream's styled roots, with state classes mapped
* Keep the form controls unsupported until client JavaScript is decided

## Decision Outcome

Chosen option: "Native inputs inside upstream's styled roots", decided by the
project owner.

* Families in `generator/src/adapters/families/controls.ts` (`native`,
  `native-structure`). Checkbox, Switch and Radio keep the styled `span` root
  and its parts (indicator, thumb); a real input (`role="switch"` for
  Switch) is the root's first child and receives `id`, `name`, `value`,
  `disabled`, `required`, `form` and `aria-*`, so `<Label for>` works. The
  input takes over upstream's enlarged `::after` hit area and parts get
  `pointer-events-none`, so clicks always reach it.
* Base UI state on the root becomes `:has()` on the input (`data-checked:` to
  `has-checked:`, `focus-visible:` to `has-focus-visible:`,
  `aria-invalid:` to `has-aria-invalid:`); state on parts becomes `peer-*`
  (the input precedes them); parts Base UI mounts only while checked get
  `peer-not-checked:hidden`. `disabled:` is kept on `span` roots, where it
  never matched upstream either.
* RadioGroup is a `div role="radiogroup"` whose radios share a `name`
  (generated unless given), so arrow keys move the selection natively.
* Toggle is a `label` around a visually hidden checkbox (`aria-pressed:` and
  `disabled:` classes map to `has-checked:` and `has-disabled:`, because its
  Base UI root was a native button). ToggleGroup items are radios sharing a
  `name`, or checkboxes with `multiple`.
* Other components that react to Base UI control state (Field's choice card
  uses `has-data-checked:`) read `:checked` instead; the rewrite is declared
  (`control-state-class`) and applied to the upstream DOM before the visual
  tests compare it. React context (`createContext`/`useContext`, used by
  ToggleGroup) is translated to `hono/jsx`'s identical API by a generic step.
* Controlled state and change callbacks (`checked`/`onCheckedChange`,
  `value`/`onValueChange`, `onPressedChange`), `indeterminate`, `readOnly`
  and `render` are not supported; family notes say so.

### Consequences

* Good, because the controls work and submit with forms without JavaScript,
  and keyboard and label behavior are the browser's.
* Good, because upstream classes and structure are kept and pixels match.
* Bad, because a toggle is announced as a checkbox, Enter does not press it
  (Space does), and the pressed item of a single-selection toggle group
  cannot be released by pressing it again.
* Neutral, because the DOM differs from Base UI's (an input inside the root
  instead of next to it), so these components are compared by pixels.

### Confirmation

`tests/render/controls.test.tsx` covers attribute routing, names and class
mapping; `generator/tests/adapters/families-controls.test.ts` the mappings;
`tests/visual` compares every state (checked, disabled, invalid, sizes,
variants, a Field choice card) with upstream; `tests/visual/controls.spec.ts`
checks clicking, labels, Space, arrow keys in radio groups, the focus ring,
disabled controls, toggle groups and the choice card highlight in Chromium.

## Pros and Cons of the Options

### Native inputs

* Good, because it is the platform's accessible control.
* Bad, because the DOM and a few interactions differ from Base UI.

### Keep unsupported

* Bad, because forms would have no checkbox, switch, radio or toggle.
