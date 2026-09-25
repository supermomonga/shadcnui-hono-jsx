---
number: 2
title: Use Bun, TypeScript 6.0 and a hoisted workspace as the toolchain
status: accepted
date: 2026-09-25
---

# Use Bun, TypeScript 6.0 and a hoisted workspace as the toolchain

## Context and Problem Statement

The repository contains a code generator (TypeScript AST transforms), generated
Hono JSX components, render/type tests, and two example applications (plain
Hono and HonoX). We need one toolchain for package management, script running,
testing, type checking, formatting, and linting that works for all of them and
keeps generated output deterministic.

## Decision Drivers

* The handover specification prefers Bun for project development unless an
  upstream shadcn tool is incompatible.
* The generator uses `ts-morph` 28.0.0, which bundles TypeScript 6.0.2.
* Generated components and examples must resolve a single `hono` instance so
  that JSX types and runtime match.
* Formatting of generated files must be deterministic and close to upstream
  shadcn/ui style (no semicolons, double quotes) to keep diffs reviewable.

## Considered Options

* Bun (package manager, runner, `bun test`) + TypeScript 6.0.x + Biome, with
  hoisted Bun workspaces for the examples
* Node.js + pnpm + Vitest + TypeScript 7 + Prettier/ESLint
* Bun + TypeScript 7

## Decision Outcome

Chosen option: "Bun + TypeScript 6.0.x + Biome with hoisted workspaces",
because it follows the specification's Bun preference, keeps `tsc` on the same
TypeScript major version that `ts-morph` uses internally, and needs only one
formatter/linter binary.

* `packageManager` is pinned to `bun@1.3.13`; `bunfig.toml` sets
  `linker = "hoisted"` so `examples/*` workspaces share root dependencies
  (notably one `hono`).
* `typescript` is pinned to `6.0.3` for `tsc`.
* `@biomejs/biome` is the only formatter and linter; generated TypeScript is
  formatted by the same pinned Biome.
* `bun test` runs generator, render, and policy tests. The HonoX example may
  use its own Vite-based tooling for build/smoke tests.

### Consequences

* Good, because the generator and type checks run on one TypeScript version.
* Good, because one Biome version formats both hand-written and generated code,
  so `generate --check` is reproducible.
* Bad, because TypeScript 7 improvements are deferred until `ts-morph` supports
  it; this should be revisited then.
* Bad, because contributors must use Bun; Node-only environments are not a
  first-class development target (consumers of the registry are unaffected).

### Confirmation

CI installs with `bun install --frozen-lockfile` and runs `bun run verify`
(Biome, `tsc`, `bun test`, `generate --check`).

## Pros and Cons of the Options

### Bun + TypeScript 6.0.x + Biome

* Good, because it matches the specification and is fast for small test suites.
* Good, because TypeScript matches `ts-morph`'s bundled compiler.
* Neutral, because Biome's formatting differs slightly from upstream Prettier in
  edge cases.

### Node.js + pnpm + Vitest + TypeScript 7 + Prettier/ESLint

* Good, because Vitest is the HonoX-recommended test runner.
* Bad, because it contradicts the Bun preference and needs more tools.
* Bad, because `tsc` 7 would diverge from the compiler used by `ts-morph`.

### Bun + TypeScript 7

* Good, because it uses the newest compiler.
* Bad, because the generator's AST library still bundles TypeScript 6.0.

## More Information

Revisit when `ts-morph` ships a TypeScript 7-based release.
