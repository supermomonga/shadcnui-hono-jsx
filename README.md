# shadcnui-hono-jsx

shadcn/ui-compatible components for Hono JSX, without React.

> [!WARNING]
> **Experimental.** This is an unofficial community project. It is not
> affiliated with, maintained by, or endorsed by shadcn or the shadcn/ui
> project. Compatibility with shadcn/ui is partial; see the
> [compatibility table](#compatibility).

## What it is

A React-free port and code-generation pipeline for using the
[shadcn/ui](https://ui.shadcn.com) design system and component API with
[Hono JSX](https://hono.dev/docs/guides/jsx) and [HonoX](https://github.com/honojs/honox).

Components are generated from the upstream shadcn/ui (Base UI variant) registry
and translated into plain `hono/jsx` function components. You install their
source into your project with the shadcn CLI, just like shadcn/ui.

## What it is not

Not React running on Hono. There is no React, React DOM, `@hono/react-renderer`,
Base UI, or Radix runtime in the generated components.

## Main benefits

- React-free, native `hono/jsx` components (SSR-first)
- Works with plain Hono and HonoX
- Tailwind CSS v4 and the shadcn/ui design tokens
- Source-code ownership via a shadcn-compatible registry
- Regenerated from upstream shadcn/ui instead of hand-maintained forks
- JavaScript only where interactive behavior requires it (none so far, including Dialog)

## Requirements

- [Hono](https://hono.dev) 4.12.34 or newer (JSX security fixes; 4.13.9+
  recommended), with `"jsx": "react-jsx"` and `"jsxImportSource": "hono/jsx"`
  in `tsconfig.json`
- [Tailwind CSS](https://tailwindcss.com) v4
- The [shadcn CLI](https://ui.shadcn.com/docs/cli) (run with `bunx`/`npx`; it is
  not added to your dependencies)

## Installation

Components are installed as source files from the GitHub registry at
`supermomonga/shadcnui-hono-jsx`. No `components.json` is required.

1. Install the theme once. It adds `styles/shadcn/theme.css`,
   `styles/shadcn/tailwind.css`, the license notice
   `LICENSE-shadcnui-hono-jsx.txt`, and the `tw-animate-css` package:

   ```sh
   bunx shadcn@latest add supermomonga/shadcnui-hono-jsx/theme
   ```

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

3. Add components. They are written to `components/ui/<name>.tsx` and install
   their npm dependencies (`cn`, `class-variance-authority`):

   ```sh
   bunx shadcn@latest add supermomonga/shadcnui-hono-jsx/button supermomonga/shadcnui-hono-jsx/card
   ```

   Append `#<tag-or-commit>` to an address to pin a revision.

4. Import them with a path alias (`"paths": { "@/*": ["./*"] }`) or a relative
   path.

Every item installs the same `LICENSE-shadcnui-hono-jsx.txt` at your project
root; later installs skip it because it is identical. It carries the MIT notices
for the installed sources, so keep it with them when you copy or redistribute
the files.

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

## Differences from shadcn/ui

- Components accept `class`, not `className` (Hono JSX renders `class`).
- Base UI's `render` prop works on the server (for example
  `<Button render={<a href="/docs" />}>Docs</Button>`); links rendered this way
  stay links (no `role="button"`). `asChild` is not supported and refs are not
  forwarded.
- Everything is server-rendered. Client-side state attributes from Base UI (for
  example `data-focused`) are not rendered.
- `Button` renders `type="button"` by default, like Base UI; pass
  `type="submit"` inside forms.
- The upstream preset font (Geist) is not installed; `font-heading` uses your
  `--font-sans`.
- Icons are inlined SVG from Lucide (identical to lucide-react's output), not
  a runtime icon package.
- Dialog is a native `<dialog>` opened with Invoker Commands, so it needs no
  JavaScript but requires Chrome 135, Firefox 144 or Safari 26.2 or later, and
  has no controlled `open` state. Use
  `<DialogTrigger render={<Button variant="outline" />}>` as upstream does.

Per-component details are in the table below.

## Compatibility

<!-- compatibility-table:start -->
Generated from `compatibility.json` (upstream style `base-nova`). Every component is server-rendered Hono JSX with no client JavaScript. "Visual parity: verified" means screenshots match upstream shadcn/ui (React) in light and dark mode in the `tests/visual` CI job.

| Component | Status | Conversion | Visual parity | Known differences |
| --- | --- | --- | --- | --- |
| alert | experimental | generated | verified | Accepts `class` instead of `className`. |
| aspect-ratio | experimental | generated | verified | Accepts `class` instead of `className`. |
| attachment | experimental | generated | verified | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| badge | experimental | generated | verified | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| breadcrumb | experimental | generated | verified | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| bubble | experimental | generated | verified | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| button | experimental | generated | verified | Renders a native `<button>` with `type="button"` by default, like Base UI; pass `type="submit"` for form submission. `render` is supported on the server; a non-button target such as `render={<a href="/docs" />}` keeps its native role (no `role="button"` or `tabindex`), since the client-side button behavior Base UI adds is not shipped. `focusableWhenDisabled` is not supported. Accepts `class` instead of `className`. |
| button-group | experimental | generated | verified | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| card | experimental | generated | verified | Accepts `class` instead of `className`. |
| dialog | experimental | generated-with-adapter | verified | Accepts `class` instead of `className`. Built on the native `<dialog>` with Invoker Commands (`command`/`commandfor`): no JavaScript, but requires Baseline 2025 browsers (Chrome 135, Firefox 144, Safari 26.2). Controlled state (`open`, `defaultOpen`, `onOpenChange`) is not supported, and the trigger does not reflect the open state (`aria-expanded`). `DialogTrigger` and `DialogClose` support `render`, e.g. `render={<Button variant="outline" />}`. The overlay is the dialog's `::backdrop` (DialogOverlay renders nothing); closing has no exit animation; outside clicks close the dialog only where `closedby` is supported. Focus handling is the browser's: after the last control, Tab moves to the browser UI before wrapping (page content stays inert), where Base UI keeps focus inside the popup. |
| empty | experimental | generated | verified | Accepts `class` instead of `className`. |
| field | experimental | generated | verified | Accepts `class` instead of `className`. |
| input | experimental | generated | verified | Client-side field state attributes (`data-dirty`, `data-touched`, `data-focused`, `data-filled`, `data-valid`) and the auto-generated `id` are not rendered. Accepts `class` instead of `className`. |
| item | experimental | generated | verified | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| kbd | experimental | generated | verified | Accepts `class` instead of `className`. |
| label | experimental | generated | verified | Accepts `class` instead of `className`. |
| marker | experimental | generated | verified | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| message | experimental | generated | verified | Accepts `class` instead of `className`. |
| native-select | experimental | generated | verified | Accepts `class` instead of `className`. |
| pagination | experimental | generated | verified | Accepts `class` instead of `className`. |
| progress | experimental | generated | verified | Server-rendered: the progressbar is not linked to `ProgressLabel` (Base UI links them on the client); pass `aria-label` or `aria-labelledby`. Function children of `ProgressValue` are not supported. Accepts `class` instead of `className`. |
| separator | experimental | generated | verified | Accepts `class` instead of `className`. |
| skeleton | experimental | generated | verified | Accepts `class` instead of `className`. |
| spinner | experimental | generated | verified | Accepts `class` instead of `className`. |
| table | experimental | generated | verified | Accepts `class` instead of `className`. |
| textarea | experimental | generated | verified | Accepts `class` instead of `className`. |

<details>
<summary>Not yet available (37 upstream components)</summary>

| Component | Classification | Blocking reasons |
| --- | --- | --- |
| accordion | unsupported | `base-ui-primitive-unmapped:@base-ui/react/accordion#Accordion` |
| alert-dialog | unsupported | `base-ui-primitive-unmapped:@base-ui/react/alert-dialog#AlertDialog`, `render-prop:AlertDialogPrimitive.Close` |
| avatar | unsupported | `base-ui-primitive-unmapped:@base-ui/react/avatar#Avatar` |
| calendar | unsupported | `react-hook:useEffect`, `react-hook:useRef`, `react-runtime-api:React.useEffect`, `react-runtime-api:React.useRef`, `unknown-import:react-day-picker` |
| carousel | unsupported | `event-handler:onClick`, `event-handler:onKeyDownCapture`, `react-hook:useCarousel`, `react-hook:useContext`, `react-hook:useEffect`, `react-hook:useEmblaCarousel`, `react-hook:useState`, `react-runtime-api:React.createContext`, `react-runtime-api:React.useContext`, `react-runtime-api:React.useEffect`, `react-runtime-api:React.useState`, `react-type-unmapped:React.KeyboardEvent`, `unknown-import:embla-carousel-react` |
| chart | unsupported | `react-hook:useChart`, `react-hook:useContext`, `react-hook:useId`, `react-runtime-api:React.createContext`, `react-runtime-api:React.useContext`, `react-runtime-api:React.useId`, `react-type-unmapped:React.ComponentType`, `unknown-import:recharts` |
| checkbox | unsupported | `base-ui-primitive-unmapped:@base-ui/react/checkbox#Checkbox` |
| collapsible | unsupported | `base-ui-primitive-unmapped:@base-ui/react/collapsible#Collapsible` |
| combobox | unsupported | `base-ui-primitive-unmapped:@base-ui/react#Combobox`, `react-hook:useRef`, `react-runtime-api:React.useRef`, `react-type-unmapped:React.ComponentPropsWithRef`, `registry-dependency:input-group`, `registry-import:@/registry/base-nova/ui/input-group`, `render-prop:ComboboxPrimitive.ChipRemove`, `render-prop:ComboboxPrimitive.Clear`, `render-prop:ComboboxPrimitive.Input`, `render-prop:ComboboxPrimitive.ItemIndicator`, `render-prop:InputGroupButton` |
| command | unsupported | `registry-dependency:input-group`, `registry-import:@/registry/base-nova/ui/input-group`, `unknown-import:cmdk` |
| context-menu | unsupported | `base-ui-primitive-unmapped:@base-ui/react/context-menu#ContextMenu` |
| direction | unsupported | `base-ui-primitive-unmapped:@base-ui/react/direction-provider#DirectionProvider`, `base-ui-primitive-unmapped:@base-ui/react/direction-provider#useDirection` |
| drawer | unsupported | `base-ui-primitive-unmapped:@base-ui/react/drawer#Drawer`, `react-hook:useContext`, `react-hook:useDrawer`, `react-runtime-api:React.createContext`, `react-runtime-api:React.useContext` |
| dropdown-menu | unsupported | `base-ui-primitive-unmapped:@base-ui/react/menu#Menu` |
| form | unsupported | `no-files` |
| hover-card | unsupported | `base-ui-primitive-unmapped:@base-ui/react/preview-card#PreviewCard` |
| input-group | unsupported | `event-handler:onClick` |
| input-otp | unsupported | `react-hook:useContext`, `react-runtime-api:React.useContext`, `unknown-import:input-otp` |
| menubar | unsupported | `base-ui-primitive-unmapped:@base-ui/react/menu#Menu`, `base-ui-primitive-unmapped:@base-ui/react/menubar#Menubar`, `registry-dependency:dropdown-menu`, `registry-import:@/registry/base-nova/ui/dropdown-menu` |
| message-scroller | unsupported | `render-prop:MessageScrollerPrimitive.Button`, `unknown-import:@shadcn/react/message-scroller` |
| navigation-menu | unsupported | `base-ui-primitive-unmapped:@base-ui/react/navigation-menu#NavigationMenu`, `react-type-unmapped:React.ComponentPropsWithRef` |
| popover | unsupported | `base-ui-primitive-unmapped:@base-ui/react/popover#Popover` |
| questionnaire | unsupported | `unknown-import:@shadcn/react/questionnaire` |
| radio-group | unsupported | `base-ui-primitive-unmapped:@base-ui/react/radio-group#RadioGroup`, `base-ui-primitive-unmapped:@base-ui/react/radio#Radio` |
| resizable | unsupported | `unknown-import:react-resizable-panels` |
| scroll-area | unsupported | `base-ui-primitive-unmapped:@base-ui/react/scroll-area#ScrollArea` |
| select | unsupported | `base-ui-primitive-unmapped:@base-ui/react/select#Select`, `render-prop:SelectPrimitive.Icon`, `render-prop:SelectPrimitive.ItemIndicator` |
| sheet | unsupported | `base-ui-primitive-unmapped:@base-ui/react/dialog#Dialog`, `render-prop:SheetPrimitive.Close` |
| sidebar | unsupported | `event-handler:onClick`, `event-handler:onOpenChange`, `react-hook:useContext`, `react-hook:useEffect`, `react-hook:useIsMobile`, `react-hook:useSidebar`, `react-hook:useState`, `react-runtime-api:React.createContext`, `react-runtime-api:React.useContext`, `react-runtime-api:React.useEffect`, `react-runtime-api:React.useState`, `registry-dependency:sheet`, `registry-dependency:tooltip`, `registry-dependency:use-mobile`, `registry-import:@/registry/base-nova/hooks/use-mobile`, `registry-import:@/registry/base-nova/ui/sheet`, `registry-import:@/registry/base-nova/ui/tooltip`, `render-prop:TooltipTrigger`, `use-render-noncanonical` |
| slider | unsupported | `base-ui-primitive-unmapped:@base-ui/react/slider#Slider` |
| sonner | unsupported | `react-hook:useTheme`, `unknown-import:next-themes`, `unknown-import:sonner` |
| switch | unsupported | `base-ui-primitive-unmapped:@base-ui/react/switch#Switch` |
| tabs | unsupported | `base-ui-primitive-unmapped:@base-ui/react/tabs#Tabs` |
| toast | unsupported | `base-ui-primitive-unmapped:@base-ui/react/toast#Toast`, `render-prop:ToastPrimitive.Action`, `render-prop:ToastPrimitive.Close` |
| toggle | unsupported | `base-ui-primitive-unmapped:@base-ui/react/toggle#Toggle` |
| toggle-group | unsupported | `base-ui-primitive-unmapped:@base-ui/react/toggle-group#ToggleGroup`, `base-ui-primitive-unmapped:@base-ui/react/toggle#Toggle`, `react-hook:useContext`, `react-runtime-api:React.createContext`, `react-runtime-api:React.useContext`, `registry-dependency:toggle`, `registry-import:@/registry/base-nova/ui/toggle` |
| tooltip | unsupported | `base-ui-primitive-unmapped:@base-ui/react/tooltip#Tooltip` |

</details>
<!-- compatibility-table:end -->

## Examples

- [`examples/hono`](./examples/hono): plain Hono on Bun, Tailwind CLI
- [`examples/honox`](./examples/honox): HonoX with the standard Hono JSX
  renderer and `@tailwindcss/vite`

Both import the generated components from this repository through an
`@/components/*` alias and render the same demo page without client
JavaScript.

```sh
bun install
bun run examples:build
cd examples/hono && bun run dev    # http://localhost:3000
cd examples/honox && bun run dev   # Vite dev server
```

## How it works

1. `bun run upstream:sync` snapshots the shadcn/ui `base-nova` registry
   (`upstream/`), recording a content hash per item in `upstream/lock.json`.
2. `bun run generate` classifies each upstream component and translates the
   supported ones with ts-morph: React types become Hono JSX types, `className`
   becomes `class`, stateless Base UI primitives become the HTML they render,
   and the output is formatted with Biome. It also writes the theme, the
   registry, and the compatibility manifest.
3. A weekly workflow syncs upstream and opens a pull request with the diff;
   nothing is merged automatically.

Generated files are never edited by hand. See
[docs/architecture.md](./docs/architecture.md) and the
[architecture decision records](./docs/adr/README.md).

## Development

| Command | Purpose |
| --- | --- |
| `bun run upstream:sync [--report file]` | Update the upstream snapshot |
| `bun run analyze [name...]` | Classify upstream components |
| `bun run generate [name...] [--check]` | Regenerate components, theme, registry, manifest |
| `bun run verify` | Lint, type-check, test, check generated files, validate the registry |
| `bun run test:visual` | Compare screenshots with upstream shadcn/ui (React, Playwright; separate package in `tests/visual`) |
| `bun run verify:full` | `verify` plus examples, the registry install test (network) and visual parity |

## License

[MIT](./LICENSE). Derived from [shadcn/ui](https://github.com/shadcn-ui/ui)
(MIT, Copyright (c) 2023 shadcn); see
[THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md). Installed files point to
`LICENSE-shadcnui-hono-jsx.txt`, which is installed with every registry item.
This is an unofficial community project and is not affiliated with or endorsed
by shadcn.

If upstream shadcn/ui changes its license, generation stops until a maintainer
has reviewed the new terms; see
[ADR 0013](./docs/adr/0013-ship-a-reviewed-license-notice-with-every-registry-item-and-gate-upstream-license-changes.md).
