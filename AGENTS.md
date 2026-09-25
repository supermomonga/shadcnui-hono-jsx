# AGENTS.md

Guidance for coding agents and contributors working on shadcnui-hono-jsx.

## Key rule

**Upstream owns design. This project owns translation and Hono behavior.**

## Never edit by hand

These paths are written by scripts. If their content is wrong, fix the
generator (transformer, adapter, or config) and regenerate.

| Path | Written by |
| --- | --- |
| `upstream/**` | `bun run upstream:sync` |
| `components/ui/**` | `bun run generate` |
| `styles/shadcn/**` | `bun run generate` |
| `LICENSE-shadcnui-hono-jsx.txt` | `bun run generate` (text lives in `generator/src/licenses.ts`) |
| `registry.json`, `compatibility.json` | `bun run generate` |
| README compatibility table (between markers) | `bun run generate` |

Client scripts in `public/shadcn/` are hand-written (Base UI's behavior is
React code) and distributed as they are; see docs/adr/0025. Keep them
dependency-free ES modules that find components by `data-slot`.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run upstream:sync [--report file]` | Update the upstream snapshot |
| `bun run analyze [name...]` | Classify upstream components |
| `bun run generate [name...] [--check]` | Regenerate generated outputs |
| `bun run verify` | Lint, type-check, test, freshness check, registry validation |
| `bun run test:visual` | Visual parity against upstream React (`tests/visual`, Playwright) |
| `bun run verify:full` | `verify` plus examples, the network registry install test and visual parity |

To support another upstream component, add it to `components` in
`generator.config.ts`, add at least one case to `tests/visual/cases.ts` (or a
browser spec listed in `BROWSER_SPECS` for interactive components), run
`bun run analyze <name>`, and resolve blocking reasons
with a primitive rule (`generator/src/adapters/primitives/`), a primitive
family (`generator/src/adapters/families/`, for compound Base UI primitives), a
generic transformer step, or a component adapter
(`generator/src/adapters/components/`).

## Workflow

- Run `bun run verify` before every commit.
- Commit generated output together with the generator change that produced it.
- Record non-obvious architecture, dependency, API, or distribution decisions as
  ADRs in `docs/adr/` with the `adrs` CLI
  (`adrs new --no-edit "<title>"`, then fill in the MADR sections,
  `adrs status <n> accepted`, `adrs generate toc > docs/adr/README.md`).
- See `docs/architecture.md` for the pipeline and its invariants.

## Upstream licensing

`bun run generate` refuses to run when the snapshotted upstream licenses
(`upstream/licenses/`) differ from `ACCEPTED_UPSTREAM_LICENSE` in
`generator/src/licenses.ts`. Never update that record or the notice text
mechanically to make generation pass: a maintainer must first decide whether
the new terms still allow redistribution and how. See docs/adr/0013.

## Dependency policy

- Generated components must never import `react`, `react-dom`, `@base-ui/*`,
  `@radix-ui/*`, `radix-ui`, or `lucide-react`. A test enforces this.
- `lucide` is a generation-time devDependency only; icons are inlined into
  generated files (docs/adr/0016). Its license is gated like upstream's.
- React and Base UI may only be installed in `tests/visual`, which renders
  upstream for comparison. Never add them to the root or example packages.
- Registry items may only depend on the allowlisted npm packages in
  `generator/src/policy.ts`. Adding one requires an ADR.
- Minimum supported Hono version: 4.12.34 (JSX security fixes).
