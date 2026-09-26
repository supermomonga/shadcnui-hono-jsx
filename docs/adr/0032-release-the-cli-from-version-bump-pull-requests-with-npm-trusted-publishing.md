---
number: 32
title: Release the CLI from version bump pull requests with npm trusted publishing
status: accepted
date: 2026-09-27
links:
- target: 29
  kind: amends
---

# Release the CLI from version bump pull requests with npm trusted publishing

## Context and Problem Statement

ADR 0029 publishes the `shadcnui-hono-jsx` CLI to npm. Publishing by hand
means running `npm publish` in `cli/` with the maintainer's npm login and
two-factor prompt, and tagging the release separately, so releases depend on
one machine and are easy to get out of step with the repository. How should
versions be bumped, tagged and published?

## Decision Drivers

* A release is a reviewed change in the repository, and tags match what npm
  has.
* No long-lived npm token is stored in the repository.
* The same flow as the maintainer's other projects
  (`supermomonga/shadcn_view_components`).

## Considered Options

* A version bump pull request, then tagging and publishing on merge
* Publishing on pushed tags
* Publishing by hand

## Decision Outcome

Chosen option: "A version bump pull request, then tagging and publishing on
merge", chosen by the project owner, because every release goes through CI
and review and needs no local credentials.

* The Version Bump workflow (`workflow_dispatch` with patch, minor, major or
  an explicit version) bumps `version` in `cli/package.json` with
  `supermomonga/action-bump-cli`, opens a `release/v<version>` pull request
  and dispatches CI for it (ADR 0011).
* The Release workflow runs on every push to `main`. When the version in
  `cli/package.json` differs from the previous commit's,
  `salsify/action-detect-and-tag-new-version` tags `v<version>`, the package
  is published with `npm publish` in `cli/` (`prepack` bundles
  `dist/bin.js`), and a GitHub release with generated notes is created.
* npm authenticates the workflow through trusted publishing (OIDC,
  `id-token: write`), with provenance; the package's trusted publisher is
  `supermomonga/shadcnui-hono-jsx`, workflow `release.yml`.
* Version 0.1.0 is published by hand, because a trusted publisher can only be
  configured for an existing package.

### Consequences

* Good, because releases need no npm token or local login, and packages carry
  provenance.
* Good, because the tag, the GitHub release and the npm version come from the
  same commit.
* Bad, because a failed publish after tagging needs a manual `npm publish` or
  a new patch release; the workflow only acts on a version change.
* Neutral, because pushes to `main` that do not change the version run a
  short job that does nothing.

### Confirmation

The release pull request runs the required checks, including `cli-install`,
which packs the CLI with `npm pack` and runs it with Node. The Release
workflow's log shows the detected version, and npm shows the provenance of
each version.

## Pros and Cons of the Options

### Version bump pull request, publish on merge

* Good, because the version change is reviewed with CI before it is released.
* Bad, because it adds two workflows and third-party actions (pinned by
  commit).

### Publish on pushed tags

* Good, because it needs one workflow.
* Bad, because tags are pushed from a local clone without CI on the version
  change, and the tag and `package.json` can disagree.

### Publish by hand

* Good, because it needs no workflow.
* Bad, because it depends on the maintainer's machine and two-factor prompt,
  and tagging is a separate step.

## More Information

On npmjs.com, the trusted publisher is set under the package's settings, or
with `npm trust github shadcnui-hono-jsx --file release.yml --repo
supermomonga/shadcnui-hono-jsx --allow-publish`. After that, publishing
access can require two-factor authentication and disallow tokens.
