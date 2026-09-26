---
number: 4
title: Snapshot the built base-nova registry JSON as the upstream source
status: accepted
date: 2026-09-25
links:
- target: 30
  kind: amendedby
---

# Snapshot the built base-nova registry JSON as the upstream source

## Context and Problem Statement

The generator needs the current shadcn/ui (Base UI variant) component source,
theme, and supporting CSS, and must record exactly which upstream revision each
generated file came from. How should upstream be retrieved and pinned so that
generation is reproducible and upstream changes can be reviewed?

Findings (2026-09-25, `shadcn@4.21.0`):

* `base-nova` is the default Base UI style (`shadcn init --defaults`).
* `https://ui.shadcn.com/r/styles/base-nova/button.json` (one URL per item) serves each built item
  with complete source; the style index `registry.json` lists 216 items (63 `registry:ui`).
* The source in `shadcn-ui/ui` (`apps/v4/registry/bases/base/ui/*.tsx`) contains
  unresolved `cn-*` style tokens that the upstream build expands with
  `transformStyle` and `registry/styles/style-nova.css`. The built JSON is not
  tracked in git (`apps/v4/.gitignore`), so no commit contains the served files.
* The registry JSON has no version or hash; only `ETag`/`Last-Modified` headers.
* The theme (CSS variables, `@layer base`, `--font-heading`) is only available
  complete from the `init` endpoint the CLI uses for presets
  (`/init?base=base&style=nova&baseColor=neutral`). Its color values equal
  `r/colors/neutral.json` (`cssVarsV4`), which lacks `css` and `cssVars.theme`.

## Decision Drivers

* Prefer supported registry interfaces over scraping or internal build steps.
* Reproducible, offline, deterministic generation.
* Exact per-item revision tracking and reviewable upstream diffs.

## Considered Options

* Snapshot the built registry JSON into the repository with a content-hash lock
* Rebuild from `shadcn-ui/ui` at a pinned commit by replaying `transformStyle`
* Fetch the registry live during every generation

## Decision Outcome

Chosen option: "Snapshot the built registry JSON with a content-hash lock",
because it relies only on the registry the shadcn CLI itself consumes, keeps
generation offline and deterministic, and turns upstream changes into
reviewable diffs.

* `bun run upstream:sync` writes `upstream/base-nova/items/<name>.json` for all
  tracked (`registry:ui`) items, `index.json` (tracked subset of the index),
  `theme.json` (the `init` response), `shadcn-tailwind.css` (from the pinned
  `shadcn` devDependency), and `upstream/lock.json`.
* A lock entry records the URL, sha256 of the stored JSON, `contentSha256`
  (paths + contents only), ETag, Last-Modified, fetch time, and a best-effort
  `shadcn-ui/ui` main commit. Entries change only when content changes, so
  repeated syncs produce no diff.
* Generation reads only the snapshot. Generated headers cite `contentSha256`,
  the best-effort commit, and the `shadcn` version.

### Consequences

* Good, because every generated file is traceable to an exact upstream content
  hash, and `upstream/` diffs show upstream changes verbatim.
* Good, because generation and CI need no network access.
* Bad, because old upstream revisions cannot be re-fetched; the committed
  snapshot is the only record.
* Bad, because the upstream commit is only a reference (the served files are not
  in git), and the theme depends on the CLI's `init` endpoint, which is less
  formally documented than `/r/` items. If it disappears, fall back to
  `r/colors/<base>.json` plus the style item's `css`.

### Confirmation

`generator/tests/upstream/sync.test.ts` covers idempotency, ETag churn, added,
changed, and removed items. The upstream-check workflow runs the sync and opens
a PR with the resulting diff.

## Pros and Cons of the Options

### Snapshot built registry JSON

* Good, because it uses the same data as `shadcn add`.
* Good, because it is simple and deterministic.
* Neutral, because the snapshot adds ~70 files of upstream data to the repo.

### Rebuild from a pinned upstream commit

* Good, because the revision is an exact git SHA.
* Bad, because it couples the project to upstream's internal repository layout
  and build script semantics, which are not a public interface.

### Live fetch on every generation

* Good, because there is no snapshot to maintain.
* Bad, because generation would be non-deterministic and CI freshness checks
  would fail whenever upstream deploys.
