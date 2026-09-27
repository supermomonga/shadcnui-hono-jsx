# AGENTS.md

Guidance for coding agents and contributors working on shadcnui-hono-jsx.

## Key rule

**Upstream owns design. This project owns translation and Hono behavior.**

## Never edit by hand

These paths are written by scripts. If their content is wrong, fix the
generator (transformer, adapter, or config) and regenerate.

| Path | Written by |
| --- | --- |
| `upstream/**` (including `upstream/site/`, the documentation site's sources) | `bun run upstream:sync` |
| `cli/generated/**` (templates, `catalog.json`, icon sets, vendored `tailwind.css` and `shadcn/preset`, the license notices) | `bun run generate` (notice text lives in `generator/src/licenses.ts`) |
| `cli/LICENSE`, `compatibility.json` | `bun run generate` (license text lives in `generator/src/licenses.ts`) |
| `docs/compatibility.md` | `bun run generate` |
| `components/ui/`, `styles/shadcn/`, `public/shadcn/`, `LICENSE-shadcnui-hono-jsx.txt`, `shadcnui-hono-jsx.json` at the root (git-ignored) | `bun run dev:install` |
| `site/generated/**` (translated examples, component pages, icons) | `bun run site:generate` |
| `site/.installs/`, `site/public/shadcn/`, `site/.cache/` (git-ignored) | `bun run site:install`, `bun run site:build` |
| `site/public/og.png`, `favicon.ico`, `apple-touch-icon.png`, `icon-*.png` (the social image from `site/app/routes/og-image.tsx`, the icons from `favicon.svg`) | `bun run site:images` |

Components reach users through the `shadcnui-hono-jsx` CLI in `cli/`
(docs/adr/0029): it builds the theme from a shadcn/ui preset and installs the
templates of `cli/generated/templates/<style>/` through `finalize`
(docs/adr/0030). Every Base UI style in `generator.config.ts` is snapshotted
and translated, and a component must translate in all of them; styles differ
only in classes, so translation rules must not depend on class strings. Menu
color and RTL variants are translated from upstream source transformed by the
pinned shadcn package's own transforms (`generator/src/variants.ts`) and
stored in `<style>/<variant>/` where they differ; client scripts read the CSS
direction for arrow keys. The
CLI sources in `cli/src/` are hand-written; use Node APIs
only, so the package runs under Node as well as Bun. The repository root is a
development install of the default preset, which tests, type checking, the
visual tests and the examples use; run `bun run dev:install` after generating.

Client scripts in `cli/client/` are hand-written (Base UI's behavior is React
code) and installed as they are into `public/shadcn/`; see docs/adr/0025. Keep
them dependency-free ES modules that find components by `data-slot`.

Lite alternatives (`<upstream>-lite`, docs/adr/0028) are hand-written in
`lite/` in upstream's style and generated like ports, once per style. Their
style-dependent classes are `lite:<key>` tokens computed from upstream parts
by the recipes in `generator/src/lite.ts` (docs/adr/0030). When `generate`
reports that an upstream base changed, review the alternative against the new
upstream item in every style and then update its revision in
`generator/src/lite.ts`.

The documentation site in `site/` (docs/adr/0033) is HonoX, rendered to
static pages (`site/dist/`) and deployed with a Worker for `/api/*` to
Cloudflare Workers at `shadcn-hono.omofla.sh` by `site-deploy.yml` when main
changes. It renders components installed by the CLI (`bun run site:install`
into `site/.installs/`), never the templates directly. The pages follow
ui.shadcn.com; its hand-written docs are MDX in `site/content/docs/`, in
English. Changing the CLI's commands or flags means updating the site's docs
and the commands it shows. Component pages and their examples are translated
from shadcn/ui's website by `bun run site:generate` (docs/adr/0034); when it
reports a function that needs React, write an override in
`site/examples/overrides/<example>.tsx` (Hono JSX, the components' native
behavior or client scripts instead of state) and record it with the reported
hash in `site/examples/overrides.ts`. Hand-written component pages go to
`site/content/docs/components/`. Link previews share one social image; run
`bun run site:images` when the home page's cards or the site's name change,
and commit the images (docs/adr/0035).

## Commands

| Command | Purpose |
| --- | --- |
| `bun run upstream:sync [--report file]` | Update the upstream snapshot |
| `bun run analyze [name...]` | Classify upstream components |
| `bun run generate [name...] [--check]` | Regenerate generated outputs |
| `bun run dev:install` | Install the default preset and every component into the repository root |
| `bun run cli <command>` | Run the CLI from the repository |
| `bun run verify` | Development install, lint, type-check, test (with the site), freshness check |
| `bun run test:visual` | Visual parity against upstream React (`tests/visual`, Playwright) |
| `bun run test:visual:styles` | Visual parity in every Base UI style, in the menu color and RTL variants and with every icon library |
| `bun run verify:full` | `verify` plus the site build, examples, the network CLI install test and visual parity |
| `bun run site:generate [--check]` | Translate the site's upstream examples and pages into `site/generated/` |
| `bun run site:dev` | Install the site's components and run its Vite dev server |
| `bun run site:build` | Build the documentation site into `site/dist/` (`site:smoke` checks it, `site:serve` serves it) |
| `bun run site:images` | Render the site's social image and icons into `site/public/` (needs Playwright's Chromium) |
| `bun run site:deploy` | Build and deploy the site with wrangler (CI does this from main) |

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
- To release the CLI, run the Version Bump workflow (patch, minor, major or
  an explicit version). Merging its release pull request makes the Release
  workflow tag `v<version>`, publish to npm with trusted publishing and create
  a GitHub release (docs/adr/0032). Do not bump `cli/package.json` otherwise.

## Upstream licensing

`bun run generate` refuses to run when the snapshotted upstream licenses
(`upstream/licenses/`) differ from `ACCEPTED_UPSTREAM_LICENSE` in
`generator/src/licenses.ts`. Never update that record or the notice text
mechanically to make generation pass: a maintainer must first decide whether
the new terms still allow redistribution and how. See docs/adr/0013.

## Dependency policy

- Generated components must never import `react`, `react-dom`, `@base-ui/*`,
  `@radix-ui/*`, `radix-ui`, or `lucide-react`. A test enforces this.
- The icon packages (`lucide`, `@tabler/icons`, `@hugeicons/core-free-icons`,
  `@phosphor-icons/core`, `remixicon`) are generation-time devDependencies
  only; icons are inlined into generated files (docs/adr/0031). Their licenses
  are gated like upstream's (`ACCEPTED_ICON_LICENSES`).
- React and Base UI may only be installed in `tests/visual`, which renders
  upstream for comparison. Never add them to the root or example packages.
- Installed components and the theme may only depend on the allowlisted npm
  packages in `generator/src/policy.ts`, besides the `@fontsource-variable/*`
  packages of a preset's fonts (docs/adr/0029). Adding one requires an ADR.
- Minimum supported Hono version: 4.12.34 (JSX security fixes).
