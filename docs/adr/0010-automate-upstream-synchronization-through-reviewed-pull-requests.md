---
number: 10
title: Automate upstream synchronization through reviewed pull requests
status: accepted
date: 2026-09-25
---

# Automate upstream synchronization through reviewed pull requests

## Context and Problem Statement

Upstream shadcn/ui changes continuously. The project should notice changes,
regenerate affected components, and surface the result for review, but upstream
changes can alter behavior or break translation rules. How much of this should
be automated?

## Decision Drivers

* The specification requires an automated sync workflow that creates or updates
  a PR and forbids automatic merging or releasing.
* Reviewers need to see what changed upstream, not only the regenerated output.
* Translation failures must be visible instead of silently skipped.

## Considered Options

* Scheduled workflow that syncs, regenerates, verifies, and opens a PR with a
  diff report; never merges
* Scheduled workflow that auto-merges when verification passes
* Manual syncs only

## Decision Outcome

Chosen option: "Scheduled workflow that opens a PR and never merges".

* `.github/workflows/upstream-check.yml` runs weekly and on demand. It updates
  the pinned `shadcn` package, runs `bun run upstream:sync --report`, then
  `generate` and `verify` (both allowed to fail), and opens or updates the
  `upstream/base-nova` PR via `peter-evans/create-pull-request`.
* The report lists added, changed, and removed items, which generated
  components are affected, classification changes, and unified diffs of the
  upstream sources, theme, and vendored CSS (truncated below GitHub's PR body
  limit).
* If generation or verification fails, the PR is a draft labelled
  `needs-adapter`; the fix is a transformer, adapter, or config change.
* Nothing merges or releases automatically. Protect `main` so the PR needs
  review.
* PRs opened with `GITHUB_TOKEN` do not trigger CI; the workflow uses an
  `UPSTREAM_BOT_TOKEN` secret (GitHub App or fine-grained token) when present
  and otherwise includes the verification outcome in the PR body.

### Consequences

* Good, because upstream drift is detected within a week with a reviewable diff.
* Good, because translation breakage is explicit (draft + label) rather than
  shipped.
* Bad, because without `UPSTREAM_BOT_TOKEN` a maintainer must re-run CI on the
  PR manually (for example by pushing an empty commit).
* Neutral, because the tracked snapshot covers every upstream `registry:ui`
  item, so changes to not-yet-generated components also produce PRs.

### Confirmation

`generator/tests/upstream/report.test.ts` covers the report, and
`generator/tests/upstream/sync.test.ts` covers idempotent syncs so the workflow
opens no PR when upstream is unchanged.

## Pros and Cons of the Options

### PR without auto-merge

* Good, because humans review behavior changes before they ship.

### Auto-merge on green

* Bad, because green checks cannot prove that upstream behavior changes are
  acceptable, and the specification forbids it.

### Manual syncs

* Bad, because upstream drift would go unnoticed.
