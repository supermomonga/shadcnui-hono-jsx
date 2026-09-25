---
number: 11
title: Dispatch CI for upstream sync pull requests instead of using a bot token
status: accepted
date: 2026-09-25
links:
- target: 10
  kind: amends
---

# Dispatch CI for upstream sync pull requests instead of using a bot token
## Context and Problem Statement

ADR 0010 planned an `UPSTREAM_BOT_TOKEN` secret so that CI runs on the
upstream sync pull request. Creating that token (a GitHub App or fine-grained
personal access token) requires the GitHub web UI, and reusing a maintainer's
CLI token would store a broad personal credential as a repository secret.

GitHub's current documentation (checked 2026-09-25) states that `pull_request`
runs for pull requests created or updated with `GITHUB_TOKEN` wait for approval
by a user with write access, while `workflow_dispatch` and
`repository_dispatch` events triggered by `GITHUB_TOKEN` always create runs.
Separately, `GITHUB_TOKEN` can only open pull requests when the repository
allows GitHub Actions to create pull requests.

## Decision Drivers

* CI should run on sync pull requests without manual steps.
* No long-lived personal or broad-scope credentials in repository secrets.
* Merging must still require a human (no auto-merge).

## Considered Options

* Dispatch the CI workflow on the pull request branch with `GITHUB_TOKEN`
* Store a bot token (GitHub App or fine-grained PAT) as `UPSTREAM_BOT_TOKEN`
* Approve the pending `pull_request` run manually on each sync pull request

## Decision Outcome

Chosen option: "Dispatch the CI workflow on the pull request branch", because
it runs CI automatically with no secret to create, rotate, or leak.

* `ci.yml` also accepts `workflow_dispatch`.
* `upstream-check.yml` creates the pull request with `GITHUB_TOKEN` and, when
  the pull request was created or updated, runs
  `gh workflow run ci.yml --ref upstream/base-nova` (`actions: write`). The
  dispatched jobs report check runs on the branch head commit, so they appear
  on the pull request and satisfy required status checks.
* The repository setting "Allow GitHub Actions to create and approve pull
  requests" is enabled; default workflow permissions stay read-only.
* `main` is protected: the `check`, `examples`, and `registry-install` checks
  are required for pull requests, force pushes and deletion are blocked, and
  administrators may still push directly (the project's direct-to-`main`
  workflow). Repository auto-merge stays disabled.

This replaces the `UPSTREAM_BOT_TOKEN` part of ADR 0010; the rest of ADR 0010
still applies.

### Consequences

* Good, because no credential has to be created or rotated.
* Good, because sync pull requests show CI results without a manual approval.
* Bad, because a `pull_request` run awaiting approval also appears on the pull
  request; it can be ignored or approved.
* Neutral, because approving pull requests via Actions is allowed at the
  repository level; the workflows here never approve or merge.

### Confirmation

A manual `workflow_dispatch` run of `ci.yml` succeeds, and the upstream-check
workflow runs end to end. The branch protection and Actions settings can be
inspected with `gh api repos/supermomonga/shadcnui-hono-jsx/branches/main/protection`
and `gh api repos/supermomonga/shadcnui-hono-jsx/actions/permissions/workflow`.

## Pros and Cons of the Options

### Dispatch CI with `GITHUB_TOKEN`

* Good, because it needs no secret.
* Bad, because the CI run is not linked to the `pull_request` event (for
  example, it has no pull request context), which the current CI does not use.

### Bot token

* Good, because CI runs as a normal `pull_request` event.
* Bad, because the token must be created in the web UI, stored, and rotated.

### Manual approval

* Bad, because CI would not run until a maintainer acts.
