---
number: 9
title: Vendor shadcn tailwind.css in the theme item
status: accepted
date: 2026-09-25
links:
- target: 29
  kind: amendedby
---

# Vendor shadcn tailwind.css in the theme item

## Context and Problem Statement

Upstream base-nova styles import `shadcn/tailwind.css` from the `shadcn` npm
package. It defines custom variants the components rely on (for example
`data-horizontal`/`data-vertical`, `data-open`, `data-disabled`), keyframes,
and utilities. The upstream theme also needs CSS variables, `@theme inline`
mappings, and a base layer that the shadcn CLI writes into the user's
stylesheet, which universal items cannot do. How should the theme reach users?

## Decision Drivers

* Visual parity requires the same variables, mappings, and custom variants.
* Users should not need the full `shadcn` CLI package as a runtime dependency.
* Universal items ignore `css`/`cssVars`.

## Considered Options

* Ship `theme.css` (built from the upstream theme) plus a vendored copy of
  `shadcn/tailwind.css` as universal files
* Ship `theme.css` that imports `shadcn/tailwind.css` from npm
* Document manual copying of the upstream stylesheet

## Decision Outcome

Chosen option: "Ship `theme.css` plus a vendored `tailwind.css`".

* `upstream:sync` copies `dist/tailwind.css` from the pinned `shadcn`
  devDependency into the snapshot and records its version and sha256.
* `generate` writes `styles/shadcn/tailwind.css` (vendored copy with a
  provenance header) and `styles/shadcn/theme.css`, built with the shadcn CLI's
  rules: upstream imports (with `shadcn/tailwind.css` rewritten to
  `./tailwind.css`), `@custom-variant dark`, `:root` and `.dark` variables,
  `@theme inline` color and radius mappings plus theme variables, and the
  upstream base layer.
* Users import `theme.css` after `@import "tailwindcss"`.

### Consequences

* Good, because users only install `tw-animate-css`.
* Good, because the vendored file is pinned and updated together with the
  snapshot, with a reviewable diff.
* Bad, because the `shadcn` version is bumped by the upstream-check workflow
  rather than by Dependabot.
* Neutral, because fonts from the upstream preset (Geist) are not shipped;
  `--font-heading` falls back to Tailwind's `--font-sans`.

### Confirmation

`generator/tests/theme/build.test.ts` covers the CSS builder, and the registry
install test builds Tailwind CSS in a clean fixture and asserts the theme
variables and custom variants in the output.

## Pros and Cons of the Options

### Vendored copy

* Good, because it has no extra runtime dependency and is fully reproducible.

### Import from the `shadcn` npm package

* Bad, because every user would install the CLI package and its dependencies
  just for one stylesheet.

### Manual copying

* Bad, because it breaks the regenerate-from-upstream model.
