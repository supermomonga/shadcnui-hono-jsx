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
| `generator/src/adapters/` | hand-written translation rules (primitive table, primitive families, component adapters) |
| `public/shadcn/` | hand-written optional client scripts, installed as they are ([ADR 0025](./adr/0025-ship-optional-client-scripts-for-behavior-the-browser-does-not-provide.md)) |
| `upstream/` | `upstream:sync` only |
| `generator/src/licenses.ts` | hand-written, reviewed licensing record and notice text |
| `components/ui/`, `styles/shadcn/`, `LICENSE-shadcnui-hono-jsx.txt`, `registry.json`, `compatibility.json` | `generate` only |
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

### How should universal registry targets be configured for Hono/HonoX?

Every item is `registry:item` and every file a `registry:file` whose `target`
is `~/` plus its repository path, so installed projects mirror this repository:
`~/components/ui/<name>.tsx` and `~/styles/shadcn/{theme,tailwind}.css`. The
`~/` prefix is the only target form the CLI resolves without components.json.
Generated components import only npm packages (`cn`,
`class-variance-authority`) and `hono/jsx` types, so the CLI's missing import
rewriting for universal items does not matter. Consumers:

- import `@/components/ui/button` with a `paths` alias (`"@/*": ["./*"]`) or a
  relative path;
- import the theme after Tailwind (`@import "tailwindcss";
  @import "./styles/shadcn/theme.css";` adjusted to the stylesheet location);
- make Tailwind scan `components/ui` (HonoX's `source("../app")` needs
  `@source "../components";`).

See [ADR 0008](./adr/0008-distribute-components-as-universal-items-from-a-github-source-registry.md)
and [ADR 0009](./adr/0009-vendor-shadcn-tailwind-css-in-the-theme-item.md).

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
handled by a generic step. Compound primitives (a Root plus parts sharing
context, such as Progress and Dialog) are translated once as families that
rewrite each part in place, so every upstream component on the same primitive
(Dialog, AlertDialog, Sheet) is generated from its unmodified source
([ADR 0019](./adr/0019-translate-compound-base-ui-primitives-as-families-rewritten-in-place.md)).
The boundary is behavior: anything that needs client state or event handlers
is either mapped onto a browser primitive (native family: `<dialog>` with
Invoker Commands, `<details>`/`<summary>` for Accordion and Collapsible,
[ADR 0020](./adr/0020-implement-accordion-and-collapsible-on-native-details-and-summary.md),
native inputs for form controls,
[ADR 0022](./adr/0022-implement-form-controls-on-native-inputs.md), the
`popover` attribute and CSS anchor positioning for Popover,
[ADR 0023](./adr/0023-build-popover-on-the-native-popover-attribute-and-css-anchor-positioning.md),
and the customizable `<select>` for Select,
[ADR 0024](./adr/0024-build-select-on-the-customizable-native-select-element.md))
or given an optional client script (script family: Tabs, Menu, ContextMenu, Menubar, Tooltip, PreviewCard, Slider, Combobox, NavigationMenu, Avatar, ScrollArea,
[ADR 0025](./adr/0025-ship-optional-client-scripts-for-behavior-the-browser-does-not-provide.md)).
See [ADR 0005](./adr/0005-translate-components-with-ts-morph-steps-a-declarative-base-ui-primitive-table-and-adapters.md)
and [ADR 0007](./adr/0007-preserve-the-upstream-dom-contract-and-omit-render-aschild-and-refs.md).

## Translation pipeline

`generator/src/transformers/pipeline.ts` applies these steps to the upstream
source (ts-morph, syntax only), then prepends the generated header and formats
with the pinned Biome (`biome check --write`, which also sorts imports):

