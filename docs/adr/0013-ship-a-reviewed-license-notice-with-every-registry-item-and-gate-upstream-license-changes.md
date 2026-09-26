---
number: 13
title: Ship a reviewed license notice with every registry item and gate upstream license changes
status: accepted
date: 2026-09-25
links:
- target: 8
  kind: amends
- target: 10
  kind: amends
- target: 16
  kind: amendedby
- target: 29
  kind: amendedby
- target: 31
  kind: amendedby
---

# Ship a reviewed license notice with every registry item and gate upstream license changes

## Context and Problem Statement

Generated components (`components/ui/*.tsx`) and styles (`styles/shadcn/*.css`)
contain substantial portions of shadcn/ui (MIT), and `tailwind.css` is a
near-verbatim copy from the `shadcn` npm package. MIT requires the copyright
notice and the permission notice to be included in all copies or substantial
portions. The registry installs individual files into users' projects, so
`THIRD_PARTY_LICENSES.md` never travels with them; the generated headers only
carried a copyright line and a URL. The project specification (section 35) asks to
settle how upstream notices propagate into distributed source before release.

A second question is what happens when upstream licensing changes. Upstream
could relicense (or add terms), which can change whether and how its code may be
redistributed at all. That cannot be handled mechanically.

A second opinion from a separate advisor agent (Codex) agreed with shipping a
shared notice file and suggested the root location, per-item listing, and
wording used below.

## Decision Drivers

* Every installation must receive the full MIT text with the relevant copyright
  notices, whichever items are installed.
* Headers stay short (specification section 28) and output stays deterministic.
* A change in upstream licensing must stop redistribution of new upstream code
  until a human has reviewed it.

## Considered Options

* Short per-file notice plus a shared, reviewed notice file listed in every
  registry item; upstream licenses monitored and gated
* Full MIT text in every generated file header
* Copyright line and URL only (previous state)
* Build the distributed notice from the snapshotted upstream license text

## Decision Outcome

Chosen option: "Short per-file notice plus a shared, reviewed notice file;
upstream licenses monitored and gated", approved by the project owner.

* `generate` writes `LICENSE-shadcnui-hono-jsx.txt` (fixed text in
  `generator/src/licenses.ts`): scope (only the installed registry sources and
  their derivative portions), the unofficial-project statement, then
  `Copyright (c) 2023 shadcn`, `Copyright (c) 2026 supermomonga` (original
  additions and modifications only; none claimed in the vendored
  `tailwind.css`), and the full MIT permission notice.
* Every registry item, including `theme`, lists that file directly
  (`target: "~/LICENSE-shadcnui-hono-jsx.txt"`), not through
  `registryDependencies`. The shadcn CLI silently skips an existing file with
  identical content, so later installs do not prompt.
* Generated headers carry `Derived from shadcn/ui. Copyright (c) 2023 shadcn.`,
  the project's modification notice, `SPDX-License-Identifier: MIT`, and a
  pointer to the notice file. The vendored `tailwind.css` carries only the
  upstream notice.
* `upstream:sync` snapshots the upstream repository `LICENSE.md` and the
  `shadcn` package's `license` field and `LICENSE.md` into `upstream/licenses/`
  and `upstream/lock.json`, for review only. They are never redistributed or
  used to build the notice.
* `ACCEPTED_UPSTREAM_LICENSE` records the reviewed license (SPDX `MIT`,
  copyright line, sha256 of the reviewed text). `generate` (and therefore
  `verify` and CI) fails when the snapshot differs from it.
* The upstream-check workflow reports license changes first under a caution,
  shows their diff, and opens the pull request as a draft labelled
  `license-review` (instead of `needs-adapter`).
* To resume after a license change, a maintainer reviews the new terms and, only
  if redistribution is still permitted, updates `ACCEPTED_UPSTREAM_LICENSE` and
  the notice text in the same change.

### Consequences

* Good, because every installation receives the complete notice while source
  headers stay four lines.
* Good, because a relicensing upstream cannot silently flow into distributed
  code.
* Bad, because users get one extra file at their project root, and copying a
  single file by hand does not carry the full text (documented in the README).
* Bad, because even harmless edits to the upstream license (for example the
  year) block generation until reviewed.

### Confirmation

`generator/tests/licenses.test.ts` covers the notice and the gate;
`generator/tests/registry/build.test.ts` checks that every item lists the
notice; `generator/tests/upstream/*.test.ts` cover license snapshots and the
report caution; `tests/registry/install.test.ts` installs `button`, then
`theme`, then the rest without `--overwrite` and asserts the notice is
installed once and reused without prompts.

## Pros and Cons of the Options

### Shared notice file plus gate

* Good, because it satisfies the notice requirement per installation and keeps
  a human in the loop for licensing.

### Full text in every file

* Good, because single copied files stay self-contained.
* Bad, because it adds about twenty lines to every source file, against
  section 28.

### Copyright line and URL only

* Bad, because the permission notice is not actually included in the copies.

### Build the notice from the upstream snapshot

* Bad, because it would redistribute whatever terms upstream adopts without
  anyone deciding whether that is allowed.
