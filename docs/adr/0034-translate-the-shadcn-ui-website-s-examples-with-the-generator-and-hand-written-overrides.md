---
number: 34
title: Translate the shadcn/ui website's examples with the generator and hand-written overrides
status: accepted
date: 2026-09-27
links:
- target: 33
  kind: extends
- target: 4
  kind: extends
---

# Translate the shadcn/ui website's examples with the generator and hand-written overrides

## Context and Problem Statement

The documentation site (ADR 0033) should match ui.shadcn.com: every component
page with the same sections and examples (about 365 examples for the
generated components), and the same home page. Those pages, examples and
cards are React source in the shadcn-ui/ui repository, not in the registry
that `upstream:sync` snapshots (ADR 0004). Upstream changes them often. How
does the site get Hono JSX versions of them and keep up?

## Decision Drivers

* Upstream owns the design and content; this project owns the translation
  (AGENTS.md), as for components.
* Most examples are static JSX over the components; a few use React state,
  event handlers or React-only libraries.
* A change upstream must show up for review, not go stale silently.
* The code shown with an example must be what a user of this project writes.

## Considered Options

* Snapshot the sources and translate them with the generator, with
  hand-written overrides per function
* Port the examples by hand once
* Link to upstream's examples

## Decision Outcome

Chosen option: "Snapshot the sources and translate them with the
generator, with hand-written overrides per function", because it keeps the
site in step with upstream the way components are, and hand work is limited
to what needs a person.

* `upstream:sync` also snapshots `upstream/site/` (`site-sources.ts`, lock
  `upstream/site/lock.json`), apart from the component snapshot so nothing
  reaches `compatibility.json`:
  * the docs page of each generated component, the examples those pages
    preview and the home page cards, from shadcn-ui/ui on GitHub at one
    resolved commit (only changed blobs are fetched);
  * the base-nova `registry:example` items (for the Create page), from
    ui.shadcn.com.
* `bun run site:generate [--check]` (`generator/src/site/`) writes the
  committed, freshness-checked `site/generated/`:
  * examples translated with steps shared with components (directives, React
    types, `class`) and their own (import paths to the site's installs,
    icons, Next.js elements, `defaultValue` of inputs, Base UI props native
    elements do not need);
  * component pages transformed from upstream's MDX (this project's install
    command, snippets in Hono JSX, links, a Notes section with the known
    differences);
  * `icons.tsx`, the icons examples import from `@/components/icons` instead
    of `lucide-react`, `@tabler/icons-react` and `@hugeicons/react`.
* A top-level function that calls hooks, handles events, or uses a module the
  site cannot provide is replaced by a hand-written override in
  `site/examples/overrides/<example>.tsx`, recorded in
  `site/examples/overrides.ts` with the SHA-256 of the upstream function.
  Generation fails for a function that needs an override and has none, and
  for an override whose upstream function changed.
* Hand-written pages in `site/content/docs/components/` take precedence over
  translated ones (for the lite alternatives).
* The upstream-check workflow runs `site:generate` and labels the pull
  request `needs-example-override` when it fails.

### Consequences

* Good, because upstream's new and changed examples arrive in the weekly
  pull request, translated, and the site's type check catches examples the
  components cannot express.
* Good, because translating examples found typing gaps in the components
  (Combobox items, null Select values), fixed for users too.
* Bad, because the GitHub sources follow shadcn-ui/ui's main branch, which can
  be ahead of the registry that ui.shadcn.com serves.
* Neutral, because overrides are code to maintain; the hash check tells when.

### Confirmation

Unit tests cover the translation, the overrides and the MDX transform
(`generator/tests/site/`); `site:generate --check` runs in `verify` and CI;
the site's type check compiles every generated example against the installed
components.

## Pros and Cons of the Options

### Snapshot and translate, with overrides

* Good, because it scales with upstream and matches its content.
* Bad, because it adds a translation path to maintain.

### Port by hand once

* Good, because it needs no tooling.
* Bad, because hundreds of examples would drift from upstream unnoticed.

### Link to upstream's examples

* Good, because it costs nothing.
* Bad, because they are React code that this project's users cannot use.
