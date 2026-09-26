# shadcnui-hono-jsx

shadcn/ui-compatible components for Hono JSX, without React.

> [!WARNING]
> **Experimental.** This is an unofficial community project. It is not
> affiliated with, maintained by, or endorsed by shadcn or the shadcn/ui
> project. Compatibility with shadcn/ui is partial; see the
> [compatibility table](docs/compatibility.md).

## What it is

A React-free port and code-generation pipeline for using the
[shadcn/ui](https://ui.shadcn.com) design system and component API with
[Hono JSX](https://hono.dev/docs/guides/jsx) and [HonoX](https://github.com/honojs/honox).

Components are generated from the upstream shadcn/ui (Base UI variant) registry
and translated into plain `hono/jsx` function components. You install their
source into your project with the `shadcnui-hono-jsx` CLI, styled by a preset
from [ui.shadcn.com/create](https://ui.shadcn.com/create), much like
`shadcn init --preset`.

## What it is not

Not React running on Hono. There is no React, React DOM, `@hono/react-renderer`,
Base UI, or Radix runtime in the generated components.

## Main benefits

- React-free, native `hono/jsx` components (SSR-first)
- Works with plain Hono and HonoX
- Tailwind CSS v4 and the shadcn/ui design tokens
- Source-code ownership: components are copied into your project, like shadcn/ui
- Presets from ui.shadcn.com/create (every Base UI style, colors, radius, fonts, menu color and accent) and right-to-left layout
- Regenerated from upstream shadcn/ui instead of hand-maintained forks
- JavaScript only where the browser lacks the behavior: most components (including Dialog, Popover, Select and Accordion) ship none, and the rest use small optional module scripts

## Requirements

- [Hono](https://hono.dev) 4.12.34 or newer (JSX security fixes; 4.13.9+
  recommended), with `"jsx": "react-jsx"` and `"jsxImportSource": "hono/jsx"`
  in `tsconfig.json`
- [Tailwind CSS](https://tailwindcss.com) v4
- Bun or Node.js 20+ to run the CLI (`bunx shadcnui-hono-jsx` or
  `npx shadcnui-hono-jsx`); it is not added to your dependencies

## Installation

1. Set up the theme once, in the root of your Hono project. `init` writes
   `shadcnui-hono-jsx.json`, `styles/shadcn/theme.css`,
   `styles/shadcn/tailwind.css` and the license notice
   `LICENSE-shadcnui-hono-jsx.txt`, and installs `tw-animate-css` and the
   preset's fonts with your package manager:

   ```sh
   bunx shadcnui-hono-jsx init                      # the nova preset
   bunx shadcnui-hono-jsx init --preset b0          # a preset code from ui.shadcn.com/create
   ```

   `--pointer` adds the pointer cursor to buttons, and `--rtl` installs
   right-to-left components (set `dir="rtl"` on your `<html>`; the components
   follow the CSS direction and need no provider). The theme comes from
   ui.shadcn.com, like with `shadcn init`, so the command needs network access.
   Presets choose the style (Nova, Vega, Maia, Lyra, Mira, Luma, Sera or
   Rhea), colors, radius, fonts, the icon library, the menu color and the menu
   accent. Remix Icon is under the Remix Icon License v1.0, which is not an
   open source license; the installed notice reproduces it.

2. Import the theme after Tailwind CSS in your stylesheet, and make sure
   Tailwind scans `components/ui`:

   ```css
   @import "tailwindcss";
   @import "../styles/shadcn/theme.css"; /* path relative to this file */
   @source "../components/ui";
   ```

   For HonoX, `app/style.css` typically looks like this:

   ```css
   @import "tailwindcss" source("../app");
   @import "../styles/shadcn/theme.css";
   @source "../components";
   ```

3. Add components. They are written to `components/ui/<name>.tsx`, together
   with the components they import, and install their npm dependencies
   (`cn`, `class-variance-authority`):

   ```sh
   bunx shadcnui-hono-jsx add button card
   ```

   Files you have edited are not replaced unless you pass `--overwrite`.

4. Import them with a path alias (`"paths": { "@/*": ["./*"] }`) or a relative
   path.

To change the preset later, run `apply`. It rewrites the theme and every
installed component (edits to them are lost); `--only theme` or `--only font`
takes only those parts of the new preset and leaves components alone:

```sh
bunx shadcnui-hono-jsx apply --preset <code>
```

`LICENSE-shadcnui-hono-jsx.txt` carries the MIT notices for the installed
sources, so keep it with them when you copy or redistribute the files.

## Usage

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  return (
    <Card class="max-w-sm">
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent>...</CardContent>
      <CardFooter>
        <Button type="submit">Save</Button>
      </CardFooter>
    </Card>
  )
}
```

These are plain `hono/jsx` components: render them with `c.html(...)`,
`jsxRenderer`, or HonoX routes.

## Client scripts

A few components need behavior the browser does not provide (for example
keyboard navigation in Tabs). `add` also installs their small module scripts
into `public/shadcn/` (no dependencies), and the "Client JS" column
of the [compatibility table](docs/compatibility.md) names the script to load. Without it, the
server-rendered state stays visible.

Serve `public/shadcn/` at `/shadcn/` and load the scripts on pages that use
the components:

```tsx
// Hono on Bun
import { serveStatic } from "hono/bun"
app.use("/shadcn/*", serveStatic({ root: "./public" }))

// in your layout's <head>
<script type="module" src="/shadcn/tabs.js" />
```

HonoX serves `public/` already; add the script tag to
`app/routes/_renderer.tsx`. Scripts listen on the document rather than on
each component, and scroll areas and toasts watch for inserted markup, so
content inserted later (for example by htmx) works without initialization.

Toasts are the one component with a client API: render `<Toaster />` once
per page, then add toasts from your own module scripts or declaratively.
Toasts known on the server (for example after a form post) render with
`<Toaster toasts={...}>` and show without JavaScript.

```tsx
// in the page: <Toaster toasts={saved ? [{ title: "Saved" }] : []} />
<button data-toast-trigger data-toast-title="Copied">Copy</button>

// in a module script
import { toast } from "/shadcn/toast.js"
toast.add({ title: "Saved", description: "Your changes were saved." })
```

## Differences from shadcn/ui

- Components accept `class`, not `className` (Hono JSX renders `class`).
- Base UI's `render` prop works on the server (for example
  `<Button render={<a href="/docs" />}>Docs</Button>`); links rendered this way
  stay links (no `role="button"`). `asChild` is not supported and refs are not
  forwarded.
- Everything is server-rendered. Client-side state attributes from Base UI (for
  example `data-focused`) are not rendered, except where a client script keeps
  them up to date (Tabs).
- `Button` renders `type="button"` by default, like Base UI; pass
  `type="submit"` inside forms.
- Icons are inlined SVG from the preset's icon library (Lucide, Tabler
  Icons, Hugeicons, Phosphor Icons or Remix Icon), identical to what its React
  package renders, not a runtime icon package.
- Dialog, AlertDialog and Sheet are native `<dialog>` elements opened with
  Invoker Commands, so they need no JavaScript but require Chrome 135,
  Firefox 144 or Safari 26.2 or later, and have no controlled `open` state.
  Use `<DialogTrigger render={<Button variant="outline" />}>` as upstream does.
  Closing animates like upstream; outside Chromium the backdrop disappears at
  once while the popup animates out.
- Accordion and Collapsible are native `<details>`/`<summary>` elements: no
  JavaScript and no open/close animation. `CollapsibleTrigger` must be the first
  child of `Collapsible` (everything else collapses) and is styled with
  `class` instead of `render`.
- Checkbox, Switch, RadioGroup, Toggle and ToggleGroup are native inputs inside
  upstream's styled elements: they work and submit with forms without
  JavaScript, and `id`/`name`/`value`/`aria-*` go to the input. A Toggle is a
  label around a checkbox, so Space presses it and Enter does not.
- Popover uses the native `popover` attribute and CSS anchor positioning. It
  opens next to its trigger in Chrome 135, Firefox 147 and Safari 26.2 or
  later, and centered in older browsers. Near the edge of the viewport a
  popup (popover, hover card, tooltip, menu) flips to the other side but does
  not slide along the edge as Base UI does.
- Select is a customizable native `<select>`: it works and submits without
  JavaScript, and Chrome 135, Firefox 149 and Safari 27 or later show
  upstream's design (older browsers show a classic select styled like the
  trigger). `SelectContent` must be a direct child of `Select`, and the list
  opens below the trigger.

Per-component details are in [docs/compatibility.md](docs/compatibility.md).

## Compatibility

The status, visual parity, client scripts and known differences of every
component are listed in [docs/compatibility.md](docs/compatibility.md).

## Examples

- [`examples/hono`](./examples/hono): plain Hono on Bun, Tailwind CLI
- [`examples/honox`](./examples/honox): HonoX with the standard Hono JSX
  renderer and `@tailwindcss/vite`

Both import the components that `bun run dev:install` installs into the
repository root (the default preset, as `init` and `add` would) through an
`@/components/*` alias, and render the same demo page without client
JavaScript.

```sh
bun install
bun run dev:install
bun run examples:build
cd examples/hono && bun run dev    # http://localhost:3000
cd examples/honox && bun run dev   # Vite dev server
```

## How it works

1. `bun run upstream:sync` snapshots the shadcn/ui registries of every Base UI
   style (`upstream/base-<style>/`), recording a content hash per item in
   `upstream/lock.json`.
2. `bun run generate` classifies each upstream component and translates the
   supported ones with ts-morph: React types become Hono JSX types, `className`
   becomes `class`, stateless Base UI primitives become the HTML they render,
   and the output is formatted with Biome. The results are templates of every
   style in `cli/generated/templates/<style>/`, together with the catalog the
   CLI installs from and the compatibility manifest.
3. The CLI builds the theme from the preset's `/init` response on
   ui.shadcn.com and installs the templates into the user's project.
4. A weekly workflow syncs upstream and opens a pull request with the diff;
   nothing is merged automatically.

Generated files are never edited by hand. See
[docs/architecture.md](./docs/architecture.md) and the
[architecture decision records](./docs/adr/README.md).

## Development

| Command | Purpose |
| --- | --- |
| `bun run upstream:sync [--report file]` | Update the upstream snapshot |
| `bun run analyze [name...]` | Classify upstream components |
| `bun run generate [name...] [--check]` | Regenerate the templates, the CLI catalog and the manifest |
| `bun run dev:install` | Install the default preset and every component into the repository root (for tests and examples) |
| `bun run cli <command>` | Run the CLI from the repository |
| `bun run verify` | Install for development, lint, type-check, test, check generated files |
| `bun run test:visual` | Compare screenshots with upstream shadcn/ui (React, Playwright; separate package in `tests/visual`) |
| `bun run test:visual:styles [--style <style>] [--variant <variant>]` | The same in every Base UI style, in the menu color and RTL variants and with every icon library (restores the default install afterwards) |
| `bun run verify:full` | `verify` plus examples, the CLI install test (network) and visual parity |

## License

[MIT](./LICENSE). Derived from [shadcn/ui](https://github.com/shadcn-ui/ui)
(MIT, Copyright (c) 2023 shadcn); see
[THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md). Installed files point to
`LICENSE-shadcnui-hono-jsx.txt`, which the CLI installs with them.
This is an unofficial community project and is not affiliated with or endorsed
by shadcn.

If upstream shadcn/ui changes its license, generation stops until a maintainer
has reviewed the new terms; see
[ADR 0013](./docs/adr/0013-ship-a-reviewed-license-notice-with-every-registry-item-and-gate-upstream-license-changes.md).