| Step | Effect |
| --- | --- |
| `remove-directives` | drops `"use client"` |
| `component-imports` | `@/registry/<style>/ui/<name>` to `./<name>` for generated sibling components ([ADR 0015](./adr/0015-ship-imported-sibling-components-inside-each-registry-item.md)) |
| `cn-markers` | `cn-font-heading` to `font-heading`; other `cn-*` classes removed (as the shadcn CLI does at install time) |
| `icons` | `IconPlaceholder` to a file-local component inlining the Lucide SVG exactly as lucide-react renders it ([ADR 0016](./adr/0016-inline-lucide-icons-at-generation-time.md)) |
| `use-render` | canonical `useRender({ defaultTagName, props: mergeProps(...), render, state })` to an intrinsic element wrapped in `renderElement(…, render)`; `state` entries become `data-*` attributes ([ADR 0018](./adr/0018-support-base-ui-render-props-on-the-server-and-omit-client-only-button-semantics.md)) |
| `memo-hooks` | `useMemo(fn, deps)` to `fn()` and `useCallback(fn)` to `fn` (a server render runs once) |
| `react-context` | `React.createContext`/`React.useContext` to the identical `hono/jsx` functions |
| `families` | compound Base UI primitives (`Progress`, `Dialog`, `AlertDialog`, `Popover`, `Menu`, `Select`, `Tabs`, `Accordion`, `Collapsible`, form controls): each `<Local.Part>` and `Local.Part.Props` to file-local helpers inserted after the imports (only those the file references; contexts that connect parts across sibling files, such as a menubar and its dropdown menus, share a global key) ([ADR 0019](./adr/0019-translate-compound-base-ui-primitives-as-families-rewritten-in-place.md)) |
| `primitives` | mapped Base UI primitives to intrinsic elements with their SSR attributes; `renderable` ones are wrapped in `renderElement(…, render)` and Base UI-only props are consumed |
| `control-state` | other components' reactions to Base UI control state (`has-data-checked:`) to the native `:checked` state ([ADR 0022](./adr/0022-implement-form-controls-on-native-inputs.md)) |
| `react-types` | `React.ComponentProps<"x">`, `useRender.ComponentProps<"x">` to `ComponentProps<"x">`; `React.ComponentProps<typeof X>` to `Parameters<typeof X>[0]`; `React.ReactNode` to `Child` |
| `style-values` | numeric CSS custom property values in `style` objects to strings (Hono appends `px` to numbers) |
| `class-attr` | `className` parameter binding to `class: className`; `className=` to `class=` |
| `dom-attributes` | React camelCase DOM attributes Hono does not normalize (`tabIndex`, `readOnly`, ...) to lowercase |
| `drop-props` | removes unused `asChild` bindings; `asChild ? a : b` becomes `b` |
| `helpers` | inserts the `ComponentProps` helper type (and `renderElement` when `render` is supported) |
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
| `direct` | Plain HTML/Tailwind/variants, possibly via a stateless Base UI primitive mapped in `generator/src/adapters/primitives/base-ui.ts`, an `intrinsic` family (Progress) or the canonical `useRender` pattern |
| `native-adapter` | Maps onto a browser primitive with behavior through a `native` family or component adapter (Dialog, AlertDialog, Sheet: `<dialog>` with Invoker Commands, [ADR 0017](./adr/0017-implement-dialog-on-the-native-dialog-element-with-invoker-commands.md), [ADR 0019](./adr/0019-translate-compound-base-ui-primitives-as-families-rewritten-in-place.md); Accordion, Collapsible: `<details>`/`<summary>`, [ADR 0020](./adr/0020-implement-accordion-and-collapsible-on-native-details-and-summary.md)) |
| `script-adapter` | Behavior from an optional client script in `public/shadcn/`, through a `script` family (Tabs, DropdownMenu, ContextMenu, Menubar, Tooltip, HoverCard, Slider, Combobox, NavigationMenu, Avatar, ScrollArea) or a `script` component adapter that moves an upstream event handler into a script (InputGroup: focusing the input from an addon), [ADR 0025](./adr/0025-ship-optional-client-scripts-for-behavior-the-browser-does-not-provide.md)) |
| `custom-adapter` | Blocking reasons all resolved by an adapter in `generator/src/adapters/components/` |
| `unsupported` | At least one blocking reason (unmapped Base UI primitive, React hooks/runtime APIs, event handlers, icon placeholder, registry imports, unknown packages, ...) |

Reasons are machine-readable (`code` or `code:detail`), sorted, and recorded in
the compatibility manifest. Generation fails if a configured component is
`unsupported`, which surfaces upstream changes that need a new rule.

## Upstream synchronization

`.github/workflows/upstream-check.yml` runs weekly and on demand:

1. bumps the pinned `shadcn` devDependency (source of the vendored
   `tailwind.css`);
2. runs `bun run upstream:sync --report`, which updates `upstream/` and writes a
   Markdown report (added/changed/removed items, affected generated components,
   classification changes, unified diffs);
3. runs `bun run generate` and `bun run verify`, allowing both to fail;
4. opens or updates the `upstream/base-nova` pull request with the report as its
   body. Failed generation or verification makes it a draft labelled
   `needs-adapter`;
5. dispatches `ci.yml` on the pull request branch, because `pull_request` runs
   for pull requests opened with `GITHUB_TOKEN` wait for manual approval.

