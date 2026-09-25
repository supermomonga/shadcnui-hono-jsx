# Architecture

This document describes how shadcnui-hono-jsx turns upstream shadcn/ui
components into Hono JSX components, and records the conclusions of the initial
investigation. Individual decisions are recorded as ADRs in [`adr/`](./adr/).

## Data flow

```
ui.shadcn.com registry (base-nova)
  → upstream:sync      → upstream/ (committed snapshot + lock.json)
  → analyzer           → facts + classification (direct / native-adapter / custom-adapter / unsupported)
  → transformers       → Hono JSX source (ts-morph, adapters)
  → emit               → components/ui/*.tsx, styles/shadcn/*.css (Biome-formatted)
  → registry/manifest  → registry.json, compatibility.json, README table
```

## Directory ownership

| Path | Owner |
| --- | --- |
| `generator/` | hand-written generator code |
| `generator/src/adapters/` | hand-written translation rules (primitive table, component adapters) |
| `upstream/` | `upstream:sync` only |
| `components/ui/`, `styles/shadcn/`, `registry.json`, `compatibility.json` | `generate` only |
| `examples/` | hand-written demo apps |

## Investigation results

### Can the shadcn CLI install items into a Hono project without React-oriented initialization?

Yes, with universal registry items. Verified on 2026-09-25 with `shadcn@4.21.0`
and Bun 1.3.13 against a clean project that only depends on `hono`:

- An item with `type: "registry:item"` whose files all have
  `type: "registry:file"` and a `~/`-prefixed `target` is installed by
  `shadcn add <built-item>.json --cwd <app> --yes --overwrite` without prompts.
- No `components.json` is created and no framework detection runs.
- npm `dependencies` of the item are installed with the detected package manager
  (Bun), and the file is written byte-for-byte to the target path.
- The installed component renders with `hono/jsx` and type-checks with
  `tsc` 6.0.3.

Caveats from the CLI source: universal installs skip all transforms (imports are
not rewritten), silently ignore `css`/`cssVars`, and `--dry-run`/`--diff`/`--view`
fall back to the non-universal path. TypeScript 6 reports `baseUrl` as
deprecated, so consumer `tsconfig.json` examples use `paths` only.

### Which shadcn/ui interface is best for retrieving official registry items?

The built style registry served by ui.shadcn.com, which is also what
`shadcn add` consumes (see [ADR 0004](./adr/0004-snapshot-the-built-base-nova-registry-json-as-the-upstream-source.md)):

- Items: `https://ui.shadcn.com/r/styles/base-nova/<name>.json`
  (`{ name, type, dependencies, files: [{ path, type, content }] }`).
- Index: `https://ui.shadcn.com/r/styles/base-nova/registry.json` (no content).
- Theme: the CLI's preset endpoint
  `https://ui.shadcn.com/init?base=base&style=nova&baseColor=neutral&...`
  (`registry:base` with `cssVars` and `css`).
- `shadcn/tailwind.css` (custom variants such as `data-horizontal`) from the
  pinned `shadcn` npm package.

The `shadcn-ui/ui` repository source is not used: it contains unresolved `cn-*`
style tokens, and the built JSON is not tracked in git. The `shadcn/registry`
programmatic API resolves the same URLs but defaults to the Radix
`new-york-v4` style, so plain `fetch` of full URLs is simpler.

Upstream item `dependencies` are incomplete (they list only `cn` even when
`class-variance-authority` is imported), so registry dependencies are derived
from the imports of the generated files.

### Which upstream utility dependencies are framework-neutral?

| Package | Used for | React dependency |
| --- | --- | --- |
| `cn` 0.4.x | class merging (`clsx` + `tailwind-merge` replacement); upstream components import `{ cn } from "cn"` | none |
| `class-variance-authority` 0.7.x | variants (`cva`, `VariantProps`) | none (depends on `clsx` only) |
| `tw-animate-css` 1.4.x | animation utilities imported by the theme | none |

They are kept verbatim, so no `lib/utils` item is needed. Base UI
(`@base-ui/react/*`), `lucide-react`, and the icon placeholder are React-only
and never appear in generated output.

### What minimum metadata tracks exact upstream revisions reproducibly?

Per item, `upstream/lock.json` stores the item URL, the sha256 of the stored
JSON, `contentSha256` (sha256 over file paths and contents), ETag,
Last-Modified, fetch time, and a best-effort `shadcn-ui/ui` main commit. The
minimum needed to reproduce a generated file is the style, the item URL, and
`contentSha256` together with the committed snapshot; generated headers cite
`contentSha256`, the best-effort commit, and the `shadcn` package version whose
`tailwind.css` is vendored.

