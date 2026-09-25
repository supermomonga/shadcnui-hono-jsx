---
number: 15
title: Ship imported sibling components inside each registry item
status: accepted
date: 2026-09-25
links:
- target: 8
  kind: amends
---


# Ship imported sibling components inside each registry item

## Context and Problem Statement

Some upstream components import other components, for example `button-group`
and `item` import `Separator`, and `attachment` imports `Button`, via
`@/registry/base-nova/ui/<name>` with matching `registryDependencies`. Universal
registry items are installed without import rewriting, and a GitHub-address
`registryDependencies` entry does not inherit the `#ref` the user pinned. How
should generated components reference and ship the components they use?

## Decision Drivers

* Installs must work without components.json or alias configuration.
* A pinned `#ref` must install a consistent set of files.
* Installing several items must not prompt for files that are already present
  and identical.

## Considered Options

* Rewrite imports to `./<name>` and list the imported components' files in the
  item itself (transitively)
* Rewrite imports to `./<name>` and use `registryDependencies` with full
  `owner/repo/item` addresses
* Keep such components unsupported

## Decision Outcome

Chosen option: "Rewrite imports to `./<name>` and list the files in the item".

* The analyzer treats `@/registry/<style>/ui/<name>` imports and
  `registryDependencies` as non-blocking (`component-import`,
  `component-dependency`) when `<name>` is generated too; otherwise they stay
  blocking.
* The `component-imports` transform rewrites them to `./<name>`; all generated
  components install into `components/ui/`. The guard only allows `./<name>`
  relative imports.
* `registry.json` lists, for each item, its own file, the files of every
  component it imports (transitively), and the license notice. npm
  dependencies are the union over those files. There are still no
  `registryDependencies`.
* The shadcn CLI skips existing files with identical content, so a shared file
  such as `separator.tsx` is written once.

### Consequences

* Good, because `button-group`, `item`, and `attachment` are generated, and
  pinned installs stay consistent.
* Bad, because installing an item may also try to write a component the user
  has customized; the CLI then asks before overwriting (or skips it in
  non-interactive runs).

### Confirmation

`generator/tests/registry/build.test.ts` checks that items ship every imported
component; `tests/registry/install.test.ts` installs `button` first and then
items that ship it again, and asserts the identical files are skipped without
prompts; `tests/visual` covers the new components against upstream.

## Pros and Cons of the Options

### Ship the files in the item

* Good, because it is self-contained and works at any pinned ref.

### `registryDependencies` with GitHub addresses

* Bad, because dependencies resolve at the default branch, not the pinned ref,
  and need network resolution during local registry tests.

### Keep them unsupported

* Bad, because several static upstream components would remain unavailable for
  no behavioral reason.
