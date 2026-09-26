---
number: 31
title: Inline icons of every shadcn/ui icon library at generation time
status: accepted
date: 2026-09-26
links:
- target: 16
  kind: supersedes
- target: 13
  kind: amends
---

# Inline icons of every shadcn/ui icon library at generation time

## Context and Problem Statement

A preset chooses one of five icon libraries: lucide, tabler, hugeicons,
phosphor or remixicon (ADR 0029). Upstream names the icon of each library on
every `IconPlaceholder`, and the shadcn CLI turns it into an import from the
library's React package (`lucide-react`, `@tabler/icons-react`,
`@hugeicons/react` with `@hugeicons/core-free-icons`, `@phosphor-icons/react`,
`@remixicon/react`), which `/init` adds to the user's dependencies. shadcn/ui
thus distributes icon names only, and users get the artwork from npm under
each library's license. ADR 0016 inlines Lucide's SVG into generated files,
because generated components cannot use React. How should the other
libraries be supported?

Licenses of the data packages, checked on 2026-09-26:

* `lucide` 1.48.0: ISC.
* `@tabler/icons` 3.48.0, `@hugeicons/core-free-icons` 4.3.5 and
  `@phosphor-icons/core` 2.1.1: MIT.
* `remixicon` 4.9.1: "Remix Icon License v1.0" since 4.9.0 (2026-01-27),
  although its npm metadata still says Apache-2.0 (`@remixicon/react`
  declares the new license). The license allows use, modification and
  distribution as part of a larger work in which the icons are functional or
  decorative and not the primary value, naming UI kits and design systems. It
  forbids standalone icon packs, competing icon libraries, and use as a logo
  or brand identity. Remix Design's notice (Remix-Design/remixicon#1069) says
  UI kits and templates are unaffected, and its maintainer stated there that
  a Svelte package embedding the path data does not violate it. shadcn/ui
  still offers remixicon, with no discussion of the change in its repository.
  Some organizations cannot accept the license (Backstage stays on an older
  version under CNCF policy).

## Decision Drivers

* Every icon library of a preset must work, with no React at runtime.
* Output matches the React packages (visual and SVG DOM parity) and is
  verified in CI.
* Licenses of redistributed artwork are reviewed and passed on to users.
* The install step stays a substitution (ADR 0030).

## Considered Options

* Inline every library's SVG at generation time
* Ship icon names only, and let the CLI inline SVG from icon packages
  installed in the user's project

## Decision Outcome

Chosen option: "Inline every library's SVG at generation time", chosen by the
project owner, because users receive exactly the verified output and the CLI
only substitutes prepared components, as with Lucide today.

* `lucide`, `@tabler/icons`, `@hugeicons/core-free-icons`,
  `@phosphor-icons/core` and `remixicon` are pinned root devDependencies, read
  only by the generator.
* For every icon a template references, the generator renders one Hono JSX
  component per library that reproduces what the library's React component
  renders as the shadcn CLI uses it (SVG attributes, classes, `aria-hidden`
  handling, `strokeWidth={2}` for Hugeicons and Phosphor), and stores them in
  `cli/generated/icons/<library>.json`. Templates keep inlining Lucide (ADR
  0016) and mark each icon component with its names in every library (an
  `// icon:` line with their JSON); finalize swaps in the chosen library's
  components under the same file-local names and rewrites the header's
  `Icons:` line (ADR 0030). A name that any library cannot resolve fails
  generation.
* Each library's license is gated like Lucide's (ADR 0016) and upstream's
  (ADR 0013): `upstream:sync` snapshots the package license,
  `generator/src/licenses.ts` keeps a reviewed record per library, and
  `generate` stops when one changes.
* The project owner reviewed and accepted the Remix Icon License v1.0 on
  2026-09-26.
* The notice file that the CLI installs contains the shadcn/ui and project
  notices and the license of the chosen library only (amends ADR 0013). When
  remixicon is chosen, the CLI points out that its license is not an open
  source license and restricts standalone and logo use.
* The React packages (`lucide-react`, `@tabler/icons-react`,
  `@hugeicons/react`, `@phosphor-icons/react`, `@remixicon/react`) are
  installed only in `tests/visual`, pinned together with the data packages
  and bumped together by the upstream-check workflow.

### Consequences

* Good, because icons of every library cost nothing at runtime and match the
  React output.
* Good, because users only receive the license of the library they chose.
* Bad, because, unlike shadcn/ui, the project redistributes icon artwork, so
  five licenses need review whenever they change.
* Bad, because users who choose remixicon accept a license that is not open
  source; the CLI makes that visible.
* Neutral, because generation-time devDependencies grow by four packages.

### Confirmation

`generator/tests/icons.test.ts` covers name resolution and rendering for
every library and finalizes every template with each of them,
`tests/install` installs each library with the CLI and type-checks the
result, and the visual matrix (ADR 0030) compares pixels and SVG attributes
with each React package (`test:visual:styles --variant icons-<library>`).

## Pros and Cons of the Options

### Inline at generation time

* Good, because output is verified and the CLI stays simple.
* Bad, because the project redistributes artwork and gates five licenses.

### Names only, inlined at install time

* Good, because, like shadcn/ui, the project would not redistribute artwork.
* Bad, because output would depend on the icon package version the user
  installs (untested), the CLI would parse five package formats, and users
  would need extra dependencies.

## More Information

ADR 0016 is superseded; its rendering and gating rules carry over to every
library.
