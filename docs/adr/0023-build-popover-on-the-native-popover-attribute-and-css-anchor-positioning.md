---
number: 23
title: Build Popover on the native popover attribute and CSS anchor positioning
status: accepted
date: 2026-09-26
links:
- target: 19
  kind: amends
---

# Build Popover on the native popover attribute and CSS anchor positioning

## Context and Problem Statement

Base UI's Popover opens, dismisses and positions its popup with JavaScript
(floating-ui). The native `popover` attribute opens with Invoker Commands and
provides light dismiss, Escape and focus order without scripts (Baseline
2024); CSS anchor positioning places an element next to another one and
reached every major engine in January 2026 (Chrome 125, Firefox 147,
Safari 26). Should Popover be built on them, which raises the browsers needed
for full placement?

## Decision Drivers

* No client JavaScript.
* Placement and appearance that match upstream.
* A usable result in browsers without anchor positioning.

## Considered Options

* Native popover, Invoker Commands and CSS anchor positioning
* Keep Popover unsupported until client JavaScript is decided

## Decision Outcome

Chosen option: "Native popover, Invoker Commands and CSS anchor
positioning", decided by the project owner (full placement requires Chrome
135, Firefox 147 or Safari 26.2, documented in the README and notes).

* A family (`generator/src/adapters/families/popover.ts`, `native`,
  `native-structure`): Root provides ids, Trigger renders
  `command="toggle-popover"` and `anchor-name`, Portal renders its children,
  Positioner passes `side`/`align`/`sideOffset`/`alignOffset` to the Popup,
  which is `<div popover="auto" role="dialog">` with `position-anchor`,
  `position-area`, the offsets as margins, a flip fallback
  (`position-try-fallbacks`), `data-side`/`data-align` and
  `--transform-origin`. Title and Description get the ids; Close renders
  `command="hide-popover"`. Only the parts a file uses get helpers.
* Popup classes are mapped like the dialog's (ADR 0021): open and closed
  states become `open:`/`not-open:` (which match `:popover-open`) and the
  popup animates out before it is hidden.
* Without anchor positioning the popup keeps the user agent's centering
  (`m-auto`, reset by `supports-[position-area:bottom]:m-0`).
* Not supported: controlled state, `openOnHover`, moving focus into the
  popup, updating `data-side` after a flip, and the positioner's classes.

### Consequences

* Good, because Popover works without JavaScript and matches upstream's
  placement and appearance.
* Bad, because browsers older than the versions above show the popover
  centered instead of next to its trigger.
* Neutral, because anchor positioning does not round positions to whole
  pixels like floating-ui, so text can render at sub-pixel offsets.

### Confirmation

`tests/render/popover.test.tsx` covers the wiring and placement styles;
`tests/visual/popover.spec.ts` checks that no scripts ship, the placement of
`bottom`/`center` and `right`/`start` popovers with their offsets, closing on
Escape (focus returns to the trigger), outside clicks and the trigger, that
opening one popover closes another, the exit animation, and open-state
screenshots against upstream Base UI.

## Pros and Cons of the Options

### Native popover and anchor positioning

* Good, because the platform provides dismissal, focus order and placement.
* Bad, because it depends on features that became Baseline in 2026.

### Keep unsupported

* Bad, because a commonly used component would stay unavailable.
