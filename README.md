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
- JavaScript only where interactive behavior requires it (none for the current set)

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

1. Install the theme once. It adds `styles/shadcn/theme.css` and
   `styles/shadcn/tailwind.css` and the `tw-animate-css` package:

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
- `asChild` and Base UI's `render` prop are not supported yet; refs are not
  forwarded.
- Everything is server-rendered. Client-side state attributes from Base UI (for
  example `data-focused`) are not rendered.
- `Button` renders `type="button"` by default, like Base UI; pass
  `type="submit"` inside forms.
- The upstream preset font (Geist) is not installed; `font-heading` uses your
  `--font-sans`.

Per-component details are in the table below.

## Compatibility

<!-- compatibility-table:start -->
Generated from `compatibility.json` (upstream style `base-nova`). Every component is server-rendered Hono JSX with no client JavaScript.

| Component | Status | Conversion | Visual parity | Known differences |
| --- | --- | --- | --- | --- |
| alert | experimental | generated | unverified | Accepts `class` instead of `className`. |
| badge | experimental | generated | unverified | `render` (element replacement) is not supported. Accepts `class` instead of `className`. |
| button | experimental | generated | unverified | Renders a native `<button>` with `type="button"` by default, like Base UI; pass `type="submit"` for form submission. `render` and `focusableWhenDisabled` are not supported. Accepts `class` instead of `className`. |
| card | experimental | generated | unverified | Accepts `class` instead of `className`. |
| input | experimental | generated | unverified | Client-side field state attributes (`data-dirty`, `data-touched`, `data-focused`, `data-filled`, `data-valid`) and the auto-generated `id` are not rendered. Accepts `class` instead of `className`. |
| label | experimental | generated | unverified | Accepts `class` instead of `className`. |
| separator | experimental | generated | unverified | Accepts `class` instead of `className`. |
| skeleton | experimental | generated | unverified | Accepts `class` instead of `className`. |
| table | experimental | generated | unverified | Accepts `class` instead of `className`. |
| textarea | experimental | generated | unverified | Accepts `class` instead of `className`. |

<details>
<summary>Not yet available (53 upstream components)</summary>

