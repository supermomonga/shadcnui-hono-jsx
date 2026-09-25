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
- JavaScript only where the browser lacks the behavior: most components (including Dialog, Popover, Select and Accordion) ship none, and the rest use small optional module scripts

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

## Client scripts

A few components need behavior the browser does not provide (for example
keyboard navigation in Tabs). Their registry items also install small module
scripts into `public/shadcn/` (no dependencies), and the "Client JS" column
of the compatibility table names the script to load. Without it, the
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
`app/routes/_renderer.tsx`. Scripts attach one delegated listener per event
to the document, so content inserted later (for example by htmx) works
without initialization.

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
- The upstream preset font (Geist) is not installed; `font-heading` uses your
  `--font-sans`.
- Icons are inlined SVG from Lucide (identical to lucide-react's output), not
  a runtime icon package.
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
  later, and centered in older browsers.
- Select is a customizable native `<select>`: it works and submits without
  JavaScript, and Chrome 135, Firefox 149 and Safari 27 or later show
  upstream's design (older browsers show a classic select styled like the
  trigger). `SelectContent` must be a direct child of `Select`, and the list
  opens below the trigger.

Per-component details are in the table below.

## Compatibility

<!-- compatibility-table:start -->
Generated from `compatibility.json` (upstream style `base-nova`). Every component is server-rendered Hono JSX; the "Client JS" column names the optional script a component needs for its behavior (see "Client scripts" above). "Visual parity: verified" means screenshots match upstream shadcn/ui (React) in light and dark mode in the `tests/visual` CI job.

