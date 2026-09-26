---
number: 3
title: Commit generated artifacts and verify their freshness in CI
status: accepted
date: 2026-09-25
links:
- target: 28
  kind: amendedby
- target: 30
  kind: amendedby
---

# Commit generated artifacts and verify their freshness in CI

## Context and Problem Statement

Components are generated from upstream shadcn/ui source. The shadcn CLI installs
items from a GitHub source registry by reading the committed root
`registry.json` and the committed source files, so generated files must exist in
the repository. At the same time, generated files must never become
hand-maintained forks, or upstream synchronization breaks down.

## Decision Drivers

* GitHub source registries serve files directly from the repository.
* The specification forbids manual patches to generated output and requires CI
  to verify that committed output is current.
* Reviewers need readable diffs when upstream or generator changes alter output.

## Considered Options

* Commit generated artifacts; CI regenerates and fails on any diff
* Do not commit generated artifacts; build them in CI and publish elsewhere
* Commit generated artifacts without a freshness check

## Decision Outcome

Chosen option: "Commit generated artifacts; CI regenerates and fails on any
diff", because the GitHub source registry requires committed files and the
freshness check is the only reliable guard against hand edits.

* Generated paths (`components/ui/`, `styles/shadcn/`, `registry.json`,
  `compatibility.json`, the README compatibility region) and the upstream
  snapshot (`upstream/`) are written only by scripts and marked
  `linguist-generated` in `.gitattributes`.
* Generated files carry a short header naming the generator, the upstream item,
  its revision, and the conversion mode. Headers contain no timestamps.
* `bun run generate --check` and a `git diff --exit-code` / `git status
  --porcelain` step in CI fail when committed output is stale or hand-edited.
* When output is wrong, the fix goes into a transformer, an adapter, or the
  generator config, followed by regeneration.

### Consequences

* Good, because users can install directly from the GitHub repository.
* Good, because every output change is visible and reviewable in a diff.
* Bad, because generator changes produce larger commits that include output.

### Confirmation

The CI `check` job runs `bun run generate` and then fails if the working tree
changed. `bun run verify` includes `generate --check` locally.

## Pros and Cons of the Options

### Commit and verify

* Good, because it satisfies the GitHub source registry model.
* Good, because hand edits are caught automatically.

### Build in CI only

* Good, because the repository stays smaller.
* Bad, because the GitHub source registry would have nothing to serve.

### Commit without verification

* Bad, because hand edits and stale output would go unnoticed.
