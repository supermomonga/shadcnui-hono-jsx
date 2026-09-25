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
