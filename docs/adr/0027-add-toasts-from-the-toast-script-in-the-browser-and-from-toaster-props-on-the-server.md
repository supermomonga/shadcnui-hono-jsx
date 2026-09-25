---
number: 27
title: Add toasts from the toast script in the browser and from Toaster props on the server
status: accepted
date: 2026-09-26
---

# Add toasts from the toast script in the browser and from Toaster props on the server

## Context and Problem Statement

Upstream toasts are added with `toast.add()` with a title and description. `toast`
is a manager that the component module creates and `<Toaster>` renders. In
Hono JSX the component module only runs on the server, where a module-level
manager is shared by every request, and browser code cannot reach it.
Toasts still need a browser API (after a fetch, on a click) and a server
path (a flash message after a form post). Every other component's client
script (ADR 0025) only listens to events. How should toasts be added?

## Decision Drivers

* Keep upstream's `toast.add()` shape so shadcn/ui examples translate directly.
* No toast may leak between requests on the server.
* Toast markup stays in the generated component, so user edits apply.
* Toasts known on the server show without JavaScript.

## Considered Options

* An ES module export
* A global object
* Custom events only

## Decision Outcome

Chosen option: "An ES module export", because it keeps upstream's
`toast.add()` and explicit imports; the maintainer chose it. The
alternatives were a global `window` object and custom events
(`shadcn:toast`) only.
`/shadcn/toast.js` exports `toast` with Base UI's `add`, `close`, `update`
and `promise`. It copies toasts from templates that `<Toaster>` renders (one
per toast type, so each has its icon) and reproduces Base UI's stacking,
timers, expansion, limit and swiping. `data-toast-trigger` buttons add toasts
without code. On the server, the `toasts` prop of `<Toaster>` or a per-response
`createToastManager()` renders toasts, and the script adopts them. The
server-side `toast` export throws on `add()` rather than sharing toasts
between requests.

### Consequences

* Good, because examples keep `toast.add()` and only change the import.
* Good, because flash messages need no JavaScript to show.
* Bad, because the server module and the script both define a `toast`, and
  only the script's adds toasts at runtime.
* Bad, because `<Toaster>` renders six hidden templates, and titles, descriptions
  and actions are filled as text or DOM nodes, not JSX.
* Neutral, because it is the only client script with an API, so it is the
  one module users import.

### Confirmation

`tests/render/toast.test.tsx` covers server toasts, templates and the throwing
module manager. `tests/visual/toast.spec.ts` compares stacking, expansion,
closing, the limit, swiping and timeouts with Base UI step by step, plus
screenshots.

## More Information

Follows ADR 0025 (optional client scripts).