### What is the cleanest Hono type for intrinsic element props?

`JSX.IntrinsicElements[T]` from `import type { JSX } from "hono/jsx"`: it
resolves to element-specific attribute types (for example
`ButtonHTMLAttributes` with `type` and `disabled`). The per-element interfaces
are not exported by name, and `JSX.HTMLAttributes` carries a
`[attr: string]: any` index signature, so generated files intersect it with
`{ class?: string | undefined; className?: never; render?: never; asChild?: never }`
instead of using `Omit` (which would erase every known attribute).
See [ADR 0006](./adr/0006-generated-components-accept-class-through-a-file-local-componentprops-intersection-type.md).

### Should generated components use `class` or keep a `className` alias?

`class` only. Hono JSX renames `className` to `class` but renders both if both
are passed, does not support array/object class values, and types `class` as
`string | Promise<string>`. Components bind `class` to the upstream local name
`className`, so upstream bodies stay unchanged, and `className` is a type error.

### How much upstream structure can be handled generically?

All ten Tier A components translate through the generic pipeline with no
component adapter. Stateless Base UI primitives (Button, Input, Separator) are
data in the primitive table, and Badge's `useRender` + `mergeProps` pattern is
handled by a generic step. The boundary for adapters is behavior: anything that
needs hooks, context, event handlers, portals, or client state is either a
native adapter (browser primitive with behavior, Tier B) or a custom adapter.
See [ADR 0005](./adr/0005-translate-components-with-ts-morph-steps-a-declarative-base-ui-primitive-table-and-adapters.md)
and [ADR 0007](./adr/0007-preserve-the-upstream-dom-contract-and-omit-render-aschild-and-refs.md).

## Translation pipeline

`generator/src/transformers/pipeline.ts` applies these steps to the upstream
source (ts-morph, syntax only), then prepends the generated header and formats
with the pinned Biome (`biome check --write`, which also sorts imports):

| Step | Effect |
| --- | --- |
| `remove-directives` | drops `"use client"` |
| `cn-markers` | `cn-font-heading` to `font-heading`; other `cn-*` classes removed (as the shadcn CLI does at install time) |
| `use-render` | canonical `useRender({ defaultTagName, props: mergeProps(...), state })` to an intrinsic element; `state` entries become `data-*` attributes |
| `primitives` | mapped Base UI primitives to intrinsic elements with their SSR attributes |
| `react-types` | `React.ComponentProps<"x">`, `useRender.ComponentProps<"x">` to `ComponentProps<"x">`; `React.ReactNode` to `Child` |
| `class-attr` | `className` parameter binding to `class: className`; `className=` to `class=` |
| `dom-attributes` | React camelCase DOM attributes Hono does not normalize (`tabIndex`, `readOnly`, ...) to lowercase |
| `drop-props` | removes unused `render`/`asChild` bindings |
| `helpers` | inserts the `ComponentProps` helper type |
| `imports` | removes `react` and `@base-ui/*`; adds `hono/jsx` type imports |
| `guard` | fails on any leftover React/Base UI construct, unresolved JSX component, or export change |

## Determinism

- Generation reads only `upstream/` and the generator source.
- Headers contain no timestamps; the revision is the item's `contentSha256`.
- Output is formatted by the pinned Biome; `bun run generate --check` fails if
  any generated file differs from disk or an unexpected file exists.

## Classification

`bun run analyze` classifies every snapshotted `registry:ui` item from parsed
facts (imports, React type/value usage, hooks, JSX attributes, `cn-*` markers):

| Kind | Meaning |
| --- | --- |
| `direct` | Plain HTML/Tailwind/variants, possibly via a stateless Base UI primitive mapped in `generator/src/adapters/primitives/base-ui.ts` or the canonical `useRender` pattern |
| `native-adapter` | Maps onto a browser primitive with behavior (e.g. `<dialog>`); none yet |
| `custom-adapter` | Blocking reasons all resolved by an adapter in `generator/src/adapters/components/` |
| `unsupported` | At least one blocking reason (unmapped Base UI primitive, React hooks/runtime APIs, event handlers, icon placeholder, registry imports, unknown packages, ...) |

Reasons are machine-readable (`code` or `code:detail`), sorted, and recorded in
the compatibility manifest. Generation fails if a configured component is
`unsupported`, which surfaces upstream changes that need a new rule.
