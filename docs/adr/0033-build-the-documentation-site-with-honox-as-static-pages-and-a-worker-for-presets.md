---
number: 33
title: Build the documentation site with HonoX as static pages and a Worker for presets
status: accepted
date: 2026-09-27
links:
- target: 29
  kind: extends
---

# Build the documentation site with HonoX as static pages and a Worker for presets

## Context and Problem Statement

Components reach users through the CLI (ADR 0029), but there is no place to
see them, read how they differ from shadcn/ui, or pick a preset and get the
command that installs it, as ui.shadcn.com offers for shadcn/ui. The site
should follow ui.shadcn.com (Home, Docs, Components, Create), be built with
HonoX, live in this repository, and be deployed to Cloudflare Workers at
`shadcn-hono.omofla.sh` whenever main changes. How should it be built and
served?

## Decision Drivers

* Pages render the generated components, many examples per page and code
  highlighted with Shiki; the Workers Free plan allows 10 ms of CPU per
  request.
* The site uses the components exactly as a user project does, through the
  CLI, so it shows what users install.
* The Create page needs a preset's theme, which comes from
  `https://ui.shadcn.com/init`; that endpoint sends no CORS headers.
* `docs/` holds the Markdown documentation and ADRs.
* React stays out of the repository outside `tests/visual`.

## Considered Options

* HonoX static site generation, plus a Worker for `/api/*`
* HonoX server rendering on Workers for every page
* A static site without a Worker

## Decision Outcome

Chosen option: "HonoX static site generation, plus a Worker for `/api/*`",
because pages cost no CPU at request time and the only dynamic need, the
preset theme, is a small Worker.

* The site is the private workspace `site/`. HonoX with `@hono/vite-ssg`
  renders every page to `site/dist/` (`vite build --mode client && vite
  build`); MDX pages (`site/content/docs/`) compile with `@mdx-js/rollup` for
  `hono/jsx`, and code is highlighted with Shiki at build time.
* The site's components come from `bun run site:install`, which runs the CLI's
  `init` with the upstream snapshot into git-ignored installs
  (`site/.installs/<id>/`), through the same code as `bun run dev:install`
  (`generator/src/dev-install.ts`).
* `site/worker/index.ts` serves `GET /api/preset`, which builds a preset's
  theme with the CLI's own code (`cli/src/preset-theme.ts`, free of file
  system access) from ui.shadcn.com and caches it with the Cache API.
  `wrangler.jsonc` serves `dist/` as static assets, runs the Worker first only
  for `/api/*`, and answers missing pages with `404.html`.
* The Worker `shadcnui-hono-jsx-site` runs on the custom domain
  `shadcn-hono.omofla.sh`. `site-deploy.yml` deploys on pushes to main that
  touch what the site is built from and after each release, with an
  account-owned API token in the `production` environment; CI's `site` job
  builds and checks the same output on pull requests.
* Pages mark items that the latest CLI release on npm does not have as
  "Unreleased", from `site/.cache/release.json` written at build time.
* The site's own dependencies (HonoX, Vite, MDX, Shiki, Lucide for its chrome)
  are in `site/package.json`; wrangler runs through `bunx` at a pinned version
  instead of being installed.

### Consequences

* Good, because requests for pages are static asset hits, with no CPU limit
  or bundle size to watch, and the Worker bundle stays small.
* Good, because the site renders components installed by the CLI, so a broken
  install or translation breaks the site's build.
* Bad, because every content change needs a build and a deploy; there is no
  on-demand rendering.
* Neutral, because the Create page's live theme depends on ui.shadcn.com at
  request time, as `init` does.

### Confirmation

CI's `site` job type-checks, tests (the API returns the `theme.css` that
`init` writes), builds, and runs `site/scripts/smoke.ts`, which checks that
every catalog item has a page, that internal links resolve and that the
output stays within Cloudflare's static asset limits.

## Pros and Cons of the Options

### HonoX static site generation, plus a Worker for `/api/*`

* Good, because it fits the Free plan and keeps highlighted code out of the
  Worker.
* Bad, because the SSG pass and the Worker are two entry points.

### HonoX server rendering on Workers

* Good, because it is HonoX's default deployment.
* Bad, because rendering a component page with many examples can exceed
  10 ms of CPU, and Shiki's output and every install would be bundled into
  the Worker.

### A static site without a Worker

* Good, because there is nothing to run.
* Bad, because the Create page could not show a preset's theme: the browser
  cannot call ui.shadcn.com/init, and snapshotting every combination of
  colors, radius and fonts is not practical.

## More Information

The site's design follows ui.shadcn.com (MIT, shadcn/ui); its stylesheet
vendors the typeset styles of the shadcn/ui website.
