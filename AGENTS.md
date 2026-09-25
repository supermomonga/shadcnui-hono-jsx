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
| `registry.json`, `compatibility.json` | `bun run generate` |
| README compatibility table (between markers) | `bun run generate` |

## Workflow

- Run `bun run verify` before every commit.
- Commit generated output together with the generator change that produced it.
- Record non-obvious architecture, dependency, API, or distribution decisions as
  ADRs in `docs/adr/` with the `adrs` CLI
  (`adrs new --no-edit "<title>"`, then fill in the MADR sections,
  `adrs status <n> accepted`, `adrs generate toc > docs/adr/README.md`).
- See `docs/architecture.md` for the pipeline and its invariants.

## Dependency policy

- Generated components must never import `react`, `react-dom`, `@base-ui/*`,
  `@radix-ui/*`, `radix-ui`, or `lucide-react`. A test enforces this.
- Registry items may only depend on the allowlisted npm packages in
  `generator/src/policy.ts`. Adding one requires an ADR.
- Minimum supported Hono version: 4.12.34 (JSX security fixes).
