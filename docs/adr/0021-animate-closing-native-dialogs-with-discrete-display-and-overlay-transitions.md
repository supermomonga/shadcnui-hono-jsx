---
number: 21
title: Animate closing native dialogs with discrete display and overlay transitions
status: accepted
date: 2026-09-26
links:
- target: 19
  kind: amends
- target: 17
  kind: amends
---

# Animate closing native dialogs with discrete display and overlay transitions

## Context and Problem Statement

ADR 0017 and ADR 0019 dropped the exit animations of Dialog, AlertDialog and
Sheet: when a native `<dialog>` closes, the browser removes it from the top
layer and hides it (`display: none`) at once, so upstream's closed-state
classes (`data-closed:animate-out`, `data-ending-style:opacity-0`) never
render. CSS can now delay both changes: `display` and `overlay` transition
discretely with `transition-behavior: allow-discrete` (Chrome 117, Firefox
129, Safari 17.4), but only Chromium supports transitioning `overlay`, which
keeps the element and its `::backdrop` in the top layer. Should closing
animate like upstream?

## Decision Drivers

* Visual parity with upstream, including motion.
* No client JavaScript.
* Closing must work in every supported browser.

## Considered Options

* Map closed and ending states to `not-open:` and transition `display` and
  `overlay` discretely
* Keep closing immediate

## Decision Outcome

Chosen option: "Map closed and ending states to `not-open:` and transition
`display` and `overlay` discretely", requested by the project owner.

* `data-closed:` and `data-ending-style:` classes become `not-open:` (the
  state after `open` is removed), on the popup and on its `::backdrop`.
* The popup gets `transition-discrete`. When upstream sets Tailwind's
  `transition` (which lists `display` and `overlay`), that is kept (Sheet);
  when it sets no transition, `transition-[display,overlay]` is added so the
  popup stays rendered for its keyframe exit animation (Dialog, AlertDialog),
  using upstream's duration. Any other transition utility fails generation,
  so a new upstream shape gets a deliberate rule.
* In Chromium the popup and backdrop animate out in the top layer. In Firefox
  and Safari the popup still animates, but it leaves the top layer when it
  closes, so the backdrop disappears at once; the family notes say so.

### Consequences

* Good, because closing matches upstream's motion in Chromium and degrades to
  an animation without backdrop elsewhere; closing itself never depends on it.
* Bad, because the closing popup is no longer modal while it animates (the
  page is interactive again for the animation's duration, as in Base UI).

### Confirmation

`tests/visual/modals.spec.ts` closes each modal and checks that it is no
longer open but still rendered with running animations, then hidden;
`generator/tests/adapters/families-dialog.test.ts` covers the class mapping
and the failure on unsupported transition utilities.

## Pros and Cons of the Options

### Discrete display and overlay transitions

* Good, because it is pure CSS on the classes upstream already provides.
* Bad, because the full effect is Chromium-only until `overlay` ships
  elsewhere.

### Keep closing immediate

* Good, because every browser behaves the same.
* Bad, because closing looks abrupt compared with upstream.
