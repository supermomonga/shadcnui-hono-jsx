---
number: 7
title: Preserve the upstream DOM contract and omit render, asChild and refs
status: accepted
date: 2026-09-25
---

# Preserve the upstream DOM contract and omit render, asChild and refs

## Context and Problem Statement

shadcn/ui styles depend on the DOM that Base UI renders: `data-slot`, state
attributes such as `data-disabled` or `data-orientation` (used by custom
variants like `data-horizontal:`), ARIA attributes, and defaults such as
`type="button"`. Base UI also offers element replacement (`render`), and React
offers refs; neither exists in server-rendered Hono JSX. Which parts of the
behavior should generated components reproduce?

## Decision Drivers

* Visual parity requires the same attributes that upstream CSS selectors target.
* Correct semantics and accessibility over superficial API parity.
* Hono JSX stringifies unknown props into attributes and throws on function
  props, so unsupported props must not silently pass through.

## Considered Options

* Reproduce the server-rendered DOM contract; omit `render`, `asChild`, refs,
  and client-only state
* Emulate `render`/Slot semantics with element cloning
* Render plain elements without Base UI state attributes

## Decision Outcome

Chosen option: "Reproduce the server-rendered DOM contract".

* Keep `data-slot` and the `data-*` state attributes Base UI renders for static
  state (for example `data-disabled=""` when disabled, `data-orientation`,
  `data-variant` from `useRender` state), ARIA attributes (`role="separator"`,
  `aria-orientation`), and Base UI defaults (`type="button"` for Button).
  Defaults are placed before the props spread so callers can override them.
* Omit `render`, `asChild`, `nativeButton`, `focusableWhenDisabled`, refs, and
  client-only state attributes (`data-dirty`, `data-focused`, auto-generated
  ids). Types reject `render` and `asChild`.
* Document every difference in the primitive table `notes`, which feed the
  compatibility manifest.

### Consequences

* Good, because upstream selectors and custom variants work unchanged.
* Good, because unsupported features fail at compile time instead of rendering
  broken attributes.
* Bad, because composition patterns that rely on `render`/`asChild` (for
  example a Button rendered as a link) need a separate mechanism later.
* Bad, because Button omits Base UI's `tabindex="0"`; a native button is
  focusable already.

### Confirmation

Render tests assert `data-slot`, state attributes, ARIA attributes, default and
overridden `type`, and that no `className`, `variant`, `size`, `render`, or
`asChild` attribute leaks.

## Pros and Cons of the Options

### Reproduce the DOM contract

* Good, because it gives visual and semantic parity for server-rendered output.

### Emulate `render`/Slot

* Bad, because it recreates React Slot semantics through hacks, which the
  specification explicitly rejects.

### Plain elements only

* Bad, because upstream styles keyed on state attributes would break.
