---
number: 24
title: Build Select on the customizable native select element
status: accepted
date: 2026-09-26
links:
- target: 19
  kind: amends
---

# Build Select on the customizable native select element

## Context and Problem Statement

Base UI's Select renders a trigger button and a popup listbox and implements
opening, keyboard navigation, typeahead and positioning in JavaScript. The
customizable `<select>` (`appearance: base-select`, reaching every major
engine with Safari 27 in September 2026) lets authors put a `<button>` with
`<selectedcontent>` inside the select, style the picker (`::picker(select)`)
and put rich content in options, while the browser keeps the select's
behavior and form semantics; older browsers fall back to a classic select.
Upstream splits the select into a root, a trigger and a content component,
but the native options must be inside the `<select>`. Should Select be built
on the customizable select?

## Decision Drivers

* No client JavaScript; forms that work without scripts.
* Visual parity with upstream, closed and open.
* Mechanical translation through families (ADR 0019).
* A usable fallback in older browsers.

## Considered Options

* Customizable native select, with the trigger rendering the `<select>`
* Keep Select unsupported until client JavaScript is decided

## Decision Outcome

Chosen option: "Customizable native select", decided by the project owner.

* A family (`generator/src/adapters/families/select.ts`, `native`,
  `native-structure`). The trigger renders the `<select>` (so the `id` and
  `aria-*` given to it reach the form control) with its classes, a
  `display: contents` button holding the value (`<selectedcontent>`) and the
  icon, a hidden, disabled empty option showing the value's prompt text,
  and the content, which the root takes from its children and hands over.
  Items are `<option>`s, groups `<optgroup>`s with a `<legend>`, separators
  `<hr>`; portal, positioner, popup and list pass their children through;
  scroll arrows render nothing and icons only they used are pruned.
* The popup's classes are applied to the picker at generation time
  (`[&::picker(select)]:`), with open and closed states read from the select
  (`open:`/`not-open:`) and placement from CSS variables the root derives
  from the content's `side`/`align`/offsets and their upstream defaults.
  Trigger child variants reach through the button (`**:`), the prompt
  state is the empty option being selected, the browser's
  checkmark and picker icon are hidden, and upstream's indicator shows only
  inside the selected option.
* Not supported, and listed in the notes: `onValueChange`, `multiple`,
  `items`, value render functions, aligning the selected item with the
  trigger (the list opens below it), classes on `SelectContent`, and Enter
  to open (Space and the arrow keys open it, as for any select).

### Consequences

* Good, because Select works and submits without JavaScript, with the
  browser's keyboard handling, typeahead and accessibility.
* Good, because upstream's design is kept closed and open.
* Bad, because the root has to find the content among its children, so
  `SelectContent` must be a direct child of `Select` (rendering throws
  otherwise).
* Neutral, because browsers without customizable selects show a classic
  select styled like the trigger.

### Confirmation

`tests/render/select.test.tsx` covers the structure, prompt option, selection
and attribute routing; `generator/tests/adapters/families-select.test.ts`
the class mappings; `tests/visual/select.spec.ts` checks that no scripts
ship, selecting with the pointer and the keyboard, Escape, disabled options,
and screenshots of the closed and open select against upstream Base UI.

## Pros and Cons of the Options

### Customizable native select

* Good, because the browser provides the listbox behavior.
* Bad, because the structure differs from Base UI's and a few props cannot
  be supported.

### Keep unsupported

* Bad, because forms would have no styled select.
