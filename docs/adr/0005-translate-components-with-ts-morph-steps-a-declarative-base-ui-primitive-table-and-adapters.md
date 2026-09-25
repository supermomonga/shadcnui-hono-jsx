---
number: 5
title: Translate components with ts-morph steps, a declarative Base UI primitive table and adapters
status: accepted
date: 2026-09-25
---

# Translate components with ts-morph steps, a declarative Base UI primitive table and adapters

## Context and Problem Statement

Upstream shadcn/ui (base-nova) components are React TSX that import Base UI
primitives (`@base-ui/react/button`, `useRender`/`mergeProps`), React types, and
framework-neutral helpers (`cn`, `cva`). They must be translated into Hono JSX
repeatedly as upstream changes, without accumulating unexplained special cases.
How should the translation engine be structured?

## Decision Drivers

* The specification requires structural (AST) conversion, not regex rewriting.
* Most Tier A components differ only in mechanical ways (types, `className`,
  directives); a few use stateless Base UI primitives.
* Incompatibilities must be explicit, reviewable rules, and translation must
  fail loudly when upstream introduces something unknown.
* The intermediate representation should stay minimal.

## Considered Options

* ts-morph with an ordered list of small transform steps, a facts-only IR, a
  declarative primitive table, and per-component adapters
* A full intermediate representation re-emitted from scratch
* Per-component hand-written templates filled from upstream classes

## Decision Outcome

Chosen option: "ts-morph with ordered steps, facts-only IR, primitive table,
and adapters", because it keeps upstream code structure (and therefore readable
diffs) while making every translation rule explicit and testable.

* `generator/src/analyzer/` collects syntax facts and classifies each item
  (`direct`, `native-adapter`, `custom-adapter`, `unsupported`) with
  machine-readable reasons. Facts are the only IR.
* `generator/src/transformers/pipeline.ts` runs fixed steps: remove directives,
  `cn-*` markers, `useRender`, primitives, React types, `class`, DOM attribute
  casing, dropped props, helper type, imports, and a final guard.
* `generator/src/adapters/primitives/base-ui.ts` declares how each stateless
  Base UI primitive renders (tag, default/static attributes, prop-to-attribute
  mappings, state `data-*` attributes, notes, and the Base UI source used as
  reference). Mapped primitives still classify as `direct`; `native-adapter` is
  reserved for primitives mapped onto browser behavior (Tier B).
* `generator/src/adapters/components/` holds component adapters that resolve
  specific blocking reasons and may splice extra steps into the pipeline.
* The guard fails generation if React, Base UI, `useRender`, `className`,
  directives, unresolved JSX components, or export changes remain.

### Consequences

* Good, because generated output stays structurally close to upstream.
* Good, because unknown upstream constructs fail generation with a reason
  instead of producing subtly wrong components.
* Bad, because ts-morph node invalidation requires care (replace in reverse
  document order, capture text before replacing).
* Neutral, because the primitive table needs a manual parity check against Base
  UI when upstream starts using a new primitive.

### Confirmation

`generator/tests/transformers/steps.test.ts` covers each step and the guard;
`generator/tests/analyzer/classify.test.ts` covers classification rules and the
snapshot; CI runs `bun run generate --check`.

## Pros and Cons of the Options

### ts-morph steps + facts + tables + adapters

* Good, because each rule is small and unit-tested.
* Good, because formatting is delegated to Biome.

### Full IR re-emitted from scratch

* Good, because output shape is fully controlled.
* Bad, because every upstream structure would need modelling, which is the
  over-engineering the specification warns against.

### Hand-written templates

* Bad, because they become the hand-maintained forks the project must avoid.