| Component | Status | Conversion | Visual parity | Client JS | Known differences |
| --- | --- | --- | --- | --- | --- |
| accordion | experimental | generated | verified | none | Built on native `<details>`/`<summary>`: no JavaScript. Items share a `name` so only one is open unless `multiple` is set (Baseline 2024: Chrome 120, Firefox 130, Safari 17.2). Controlled state (`value`, `onValueChange`) is not supported; `defaultValue` opens items by their `value`. The trigger is the `<summary>` (no `h3` around it; browsers expose the expanded state without `aria-expanded`), and arrow keys do not move between items. Opening and closing are not animated. Closed panels stay in the page, so find-in-page can reveal them. Accepts `class` instead of `className`. |
| alert | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| alert-dialog | experimental | generated | verified | none | Built on the native `<dialog>` with Invoker Commands (`command`/`commandfor`): no JavaScript, but requires Baseline 2025 browsers (Chrome 135, Firefox 144, Safari 26.2). Controlled state (`open`, `defaultOpen`, `onOpenChange`) is not supported, and the trigger does not reflect the open state (`aria-expanded`). Triggers and close buttons support `render`, e.g. `render={<Button variant="outline" />}`. The overlay is the dialog's `::backdrop` (the overlay component renders nothing); closing animates out, but only Chromium keeps the popup and backdrop in the top layer meanwhile (elsewhere the backdrop disappears at once); like Base UI, outside clicks do not close it. Focus handling is the browser's: after the last control, Tab moves to the browser UI before wrapping (page content stays inert), where Base UI keeps focus inside the popup. Accepts `class` instead of `className`. |
| aspect-ratio | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| attachment | experimental | generated | verified | none | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| badge | experimental | generated | verified | none | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| breadcrumb | experimental | generated | verified | none | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| bubble | experimental | generated | verified | none | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| button | experimental | generated | verified | none | Renders a native `<button>` with `type="button"` by default, like Base UI; pass `type="submit"` for form submission. `render` is supported on the server; a non-button target such as `render={<a href="/docs" />}` keeps its native role (no `role="button"` or `tabindex`), since the client-side button behavior Base UI adds is not shipped. `focusableWhenDisabled` is not supported. Accepts `class` instead of `className`. |
| button-group | experimental | generated | verified | none | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| card | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| checkbox | experimental | generated | verified | none | Built on a native `<input type="checkbox">` inside the styled root: no JavaScript, and the value is submitted with forms. `id`, `name`, `value`, `disabled`, `required`, `form` and `aria-*` go to the input, so `<Label for>` works as usual. `checked`/`defaultChecked` set the initial state; `onCheckedChange`, `readOnly`, `indeterminate` and `render` are not supported. Accepts `class` instead of `className`. |
| collapsible | experimental | generated | verified | none | Built on native `<details>`/`<summary>`: no JavaScript. `CollapsibleTrigger` must be the first child of `Collapsible` (rendering throws otherwise), and every other child is hidden while closed, not only `CollapsibleContent`. `CollapsibleTrigger` does not support `render`; style it with `class` (for example `buttonVariants()`). `open`/`defaultOpen` set the initial state; `onOpenChange` and `disabled` are not supported, and state attributes (`data-open`, `data-panel-open`) are not rendered (use `open:` variants). Accepts `class` instead of `className`. |
| context-menu | experimental | generated | verified | `/shadcn/menu.js` | A right click on the trigger area opens the menu at the pointer; this needs the client script `/shadcn/menu.js` (`<script type="module" src="/shadcn/menu.js">`), without which the browser's own context menu appears. The menu is a native popover placed with CSS anchor positioning, and the script adds the menu behavior (focus, arrow keys, typeahead, checkbox and radio items, submenus). Long presses on touch screens do not open it. Items have no `onClick` on the server: use `render` for links (`render={<a href="/settings" />}`) or form buttons. Controlled state (`open`, `onOpenChange`, `checked`/`onCheckedChange`, `value`/`onValueChange`), `modal` (page scroll is not locked) and `openOnHover` on the root are not supported. Accepts `class` instead of `className`. |
| dialog | experimental | generated | verified | none | Built on the native `<dialog>` with Invoker Commands (`command`/`commandfor`): no JavaScript, but requires Baseline 2025 browsers (Chrome 135, Firefox 144, Safari 26.2). Controlled state (`open`, `defaultOpen`, `onOpenChange`) is not supported, and the trigger does not reflect the open state (`aria-expanded`). Triggers and close buttons support `render`, e.g. `render={<Button variant="outline" />}`. The overlay is the dialog's `::backdrop` (the overlay component renders nothing); closing animates out, but only Chromium keeps the popup and backdrop in the top layer meanwhile (elsewhere the backdrop disappears at once); outside clicks close the dialog only where `closedby` is supported. Focus handling is the browser's: after the last control, Tab moves to the browser UI before wrapping (page content stays inert), where Base UI keeps focus inside the popup. Accepts `class` instead of `className`. |
| dropdown-menu | experimental | generated | verified | `/shadcn/menu.js` | The menu is a native popover placed with CSS anchor positioning, so it opens without JavaScript (placement needs Chrome 135, Firefox 147 or Safari 26.2). The client script `/shadcn/menu.js` (`<script type="module" src="/shadcn/menu.js">`) adds the menu behavior: focus handling, arrow keys, typeahead, checkbox and radio items, submenus and closing after a choice. Items have no `onClick` on the server: use `render` for links (`render={<a href="/settings" />}`) or form buttons. Controlled state (`open`, `onOpenChange`, `checked`/`onCheckedChange`, `value`/`onValueChange`), `modal` (page scroll is not locked) and `openOnHover` on the root are not supported. Accepts `class` instead of `className`. |
| empty | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| field | experimental | generated | verified | none | Accepts `class` instead of `className`. Checked-state styles (`has-data-checked:`) follow the native `:checked` state of the generated controls. |
| hover-card | experimental | generated | verified | `/shadcn/hover.js` | Opening on hover or keyboard focus needs the client script `/shadcn/hover.js` (`<script type="module" src="/shadcn/hover.js">`); without it the card does not open and the trigger works as a plain link. The card is a native popover placed with CSS anchor positioning. Controlled state (`open`, `onOpenChange`) is not supported. Accepts `class` instead of `className`. |
| input | experimental | generated | verified | none | Client-side field state attributes (`data-dirty`, `data-touched`, `data-focused`, `data-filled`, `data-valid`) and the auto-generated `id` are not rendered. Accepts `class` instead of `className`. |
| item | experimental | generated | verified | none | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| kbd | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| label | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| marker | experimental | generated | verified | none | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| menubar | experimental | generated | verified | `/shadcn/menu.js` | The menu is a native popover placed with CSS anchor positioning, so it opens without JavaScript (placement needs Chrome 135, Firefox 147 or Safari 26.2). The client script `/shadcn/menu.js` (`<script type="module" src="/shadcn/menu.js">`) adds the menu behavior: focus handling, arrow keys, typeahead, checkbox and radio items, submenus and closing after a choice. Items have no `onClick` on the server: use `render` for links (`render={<a href="/settings" />}`) or form buttons. Controlled state (`open`, `onOpenChange`, `checked`/`onCheckedChange`, `value`/`onValueChange`), `modal` (page scroll is not locked) and `openOnHover` on the root are not supported. Moving between menus with the arrow keys and switching menus by hovering while one is open need the client script `/shadcn/menu.js` (`<script type="module" src="/shadcn/menu.js">`); without it each menu still opens with its trigger. `modal` is not supported. Accepts `class` instead of `className`. |
| message | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| native-select | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| pagination | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| popover | experimental | generated | verified | none | Built on the native `popover` attribute with Invoker Commands and CSS anchor positioning: no JavaScript, but placement next to the trigger needs Chrome 135, Firefox 147 or Safari 26.2 (elsewhere the popover opens centered). Outside clicks and Escape close it. Controlled state (`open`, `defaultOpen`, `onOpenChange`) and `openOnHover` are not supported. `side`, `align`, `sideOffset` and `alignOffset` place the popover; on collision it flips to the opposite side, but `data-side` keeps the requested side. Focus is not moved into the popover, and the positioner's classes are not rendered. Accepts `class` instead of `className`. |
| progress | experimental | generated | verified | none | Server-rendered: the progressbar is not linked to `ProgressLabel` (Base UI links them on the client); pass `aria-label` or `aria-labelledby`. Function children of `ProgressValue` are not supported. Accepts `class` instead of `className`. |
| radio-group | experimental | generated | verified | none | `value`/`defaultValue` set the initial selection; `onValueChange` and `readOnly` are not supported. Built on native `<input type="radio">` elements sharing the group's `name` (generated unless given): no JavaScript, arrow keys move the selection, and the value is submitted with forms. `id`, `disabled` and `aria-*` go to the input. Accepts `class` instead of `className`. |
| select | experimental | generated | verified | none | Built on a customizable native `<select>` (`appearance: base-select`): no JavaScript, keyboard selection and typeahead are the browser's (Space and the arrow keys open it, Enter does not), and `name`/`value` are submitted with forms. Chrome 135, Firefox 149 and Safari 27 or later show upstream's design; older browsers show a classic select with the trigger's styles. `SelectTrigger` renders the `<select>` (so `id` and `aria-*` given to it reach the form control), and `<SelectContent>` must be a direct child of `<Select>`. `value`/`defaultValue` set the initial selection; `onValueChange`, `multiple`, `items`, value render functions and aligning the selected item with the trigger (`alignItemWithTrigger`) are not supported: the list opens below the trigger. Classes given to `SelectContent` are not applied to the list. Accepts `class` instead of `className`. |
| separator | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| sheet | experimental | generated | verified | none | Built on the native `<dialog>` with Invoker Commands (`command`/`commandfor`): no JavaScript, but requires Baseline 2025 browsers (Chrome 135, Firefox 144, Safari 26.2). Controlled state (`open`, `defaultOpen`, `onOpenChange`) is not supported, and the trigger does not reflect the open state (`aria-expanded`). Triggers and close buttons support `render`, e.g. `render={<Button variant="outline" />}`. The overlay is the dialog's `::backdrop` (the overlay component renders nothing); closing animates out, but only Chromium keeps the popup and backdrop in the top layer meanwhile (elsewhere the backdrop disappears at once); outside clicks close the dialog only where `closedby` is supported. Focus handling is the browser's: after the last control, Tab moves to the browser UI before wrapping (page content stays inert), where Base UI keeps focus inside the popup. Accepts `class` instead of `className`. |
| skeleton | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| slider | experimental | generated | verified | `/shadcn/slider.js` | Each thumb holds a native `<input type="range">` (focusable, keyboard-operable and submitted with `name`). Pointer dragging, keeping range thumbs in order and moving the thumbs as values change need the client script `/shadcn/slider.js` (`<script type="module" src="/shadcn/slider.js">`); without it the initial values are shown and submitted. Controlled state (`onValueChange`), `format`, `locale` and `largeStep` are not supported (Page Up and Page Down use the browser's step). Accepts `class` instead of `className`. |
| spinner | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| switch | experimental | generated | verified | none | Built on a native `<input type="checkbox" role="switch">` inside the styled root: no JavaScript, and the value is submitted with forms. `id`, `name`, `value`, `disabled`, `required`, `form` and `aria-*` go to the input, so `<Label for>` works as usual. `checked`/`defaultChecked` set the initial state; `onCheckedChange`, `readOnly` and `render` are not supported. Accepts `class` instead of `className`. |
| table | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| tabs | experimental | generated | verified | `/shadcn/tabs.js` | Switching tabs needs the client script `/shadcn/tabs.js` (`<script type="module" src="/shadcn/tabs.js">`); without it the selected panel is shown. Pointer, Enter, Space, arrow keys, Home and End work like Base UI. Inactive panels are rendered with `hidden` (Base UI does not render them). Controlled state (`onValueChange`) and `render` are not supported; `value`/`defaultValue` set the selected tab. Accepts `class` instead of `className`. |
| textarea | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| toggle | experimental | generated | verified | none | A `label` around a visually hidden native checkbox (the pressed state is its checked state): no JavaScript, and `name`/`value` are submitted with forms. `aria-*` goes to the input, so icon-only toggles need `aria-label` as upstream. Space toggles, Enter does not (a checkbox, not a button); `pressed`/`defaultPressed` set the initial state; `onPressedChange` and `render` are not supported. Accepts `class` instead of `className`. |
| toggle-group | experimental | generated | verified | none | Items are native radios sharing a `name` (checkboxes with `multiple`): the pressed item of a single-selection group cannot be released by pressing it again, and arrow keys select as they move. `defaultValue` sets the pressed items; `value`/`onValueChange` are not supported. A `label` around a visually hidden native checkbox (the pressed state is its checked state): no JavaScript, and `name`/`value` are submitted with forms. `aria-*` goes to the input, so icon-only toggles need `aria-label` as upstream. Space toggles, Enter does not (a checkbox, not a button); `pressed`/`defaultPressed` set the initial state; `onPressedChange` and `render` are not supported. Accepts `class` instead of `className`. |
| tooltip | experimental | generated | verified | `/shadcn/hover.js` | Opening on hover or keyboard focus needs the client script `/shadcn/hover.js` (`<script type="module" src="/shadcn/hover.js">`); without it the tooltip does not open, but the trigger's `aria-describedby` still exposes its text. The popup is a native popover placed with CSS anchor positioning. Unlike Base UI, the popup has `role="tooltip"` and describes the trigger. Controlled state (`open`, `onOpenChange`) is not supported. Accepts `class` instead of `className`. |

<details>
<summary>Not yet available (19 upstream components)</summary>

| Component | Classification | Blocking reasons |
| --- | --- | --- |
| avatar | unsupported | `base-ui-primitive-unmapped:@base-ui/react/avatar#Avatar` |
| calendar | unsupported | `react-hook:useEffect`, `react-hook:useRef`, `react-runtime-api:React.useEffect`, `react-runtime-api:React.useRef`, `unknown-import:react-day-picker` |
| carousel | unsupported | `event-handler:onClick`, `event-handler:onKeyDownCapture`, `react-hook:useCarousel`, `react-hook:useEffect`, `react-hook:useEmblaCarousel`, `react-hook:useState`, `react-runtime-api:React.useEffect`, `react-runtime-api:React.useState`, `react-type-unmapped:React.KeyboardEvent`, `unknown-import:embla-carousel-react` |
| chart | unsupported | `react-hook:useChart`, `react-hook:useId`, `react-runtime-api:React.useId`, `react-type-unmapped:React.ComponentType`, `unknown-import:recharts` |
| combobox | unsupported | `base-ui-primitive-unmapped:@base-ui/react#Combobox`, `react-hook:useRef`, `react-runtime-api:React.useRef`, `react-type-unmapped:React.ComponentPropsWithRef`, `registry-dependency:input-group`, `registry-import:@/registry/base-nova/ui/input-group`, `render-prop:ComboboxPrimitive.ChipRemove`, `render-prop:ComboboxPrimitive.Clear`, `render-prop:ComboboxPrimitive.Input`, `render-prop:ComboboxPrimitive.ItemIndicator`, `render-prop:InputGroupButton` |
| command | unsupported | `registry-dependency:input-group`, `registry-import:@/registry/base-nova/ui/input-group`, `unknown-import:cmdk` |
| direction | unsupported | `base-ui-primitive-unmapped:@base-ui/react/direction-provider#DirectionProvider`, `base-ui-primitive-unmapped:@base-ui/react/direction-provider#useDirection` |
| drawer | unsupported | `base-ui-primitive-unmapped:@base-ui/react/drawer#Drawer`, `react-hook:useDrawer` |
| form | unsupported | `no-files` |
| input-group | unsupported | `event-handler:onClick` |
| input-otp | unsupported | `unknown-import:input-otp` |
| message-scroller | unsupported | `render-prop:MessageScrollerPrimitive.Button`, `unknown-import:@shadcn/react/message-scroller` |
| navigation-menu | unsupported | `base-ui-primitive-unmapped:@base-ui/react/navigation-menu#NavigationMenu`, `react-type-unmapped:React.ComponentPropsWithRef` |
| questionnaire | unsupported | `unknown-import:@shadcn/react/questionnaire` |
| resizable | unsupported | `unknown-import:react-resizable-panels` |
| scroll-area | unsupported | `base-ui-primitive-unmapped:@base-ui/react/scroll-area#ScrollArea` |
| sidebar | unsupported | `event-handler:onClick`, `event-handler:onOpenChange`, `react-hook:useEffect`, `react-hook:useIsMobile`, `react-hook:useSidebar`, `react-hook:useState`, `react-runtime-api:React.useEffect`, `react-runtime-api:React.useState`, `registry-dependency:use-mobile`, `registry-import:@/registry/base-nova/hooks/use-mobile`, `use-render-noncanonical` |
| sonner | unsupported | `react-hook:useTheme`, `unknown-import:next-themes`, `unknown-import:sonner` |
| toast | unsupported | `base-ui-primitive-unmapped:@base-ui/react/toast#Toast`, `render-prop:ToastPrimitive.Action`, `render-prop:ToastPrimitive.Close` |

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
