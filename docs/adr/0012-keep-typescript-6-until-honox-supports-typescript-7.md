---
number: 12
title: Keep TypeScript 6 until HonoX supports TypeScript 7
status: accepted
date: 2026-09-25
links:
- target: 2
  kind: amends
---

# Keep TypeScript 6 until HonoX supports TypeScript 7
## Context and Problem Statement

ADR 0002 pinned `typescript` to 6.0.x so that `tsc` matches the TypeScript
version bundled by `ts-morph`, and planned to revisit TypeScript 7 once
`ts-morph` supports it. Dependabot then proposed `typescript` 7.0.2 (PR #1),
and CI failed in the HonoX example build. Is TypeScript 7 usable here, and what
actually blocks it?

Findings (2026-09-25), reproduced on the Dependabot branch:

* Root type checks (including type tests), the generator and render tests,
  `generate --check`, and the plain Hono example type check all pass with
  `tsc` 7.0.2. `ts-morph` bundles its own TypeScript 6 and is unaffected.
* TypeScript 7 is the native (Go) compiler. Its npm package's main export
  returns only `version` and `versionMajorMinor`; the JavaScript compiler API
  is gone (new APIs live under `typescript/unstable/*`).
* `honox` 0.1.61 depends on `@typescript-eslint/typescript-estree`, which
  reads `ts.Extension.Cjs` at load time and declares
  `"typescript": ">=4.8.4 <6.1.0"` (also in its latest release, 8.70.1). With
  TypeScript 7 installed, loading `honox/vite` fails with
  `Cannot read properties of undefined (reading 'Cjs')`.
* The hoisted workspace resolves one `typescript` for all packages, so the
  HonoX example cannot keep TypeScript 6 while the root moves to 7.

## Decision Drivers

* The HonoX example must build.
* The toolchain should keep a single TypeScript version.
* Dependabot should not open pull requests that are known to fail.

## Considered Options

* Stay on TypeScript 6 everywhere and ignore TypeScript major updates in
  Dependabot
* Move the root and the plain Hono example to TypeScript 7 and isolate the
  HonoX example on TypeScript 6
* Move everything to TypeScript 7 and drop or patch the HonoX example

## Decision Outcome

Chosen option: "Stay on TypeScript 6 everywhere and ignore TypeScript major
updates in Dependabot", approved by the project owner.

* `typescript` stays pinned to 6.0.x in the root, both examples, and the
  registry install fixture.
* `.github/dependabot.yml` ignores `version-update:semver-major` for
  `typescript`; minor and patch updates still arrive and are validated by CI
  (a TypeScript 6.1 update may also exceed typescript-estree's `<6.1.0` range).
* The revisit trigger in ADR 0002 becomes: `honox` (via
  `@typescript-eslint/typescript-estree`) supports TypeScript 7, in addition
  to `ts-morph` supporting it.

### Consequences

* Good, because the HonoX example and HonoX users' setup keep working.
* Good, because Dependabot no longer proposes a failing upgrade.
* Bad, because TypeScript 7's faster type checking is deferred.
* Neutral, because the generated components themselves type-check with
  TypeScript 7; consumers not using HonoX may use it.

### Confirmation

CI's `examples` job builds the HonoX example. To re-evaluate, check the
`typescript` peer range of `@typescript-eslint/typescript-estree` and the
`honox` release notes, then try the upgrade on a branch.

## Pros and Cons of the Options

### Stay on TypeScript 6

* Good, because it needs no workspace isolation or patches.

### Split TypeScript versions

* Bad, because the hoisted workspace makes `typescript-estree` resolve the root
  TypeScript, so isolation would require changing the install layout.

### Everything on TypeScript 7

* Bad, because it breaks HonoX, which the project must demonstrate.
