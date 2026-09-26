---
number: 29
title: Distribute components through a shadcnui-hono-jsx CLI that applies shadcn/ui presets
status: accepted
date: 2026-09-26
links:
- target: 8
  kind: supersedes
- target: 9
  kind: amends
- target: 13
  kind: amends
---

# Distribute components through a shadcnui-hono-jsx CLI that applies shadcn/ui presets

## Context and Problem Statement

On https://ui.shadcn.com/create users design a preset (style, base color,
theme, chart color, icon library, fonts, radius, menu accent, menu color) and
get a preset code such as `b3ZgkpTRjc`, which the shadcn CLI applies with
`shadcn init --preset <code>` or `shadcn apply --preset <code>`. Users of this
project want the same: pass a preset code on the command line and get a theme
and components that match it. How should presets reach a Hono project?

Findings with `shadcn@4.21.0` (`packages/shadcn/src` and live responses,
2026-09-26):

* A preset code bit-packs style, baseColor, theme, chartColor, iconLibrary,
  font, fontHeading, radius, menuAccent and menuColor. `base`, `rtl` and
  `pointer` are separate flags. Decoding is local (`shadcn/preset` has no
  imports and makes no requests).
* `init` and `apply` fetch `https://ui.shadcn.com/init?base=…&style=…&preset=<code>`,
  a `registry:base` item with CSS variables, CSS, font items, the
  `components.json` config, and dependencies that always include
  `@base-ui/react` and the icon library's React package. Both require
  `components.json` and framework detection, which fails on plain Hono
  (ADR 0008).
* `apply` reinstalls every file in the ui directory whose name is a shadcn
  item, from `ui.shadcn.com/r/styles/<style>/`, so it would replace this
  project's `button.tsx` with the React one.
* The install-time transforms that resolve icon library, menu color, RTL and
  the heading font skip `registry:file` and `registry:item` files, which is
  what this project ships. They would emit React icon imports and only rewrite
  `className` attributes anyway.
* Colors, radius, menu accent, pointer and fonts only change CSS and font
  packages. Style, icon library, menu color and RTL change component source
  (ADR 0030, ADR 0031).

The shadcn CLI therefore cannot apply presets to this project's components;
the project has to provide the install step itself.

## Decision Drivers

* Every option of ui.shadcn.com/create must be applicable from the command
  line, to new and to existing projects.
* One way to install, specified and implemented as simply as possible
  (project owner).
* No React packages in users' projects and no registry server (as in
  ADR 0008).
* Users receive what CI verified; data fetched at install time is limited to
  what the shadcn CLI fetches too.

## Considered Options

* A CLI published to npm that replaces `shadcn add` for this project
* A hosted registry that finalizes items for a preset code in the URL
  (`shadcn add https://…/r/<preset>/button`)
* Per-style static items in the GitHub source registry, with the theme copied
  by hand
* A CLI in addition to the GitHub source registry

## Decision Outcome

Chosen option: "A CLI published to npm that replaces `shadcn add`", chosen by
the project owner, because it is the only option that covers every preset
option, including re-applying a preset to installed components, without a
server and with a single install path.

* The npm package `shadcnui-hono-jsx`, published from a workspace package,
  provides the `shadcnui-hono-jsx` command for `bunx` and `npx`, bundled for
  Node when packed (`dist/bin.js`) so that it runs without Bun:
  * `init [--preset <code|name>] [--rtl] [--pointer] [components]` writes
    the config file, the theme and the license notice, and installs
    dependencies. Without `--preset` it uses the `nova` preset, like
    `shadcn init --defaults`.
  * `add <components>` installs components with the sibling components
    they import (ADR 0015) and their client scripts (ADR 0025).
  * `apply --preset <code|name> [--only theme,font]` changes the preset and
    rewrites the theme and, without `--only`, every installed component, like
    `shadcn apply`.