Nothing is merged or released automatically
([ADR 0010](./adr/0010-automate-upstream-synchronization-through-reviewed-pull-requests.md),
[ADR 0011](./adr/0011-dispatch-ci-for-upstream-sync-pull-requests-instead-of-using-a-bot-token.md)).
The repository allows GitHub Actions to create pull requests, and `main`
requires the `check`, `examples`, `registry-install`, and `visual` checks on pull
requests.
Syncs are idempotent, so an unchanged upstream produces no pull request.

## Test layers

| Layer | Location | Runs in |
| --- | --- | --- |
| Generator unit tests (policy, sync, report, analyzer, transformer steps, theme, registry, manifest) | `generator/tests/` | `bun run test` |
| Render tests (targeted HTML assertions per component) | `tests/render/` | `bun run test` |
| Dependency policy (no React/Base UI imports, allowlisted packages) | `tests/deps/` | `bun run test` |
| Type tests (valid usage and `@ts-expect-error` misuse, strict variant) | `tests/types/` | `bun run typecheck` |
| Freshness of generated files | `bun run generate --check` | `bun run verify`, CI |
| Registry validation | `shadcn registry validate` | `bun run verify`, CI |
| Registry install into a clean Hono project | `tests/registry/` | `bun run test:registry`, CI |
| Example builds and smoke tests | `examples/` | `bun run examples:*`, CI |
| Visual parity against upstream React (Playwright screenshots, light and dark) | `tests/visual/` (separate package) | `bun run test:visual`, CI `visual` |
| Interactive behavior (keyboard, focus, ARIA, no scripts) and open-state screenshots against upstream | `tests/visual/modals.spec.ts` (Dialog, AlertDialog, Sheet), `tests/visual/disclosure.spec.ts` (Accordion, Collapsible), `tests/visual/controls.spec.ts` (form controls), `tests/visual/popover.spec.ts`, `tests/visual/select.spec.ts`, `tests/visual/tabs.spec.ts`, `tests/visual/menu.spec.ts`, `tests/visual/hover.spec.ts`, `tests/visual/slider.spec.ts`, `tests/visual/input-group.spec.ts`, `tests/visual/combobox.spec.ts`, `tests/visual/navigation-menu.spec.ts`, `tests/visual/avatar.spec.ts` and `tests/visual/scroll-area.spec.ts` (step-by-step behavior against Base UI) | `bun run test:visual`, CI `visual` |

`tests/visual` renders the same case data with the generated components and
with the upstream React sources from the snapshot, shares one Tailwind build,
and fails when screenshots differ by more than 0.1% of pixels. It also compares
the normalized DOM and inline SVGs, except for cases that use a component on a
`native-structure` family (`<details>`, `<dialog>`, `popover`, native
inputs and selects), which are compared by pixels and visible icons. React is only
installed in that package
([ADR 0014](./adr/0014-verify-visual-parity-against-upstream-react-renders-in-an-isolated-test-package.md)).

## Licensing

- Every registry item lists `LICENSE-shadcnui-hono-jsx.txt` (target
  `~/LICENSE-shadcnui-hono-jsx.txt`), a fixed notice built from
  `generator/src/licenses.ts`: scope, unofficial-project statement, the shadcn
  and supermomonga copyright notices, and the full MIT text. Generated headers
  stay short and point to it.
- `upstream:sync` snapshots the upstream repository license and the `shadcn`
  package's license (`upstream/licenses/`, `upstream/lock.json`) for review
  only.
- `generate` fails unless those snapshots match `ACCEPTED_UPSTREAM_LICENSE`. A
  license change therefore blocks regeneration, and the upstream-check pull
  request becomes a draft labelled `license-review` with the license diff
  first. A maintainer decides whether redistribution is still allowed and, if
  so, updates the accepted record and the notice together.
- Inlined Lucide icons are covered the same way: the notice reproduces the
  reviewed Lucide license (ISC, with Feather's MIT notice), and
  `ACCEPTED_ICON_LICENSE` gates generation on the pinned `lucide` package's
  license.

See [ADR 0013](./adr/0013-ship-a-reviewed-license-notice-with-every-registry-item-and-gate-upstream-license-changes.md).

## Known limitations

- Server-rendered only; no component ships client JavaScript. Dialog relies on
  Baseline 2025 browser features (Invoker Commands) instead.
- `render` works on the server only; no `asChild` and no ref forwarding.
- Base UI client-side state attributes and behaviors (`focusableWhenDisabled`,
  field state) are not reproduced.
- Upstream items that import non-generated registry items, hooks, or icons
  remain unsupported until those are generated or mapped.
- The theme covers the `base-nova` preset with the neutral base color; fonts
  from the preset are not installed.
