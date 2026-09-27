---
number: 35
title: Offer component demos as oEmbed embeds and share one committed social image
status: accepted
date: 2026-09-27
links:
- target: 33
  kind: extends
---

# Offer component demos as oEmbed embeds and share one committed social image

## Context and Problem Statement

Links to the documentation site (ADR 0033) are shared on X, Slack, Discord,
Mastodon, Misskey and in editors such as Notion and WordPress. Pages had a
title and a description but no image, so previews were a line of text. The
site should preview well everywhere, with an image that shows the components
rather than only a title, and support oEmbed. The site is static; the only
Worker serves `/api/preset`. How are the image and oEmbed provided?

## Decision Drivers

* X, Slack, Discord and Facebook build previews from Open Graph and X Card
  tags; they need an absolute 1200×630 image.
* Consumers treat oEmbed differently: Slack prefers it over Open Graph,
  Mastodon keeps no description for a `link` response and falls back to Open
  Graph for `rich` ones, Discord reads its provider, and Notion (Iframely),
  WordPress and Misskey can show a `rich` response's frame.
* The image should show the components as they render, and stay reviewable in
  pull requests.
* Deploys run in CI without a browser, and the site's static output has
  Cloudflare's file limits.

## Considered Options

* A committed image from a screenshot script, and static `rich` oEmbed
  responses for component pages that embed their demo
* An image rendered by the build with Playwright
* An image drawn with Satori (JSX to SVG to PNG)
* A per-page image with the page's title, as ui.shadcn.com does
* An oEmbed endpoint in the Worker for every page

## Decision Outcome

Chosen option: "A committed image from a screenshot script, and static
`rich` oEmbed responses for component pages that embed their demo", because
the image shows the real components without adding a browser to the build,
and the oEmbed responses add something Open Graph cannot, a live demo, while
leaving the previews of consumers that do not frame it to Open Graph.

* Every page has Open Graph tags, `twitter:card` `summary_large_image`, one
  image (`site/public/og.png`, 1200×630), the theme colors, and icons
  (`favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, a web manifest with
  192 and 512 pixel icons).
* `bun run site:images` (`site/scripts/images.ts`) starts the Vite dev server,
  takes a screenshot of `/og-image` (the home page's cards beside the site's
  name; `disableSSG`, so it is not built) with `playwright-core`, pinned to
  the visual tests' Playwright version so that they share a browser, and
  renders the icons from `favicon.svg`. The images are committed.
* `/embed/<name>` renders a component's demo (`<name>-demo`) alone with a bar
  linking to its page, without being indexed. `/oembed/<name>.json` is its
  static oEmbed response, type `rich`: a frame of the embed, the page's title
  and description, and the social image as the thumbnail. Component pages
  link to it with an oEmbed discovery `<link>`.
* The smoke test checks that the head's links, the image and the frames of
  the oEmbed responses resolve.

### Consequences

* Good, because every preview shows the components, and deploys need no
  browser.
* Good, because editors that frame oEmbed responses embed a live,
  interactive demo.
* Bad, because the image goes stale until someone runs `site:images` after
  the home page's cards or the site's name change.
* Bad, because Slack prefers oEmbed and may show a component page's preview
  without its description.
* Neutral, because other pages rely on Open Graph alone; an oEmbed response
  for them would have nothing to embed.

### Confirmation

`bun run site:smoke` fails when a page links to a missing icon, image or
oEmbed response, when an oEmbed frame is missing, or when `/og-image` is
built.

## Pros and Cons of the Options

### An image rendered by the build with Playwright

* Good, because the image never goes stale.
* Bad, because every build and deploy, in CI too, needs Chromium.

### An image drawn with Satori (JSX to SVG to PNG)

* Good, because it needs no browser.
* Bad, because Satori supports a subset of CSS and cannot render the
  components with their Tailwind classes, so the image could only show text.

### A per-page image with the page's title, as ui.shadcn.com does

* Good, because each page's preview names it.
* Bad, because previews already carry the title, and the image would not
  show the components.

### An oEmbed endpoint in the Worker for every page

* Good, because it could honor `maxwidth` and `maxheight`.
* Bad, because the Worker would read pages through an assets binding, and
  pages other than components have nothing to embed.
