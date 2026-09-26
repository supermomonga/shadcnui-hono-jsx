---
number: 8
title: Distribute components as universal items from a GitHub source registry
status: superseded
date: 2026-09-25
links:
- target: 13
  kind: amendedby
- target: 15
  kind: amendedby
- target: 29
  kind: supersededby
---

# Distribute components as universal items from a GitHub source registry

## Context and Problem Statement

Users should install component source into their own Hono or HonoX project with
the shadcn CLI, as with shadcn/ui, without running a registry server and
without React-oriented project setup. How should registry items be shaped and
hosted?

Findings with `shadcn@4.21.0`:

* `shadcn add owner/repo/item[#ref]` reads the root `registry.json` of a public
  GitHub repository and fetches files from the resolved commit; no `shadcn
  build` output is needed.
* An item is universal when its type is `registry:item` and every file is a
  `registry:file` with an explicit target. Universal items install without
  `components.json` or framework detection, skip all import transforms, and
  ignore `css`/`cssVars`. Only `~/` targets resolve.
* Non-universal installs fail on plain Hono (unsupported framework) and pull in
  `@base-ui/react` and `lucide-react` through `init` on HonoX (Vite).
* A bare `registryDependencies` name refers to shadcn's own React items;
  same-repository dependencies need the full `owner/repo/item` address and do
  not inherit `#ref`.

## Decision Drivers

* Installable into a clean Hono or HonoX project, with no React.
* No registry server; the repository is the registry.
* Predictable file locations and no reliance on import rewriting.

## Considered Options

* Universal items with `~/components/ui` and `~/styles/shadcn` targets, served
  as a GitHub source registry
* Non-universal `registry:ui` items that require a hand-written components.json
* Built JSON under `public/r` served from raw URLs or a namespace

## Decision Outcome

Chosen option: "Universal items served as a GitHub source registry", as chosen
by the project owner during planning.

* The generated root `registry.json` lists a `theme` item and one item per
  component, all `registry:item` with `registry:file` entries whose `target` is
  `~/` plus the repository path (`components/ui/button.tsx`,
  `styles/shadcn/theme.css`).
* Component `dependencies` are derived from the generated file's bare imports
  (`cn`, `class-variance-authority`), unversioned like upstream, and restricted
  to an allowlist. `hono` is documented as a prerequisite, not installed.
* No `registryDependencies`: components do not depend on `theme`, so repeated
  `add` commands never overwrite a customized theme, and no `#ref` pinning is
  lost. Generated files only import npm packages, so no import rewriting is
  needed.
* Install with `bunx shadcn@latest add supermomonga/shadcnui-hono-jsx/theme`
  once, then `bunx shadcn@latest add supermomonga/shadcnui-hono-jsx/button` for
  each component. HonoX users whose Tailwind source root is
  `app/` add `@source "../components"`.

### Consequences

* Good, because installation needs no components.json and never touches React
  tooling.
* Good, because the same files serve as registry source and as the tested
  generated output.
* Bad, because targets are fixed at the project root; users who want another
  location move the files and adjust imports.
* Bad, because the CLI cannot apply `css`/`cssVars`, so the theme is a CSS file
  the user imports manually.

### Confirmation

`generator/tests/registry/build.test.ts` checks the universal shape and
dependencies. `tests/registry/install.test.ts` builds the registry locally,
installs every item into a clean Hono fixture with the pinned CLI, and asserts
byte-identical files, no components.json, no React packages, type checking,
rendering, and a Tailwind build. CI runs it in the `registry-install` job.

## Pros and Cons of the Options

### Universal GitHub source registry

* Good, because it is zero-config for users and needs no hosting.
* Neutral, because file locations are fixed.

### Non-universal items with components.json

* Good, because aliases would let users choose locations.
* Bad, because plain Hono fails framework detection and HonoX `init` installs
  React-only packages.

### Built JSON with raw URLs or a namespace

* Bad, because it adds a build artifact to commit and a URL scheme to maintain
  without solving any universal-item limitation.