* Only Base UI is supported; `--base` with another value is rejected.
* Preset codes and named presets are decoded with the pinned `shadcn`
  package's `shadcn/preset` logic, vendored by `upstream:sync` like
  `tailwind.css` (ADR 0009), so the CLI does not depend on `shadcn` at
  runtime.
* The package contains everything generated: the templates of every style and
  the finalize step (ADR 0030), the icon data (ADR 0031), the client scripts,
  the theme builder, `tailwind.css` and the notice text. It downloads nothing
  from GitHub, so the CLI version and the preset determine the component
  output.
* The theme is built at install time. The CLI requests the same `/init` URL
  as the shadcn CLI and turns its CSS variables and CSS into
  `styles/shadcn/theme.css` with the generator's theme builder. Fonts follow
  the shadcn CLI outside Next.js: each `registry:font` item adds an
  `@fontsource-variable/*` dependency, its `@import`, the `--font-*` theme
  variable and the base-layer rule. `init` and `apply` need network access to
  ui.shadcn.com, like the shadcn CLI.
* The preset is recorded in `shadcnui-hono-jsx.json` at the project root
  (preset code, `rtl`, `pointer`). The CLI never creates `components.json`,
  so the shadcn CLI never treats the project as a shadcn/ui project.
* File locations stay as they are: `components/ui/`, `styles/shadcn/`,
  `public/shadcn/` and `LICENSE-shadcnui-hono-jsx.txt` at the root. `apply`
  rewrites the files in `components/ui/` named after this project's items and
  leaves other files alone.
* npm dependencies (`cn`, `class-variance-authority`, `tw-animate-css`, font
  packages) are installed with the package manager that the lockfile
  indicates.
* The GitHub source registry goes away: `registry.json`, `registry:validate`
  and the `shadcn add` instructions. `compatibility.json` and the README
  compatibility table stay.

### Consequences

* Good, because every option of ui.shadcn.com/create can be applied, and
  changed later with `apply`.
* Good, because there is one install path, and it never touches React
  tooling or `components.json`.
* Good, because component output depends only on the CLI version and the
  preset.
* Bad, because the project gains a release process (npm versions and
  publishing) and a CLI to maintain (arguments, package manager detection,
  file writing).
* Bad, because the theme depends on ui.shadcn.com's `/init` endpoint at
  install time and is not snapshotted per preset, as with the shadcn CLI. The
  theme builder itself stays tested.
* Bad, because users of `shadcn add supermomonga/shadcnui-hono-jsx/<item>`
  have to switch to the CLI.
* Neutral, because preset format changes arrive with a `shadcn` version bump
  through the upstream-check workflow.

### Confirmation

A CLI install test replaces `tests/registry/install.test.ts`. It runs `init`
with several presets and `add` for every component in a clean Hono fixture,
and asserts the written files, the absence of `components.json` and React
packages, type checking, rendering and a Tailwind build; `apply` runs on the
same fixture. Unit tests compare preset decoding with the pinned `shadcn`
package.

## Pros and Cons of the Options

### A CLI replacing `shadcn add`

* Good, because it can run the install step this project needs (ADR 0030,
  ADR 0031) on the user's machine, without a server.
* Bad, because it adds a package and a release process.

### A hosted registry finalizing items per preset

* Good, because users keep the familiar `shadcn add`.
* Bad, because it needs a server, and there is no `apply`: users re-add every
  component with `--overwrite`.

### Per-style static items

* Good, because only more items are needed.
* Bad, because preset codes cannot be used, and icon library, menu color and
  RTL are not covered. Every combination (8 styles × 5 icon libraries × 4 menu
  colors × RTL, 320 per component) is too many to pre-generate.

### A CLI in addition to the GitHub source registry

* Good, because existing install commands keep working.
* Bad, because two install paths have to be documented and tested; the project
  owner prefers one.

## More Information

ADR 0008 is superseded. The theme item of ADR 0009 (a `theme.css` written
by `generate`) and the registry-item wording of ADR 0013 (every registry item
lists the notice file) are replaced by the CLI writing those files. The package name `shadcnui-hono-jsx` was free on npm on
2026-09-26.
