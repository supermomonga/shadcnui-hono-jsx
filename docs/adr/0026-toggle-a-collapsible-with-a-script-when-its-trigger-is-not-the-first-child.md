---
number: 26
title: Toggle a Collapsible with a script when its trigger is not the first child
status: accepted
date: 2026-09-26
links:
- target: 20
  kind: amends
---

# Toggle a Collapsible with a script when its trigger is not the first child

## Context and Problem Statement

ADR 0020 builds Collapsible on `<details>`/`<summary>`. That needs no
JavaScript, but `CollapsibleTrigger` has to be the first child of
`Collapsible`, and rendering throws otherwise. Common layouts put the trigger
inside a header next to a title (shadcn/ui's own example does), and every
non-summary child of `<details>` is hidden while it is closed, so the header
cannot live inside the disclosure either. ADR 0025 now allows optional client
scripts for behavior the browser does not provide. How should a Collapsible
whose trigger is elsewhere be rendered?

## Decision Drivers

* Keep the script-free `<details>` rendering where it works.
* Support upstream's layouts without a type or render error.
* Follow Base UI's markup and state attributes where a script is used.

## Considered Options

* Keep the first-child rule and throw otherwise (ADR 0020 as is)
* Choose per instance: `<details>` when the trigger is the first child, otherwise Base UI's structure toggled by `/shadcn/collapsible.js`
* Always use Base UI's structure with the script

## Decision Outcome

Chosen option: "Choose per instance", because it keeps the script-free
rendering for the common case and removes the error for the others. The root
checks its first child at render time, as it did for the error. When the
trigger is elsewhere, the root is a `<div>`, the trigger is a `<button>` with
`aria-expanded`, `aria-controls` (while open) and `data-panel-open`, and the
panel is `hidden` while closed. The root and panel carry `data-open` or
`data-closed`, like Base UI, and the client script toggles them.

### Consequences

* Good, because upstream's header-with-trigger layout works.
* Good, because collapsibles with the trigger first still ship no JavaScript.
* Bad, because the two renderings differ: state attributes and a `<button>`
  exist only in the scripted one, and a closed panel is not found by
  find-in-page there. `hidden="until-found"` was rejected because the closed
  panel's own border and padding stay visible.
* Bad, because without the script a trigger that is not first does nothing.
* Neutral, because Collapsible is now classified `script-adapter` and its
  registry item ships `/shadcn/collapsible.js`.

### Confirmation

`tests/render/collapsible.test.tsx` covers both renderings, and
`tests/visual/disclosure.spec.ts` compares the scripted one with Base UI step
by step.

## More Information

Amends ADR 0020. The script follows ADR 0025.