| Component | Classification | Blocking reasons |
| --- | --- | --- |
| accordion | unsupported | `base-ui-primitive-unmapped:@base-ui/react/accordion#Accordion`, `icon-placeholder` |
| alert-dialog | unsupported | `base-ui-primitive-unmapped:@base-ui/react/alert-dialog#AlertDialog`, `registry-dependency:button`, `registry-import:@/registry/base-nova/ui/button` |
| aspect-ratio | direct | not generated yet |
| attachment | unsupported | `registry-dependency:button`, `registry-import:@/registry/base-nova/ui/button` |
| avatar | unsupported | `base-ui-primitive-unmapped:@base-ui/react/avatar#Avatar` |
| breadcrumb | unsupported | `icon-placeholder` |
| bubble | direct | not generated yet |
| button-group | unsupported | `registry-dependency:separator`, `registry-import:@/registry/base-nova/ui/separator` |
| calendar | unsupported | `icon-placeholder`, `react-hook:useEffect`, `react-hook:useRef`, `react-runtime-api:React.useEffect`, `react-runtime-api:React.useRef`, `registry-dependency:button`, `registry-import:@/registry/base-nova/ui/button`, `unknown-import:react-day-picker` |
| carousel | unsupported | `event-handler:onClick`, `event-handler:onKeyDownCapture`, `icon-placeholder`, `react-hook:useCallback`, `react-hook:useCarousel`, `react-hook:useContext`, `react-hook:useEffect`, `react-hook:useEmblaCarousel`, `react-hook:useState`, `react-runtime-api:React.createContext`, `react-runtime-api:React.useCallback`, `react-runtime-api:React.useContext`, `react-runtime-api:React.useEffect`, `react-runtime-api:React.useState`, `react-type-unmapped:React.KeyboardEvent`, `registry-dependency:button`, `registry-import:@/registry/base-nova/ui/button`, `unknown-import:embla-carousel-react` |
| chart | unsupported | `react-hook:useChart`, `react-hook:useContext`, `react-hook:useId`, `react-hook:useMemo`, `react-runtime-api:React.createContext`, `react-runtime-api:React.useContext`, `react-runtime-api:React.useId`, `react-runtime-api:React.useMemo`, `react-type-unmapped:React.ComponentType`, `registry-dependency:card`, `unknown-import:recharts` |
| checkbox | unsupported | `base-ui-primitive-unmapped:@base-ui/react/checkbox#Checkbox`, `icon-placeholder` |
| collapsible | unsupported | `base-ui-primitive-unmapped:@base-ui/react/collapsible#Collapsible` |
| combobox | unsupported | `base-ui-primitive-unmapped:@base-ui/react#Combobox`, `icon-placeholder`, `react-hook:useRef`, `react-runtime-api:React.useRef`, `react-type-unmapped:React.ComponentPropsWithRef`, `registry-dependency:button`, `registry-dependency:input-group`, `registry-import:@/registry/base-nova/ui/button`, `registry-import:@/registry/base-nova/ui/input-group` |
| command | unsupported | `icon-placeholder`, `registry-dependency:dialog`, `registry-dependency:input-group`, `registry-import:@/registry/base-nova/ui/dialog`, `registry-import:@/registry/base-nova/ui/input-group`, `unknown-import:cmdk` |
| context-menu | unsupported | `base-ui-primitive-unmapped:@base-ui/react/context-menu#ContextMenu`, `icon-placeholder` |
| dialog | unsupported | `base-ui-primitive-unmapped:@base-ui/react/dialog#Dialog`, `icon-placeholder`, `registry-dependency:button`, `registry-import:@/registry/base-nova/ui/button` |
| direction | unsupported | `base-ui-primitive-unmapped:@base-ui/react/direction-provider#DirectionProvider`, `base-ui-primitive-unmapped:@base-ui/react/direction-provider#useDirection` |
| drawer | unsupported | `base-ui-primitive-unmapped:@base-ui/react/drawer#Drawer`, `react-hook:useContext`, `react-hook:useDrawer`, `react-hook:useMemo`, `react-runtime-api:React.createContext`, `react-runtime-api:React.useContext`, `react-runtime-api:React.useMemo` |
| dropdown-menu | unsupported | `base-ui-primitive-unmapped:@base-ui/react/menu#Menu`, `icon-placeholder` |
| empty | direct | not generated yet |
| field | unsupported | `react-hook:useMemo`, `react-runtime-api:useMemo`, `registry-dependency:label`, `registry-dependency:separator`, `registry-import:@/registry/base-nova/ui/label`, `registry-import:@/registry/base-nova/ui/separator` |
| form | unsupported | `no-files` |
| hover-card | unsupported | `base-ui-primitive-unmapped:@base-ui/react/preview-card#PreviewCard` |
| input-group | unsupported | `event-handler:onClick`, `registry-dependency:button`, `registry-dependency:input`, `registry-dependency:textarea`, `registry-import:@/registry/base-nova/ui/button`, `registry-import:@/registry/base-nova/ui/input`, `registry-import:@/registry/base-nova/ui/textarea` |
| input-otp | unsupported | `icon-placeholder`, `react-hook:useContext`, `react-runtime-api:React.useContext`, `unknown-import:input-otp` |
| item | unsupported | `registry-dependency:separator`, `registry-import:@/registry/base-nova/ui/separator` |
| kbd | direct | not generated yet |
| marker | direct | not generated yet |
| menubar | unsupported | `base-ui-primitive-unmapped:@base-ui/react/menu#Menu`, `base-ui-primitive-unmapped:@base-ui/react/menubar#Menubar`, `icon-placeholder`, `registry-dependency:dropdown-menu`, `registry-import:@/registry/base-nova/ui/dropdown-menu` |
| message | direct | not generated yet |
| message-scroller | unsupported | `icon-placeholder`, `registry-dependency:button`, `registry-import:@/registry/base-nova/ui/button`, `unknown-import:@shadcn/react/message-scroller` |
| native-select | unsupported | `icon-placeholder` |
| navigation-menu | unsupported | `base-ui-primitive-unmapped:@base-ui/react/navigation-menu#NavigationMenu`, `icon-placeholder`, `react-type-unmapped:React.ComponentPropsWithRef` |
| pagination | unsupported | `icon-placeholder`, `registry-dependency:button`, `registry-import:@/registry/base-nova/ui/button` |
| popover | unsupported | `base-ui-primitive-unmapped:@base-ui/react/popover#Popover` |
| progress | unsupported | `base-ui-primitive-unmapped:@base-ui/react/progress#Progress` |
| questionnaire | unsupported | `icon-placeholder`, `registry-dependency:button`, `registry-import:@/registry/base-nova/ui/button`, `unknown-import:@shadcn/react/questionnaire` |
| radio-group | unsupported | `base-ui-primitive-unmapped:@base-ui/react/radio-group#RadioGroup`, `base-ui-primitive-unmapped:@base-ui/react/radio#Radio` |
| resizable | unsupported | `unknown-import:react-resizable-panels` |
| scroll-area | unsupported | `base-ui-primitive-unmapped:@base-ui/react/scroll-area#ScrollArea` |
| select | unsupported | `base-ui-primitive-unmapped:@base-ui/react/select#Select`, `icon-placeholder` |
| sheet | unsupported | `base-ui-primitive-unmapped:@base-ui/react/dialog#Dialog`, `icon-placeholder`, `registry-dependency:button`, `registry-import:@/registry/base-nova/ui/button` |
| sidebar | unsupported | `event-handler:onClick`, `event-handler:onOpenChange`, `icon-placeholder`, `react-hook:useCallback`, `react-hook:useContext`, `react-hook:useEffect`, `react-hook:useIsMobile`, `react-hook:useMemo`, `react-hook:useSidebar`, `react-hook:useState`, `react-runtime-api:React.createContext`, `react-runtime-api:React.useCallback`, `react-runtime-api:React.useContext`, `react-runtime-api:React.useEffect`, `react-runtime-api:React.useMemo`, `react-runtime-api:React.useState`, `registry-dependency:button`, `registry-dependency:input`, `registry-dependency:separator`, `registry-dependency:sheet`, `registry-dependency:skeleton`, `registry-dependency:tooltip`, `registry-dependency:use-mobile`, `registry-import:@/registry/base-nova/hooks/use-mobile`, `registry-import:@/registry/base-nova/ui/button`, `registry-import:@/registry/base-nova/ui/input`, `registry-import:@/registry/base-nova/ui/separator`, `registry-import:@/registry/base-nova/ui/sheet`, `registry-import:@/registry/base-nova/ui/skeleton`, `registry-import:@/registry/base-nova/ui/tooltip`, `use-render-noncanonical` |
| slider | unsupported | `base-ui-primitive-unmapped:@base-ui/react/slider#Slider` |
| sonner | unsupported | `icon-placeholder`, `react-hook:useTheme`, `unknown-import:next-themes`, `unknown-import:sonner` |
| spinner | unsupported | `icon-placeholder` |
| switch | unsupported | `base-ui-primitive-unmapped:@base-ui/react/switch#Switch` |
| tabs | unsupported | `base-ui-primitive-unmapped:@base-ui/react/tabs#Tabs` |
| toast | unsupported | `base-ui-primitive-unmapped:@base-ui/react/toast#Toast`, `icon-placeholder`, `registry-dependency:button`, `registry-import:@/registry/base-nova/ui/button` |
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
| `bun run verify:full` | `verify` plus examples and the registry install test (network) |

## License

[MIT](./LICENSE). Derived from [shadcn/ui](https://github.com/shadcn-ui/ui)
(MIT, Copyright (c) 2023 shadcn); see
[THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md). This is an unofficial
community project and is not affiliated with or endorsed by shadcn.
