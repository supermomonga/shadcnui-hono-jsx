---
number: 28
title: Offer hand-written lite alternatives with a -lite suffix for components without a port
status: accepted
date: 2026-09-26
links:
- target: 3
  kind: amends
- target: 5
  kind: amends
---

# Offer hand-written lite alternatives with a -lite suffix for components without a port

## Context and Problem Statement

Some upstream components depend on React libraries (`input-otp`,
`react-day-picker` and others), so they have no port yet and porting them is on
hold. Browser features can approximate a few of them without JavaScript:
one native text input over slot boxes for a one-time code (as daisyUI does),
or a native date input styled like the Input for a date picker. These
approximations are not translations of upstream code, and a real port may
follow later. How should they be offered without blocking that port?

## Decision Drivers

* A later port must be able to use the upstream names (item, file, exports).
* Users must see that an alternative only approximates upstream.
* The look should follow upstream as far as possible, and upstream changes
  should prompt a review.
* Generated output stays script-written (no hand edits in `components/ui`).

## Considered Options

* A `-lite` suffix
* A `native-` prefix
* A `-css` suffix
* A separate directory only

## Decision Outcome

Chosen option: "A `-lite` suffix", because it keeps the item next to the
upstream name (`input-otp`, `input-otp-lite`), leaves the upstream names free
for a port, and says that the component does less. The item, the file
(`~/components/ui/<name>-lite.tsx`) and the exports (`InputOTPLite`) all
carry it. A `native-` prefix could collide with future upstream items
(upstream already has `native-select`), and most ports are built on native
elements anyway; `-css` names an implementation detail; a directory alone
leaves the flat registry names and the exports colliding.

The sources are hand-written in `lite/` in upstream's style (React TSX with
`className`, `IconPlaceholder` and registry imports) and go through the same
translation pipeline, so headers, inlined icons, sibling components and
registry dependencies work as for ports. `generator/src/lite.ts` records the
upstream items each one is based on, with their content hashes: when one
changes, `bun run generate` stops until the alternative is reviewed and the
hash updated. `compatibility.json` and the README list them separately, with
their visual parity (`approximate` when compared with upstream at a looser
tolerance, `not-compared` otherwise).

### Consequences

* Good, because users get a usable, script-free approximation now, and a
  port can later take the upstream name.
* Good, because upstream changes to the base items are noticed.
* Bad, because these components are designed here, an exception to
  "upstream owns design"; their differences are documented per item.
* Bad, because the names differ from shadcn/ui's documentation.

### Confirmation

`generator/tests/lite.test.ts` covers the hash check;
`tests/render/*-lite.test.tsx` covers the output, and `tests/visual/lite.spec.ts`
compares `input-otp-lite` with upstream's InputOTP and checks the native
behavior of both alternatives.

## More Information

Amends ADR 0003 (generated outputs) and ADR 0005 (translation pipeline) by
adding a second kind of source.
