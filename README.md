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
- Bun (or Node.js) to run the CLI; it is not added to your dependencies

## Installation

> [!NOTE]
> The CLI is not published to npm yet. Until the first release, run it from a
> clone of this repository: replace `bunx shadcnui-hono-jsx` with
> `bun <path to the clone>/cli/src/index.ts`.

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

Per-component details are in the table below.

## Compatibility

<!-- compatibility-table:start -->
Generated from `compatibility.json` (upstream style `base-nova`; every Base UI style is generated from the same sources and compared the same way). Every component is server-rendered Hono JSX; the "Client JS" column names the optional script a component needs for its behavior (see "Client scripts" above). "Visual parity: verified" means screenshots match upstream shadcn/ui (React) in light and dark mode in the `tests/visual` CI job.

| Component | Status | Conversion | Visual parity | Client JS | Known differences |
| --- | --- | --- | --- | --- | --- |
| accordion | experimental | generated | verified | none | Built on native `<details>`/`<summary>`: no JavaScript. Items share a `name` so only one is open unless `multiple` is set (Baseline 2024: Chrome 120, Firefox 130, Safari 17.2). Controlled state (`value`, `onValueChange`) is not supported; `defaultValue` opens items by their `value`. The trigger is the `<summary>` (no `h3` around it; browsers expose the expanded state without `aria-expanded`), and arrow keys do not move between items. Opening and closing are not animated. Closed panels stay in the page, so find-in-page can reveal them. Accepts `class` instead of `className`. |
| alert | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| alert-dialog | experimental | generated | verified | none | Built on the native `<dialog>` with Invoker Commands (`command`/`commandfor`): no JavaScript, but requires Baseline 2025 browsers (Chrome 135, Firefox 144, Safari 26.2). Controlled state (`open`, `defaultOpen`, `onOpenChange`) is not supported, and the trigger does not reflect the open state (`aria-expanded`). Triggers and close buttons support `render`, e.g. `render={<Button variant="outline" />}`. The overlay is the dialog's `::backdrop` (the overlay component renders nothing); closing animates out, but only Chromium keeps the popup and backdrop in the top layer meanwhile (elsewhere the backdrop disappears at once); like Base UI, outside clicks do not close it. Focus handling is the browser's: after the last control, Tab moves to the browser UI before wrapping (page content stays inert), where Base UI keeps focus inside the popup. Accepts `class` instead of `className`. |
| aspect-ratio | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| attachment | experimental | generated | verified | none | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| avatar | experimental | generated | verified | `/shadcn/avatar.js` | The image covers the fallback once it loads, so avatars work without JavaScript. Hiding an image that fails to load (the fallback shows instead) and removing the fallback after a load need the client script `/shadcn/avatar.js` (`<script type="module" src="/shadcn/avatar.js">`); without it a broken image shows its alt text over the fallback. The fallback's `delay` and `onLoadingStatusChange` are not supported. Accepts `class` instead of `className`. |
| badge | experimental | generated | verified | none | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| breadcrumb | experimental | generated | verified | none | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| bubble | experimental | generated | verified | none | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| button | experimental | generated | verified | none | Renders a native `<button>` with `type="button"` by default, like Base UI; pass `type="submit"` for form submission. `render` is supported on the server; a non-button target such as `render={<a href="/docs" />}` keeps its native role (no `role="button"` or `tabindex`), since the client-side button behavior Base UI adds is not shipped. `focusableWhenDisabled` is not supported. Accepts `class` instead of `className`. |
| button-group | experimental | generated | verified | none | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| card | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| checkbox | experimental | generated | verified | none | Built on a native `<input type="checkbox">` inside the styled root: no JavaScript, and the value is submitted with forms. `id`, `name`, `value`, `disabled`, `required`, `form` and `aria-*` go to the input, so `<Label for>` works as usual. `checked`/`defaultChecked` set the initial state; `onCheckedChange`, `readOnly`, `indeterminate` and `render` are not supported. Accepts `class` instead of `className`. |
| collapsible | experimental | generated | verified | `/shadcn/collapsible.js` | When `CollapsibleTrigger` is the first child of `Collapsible`, it is built on native `<details>`/`<summary>`: no JavaScript, but every other child is hidden while closed, not only `CollapsibleContent`, and state attributes (`data-open`, `data-panel-open`) are not rendered (use `open:` variants). With the trigger anywhere else, the trigger is a `<button>` and the content is hidden while closed, like Base UI; toggling needs the client script `/shadcn/collapsible.js` (`<script type="module" src="/shadcn/collapsible.js">`), and Base UI's state attributes are rendered. `CollapsibleTrigger` does not support `render`; style it with `class` (for example `buttonVariants()`). `open`/`defaultOpen` set the initial state; `onOpenChange` and `disabled` are not supported. Accepts `class` instead of `className`. |
| combobox | experimental | generated-with-adapter | verified | `/shadcn/combobox.js` | Opening, filtering, keyboard highlighting and selection need the client script `/shadcn/combobox.js` (`<script type="module" src="/shadcn/combobox.js">`); without it the input shows the initial selection and the form submits the initial value. The list is a native popover placed with CSS anchor positioning. Items come from `items` and the `ComboboxList` render function (or static children); values are compared by their string form (`itemToStringValue`, a `{ label, value }` object's value, or the string). Filtering follows Base UI's default (contains, ignoring case, accents and punctuation); `filter`, `limit`, `filteredItems` and `inline` are not supported. New chips of a multiple combobox are copied from the `ComboboxValue` render function's output for the first item, with its label replaced. Controlled state (`open`, `onValueChange`, `inputValue`) is not supported. Accepts `class` instead of `className`. `useComboboxAnchor()` returns a CSS anchor name for `ComboboxChips` (`ref`) and `ComboboxContent` (`anchor`) instead of a React ref. |
| context-menu | experimental | generated | verified | `/shadcn/menu.js` | A right click on the trigger area opens the menu at the pointer; this needs the client script `/shadcn/menu.js` (`<script type="module" src="/shadcn/menu.js">`), without which the browser's own context menu appears. The menu is a native popover placed with CSS anchor positioning, and the script adds the menu behavior (focus, arrow keys, typeahead, checkbox and radio items, submenus). Long presses on touch screens do not open it. Items have no `onClick` on the server: use `render` for links (`render={<a href="/settings" />}`) or form buttons. Controlled state (`open`, `onOpenChange`, `checked`/`onCheckedChange`, `value`/`onValueChange`), `modal` (page scroll is not locked) and `openOnHover` on the root are not supported. Accepts `class` instead of `className`. |
| dialog | experimental | generated | verified | none | Built on the native `<dialog>` with Invoker Commands (`command`/`commandfor`): no JavaScript, but requires Baseline 2025 browsers (Chrome 135, Firefox 144, Safari 26.2). Controlled state (`open`, `defaultOpen`, `onOpenChange`) is not supported, and the trigger does not reflect the open state (`aria-expanded`). Triggers and close buttons support `render`, e.g. `render={<Button variant="outline" />}`. The overlay is the dialog's `::backdrop` (the overlay component renders nothing); closing animates out, but only Chromium keeps the popup and backdrop in the top layer meanwhile (elsewhere the backdrop disappears at once); outside clicks close the dialog only where `closedby` is supported. Focus handling is the browser's: after the last control, Tab moves to the browser UI before wrapping (page content stays inert), where Base UI keeps focus inside the popup. Accepts `class` instead of `className`. |
| direction | experimental | generated-with-adapter | verified | none | `DirectionProvider` carries the direction through Hono context and renders no element, like Base UI; set `dir` on an element too. The generated components follow the CSS direction, so they do not need it. |
| drawer | experimental | generated | verified | `/shadcn/drawer.js` | Built on the native `<dialog>` with Invoker Commands (`command`/`commandfor`), like Dialog: opening, closing, Escape and outside clicks need no JavaScript (Baseline 2025 browsers). The overlay is the dialog's `::backdrop` (the overlay component renders nothing), and the viewport renders nothing. Swiping to close needs the client script `/shadcn/drawer.js` (`<script type="module" src="/shadcn/drawer.js">`). Snap points, nested drawer stacking, swipe areas and `modal={false}` are not supported (the drawer always opens as a modal dialog). Controlled state (`open`, `defaultOpen`, `onOpenChange`) is not supported. Accepts `class` instead of `className`. |
| dropdown-menu | experimental | generated | verified | `/shadcn/menu.js` | The menu is a native popover placed with CSS anchor positioning, so it opens without JavaScript (placement needs Chrome 135, Firefox 147 or Safari 26.2). The client script `/shadcn/menu.js` (`<script type="module" src="/shadcn/menu.js">`) adds the menu behavior: focus handling, arrow keys, typeahead, checkbox and radio items, submenus and closing after a choice. Items have no `onClick` on the server: use `render` for links (`render={<a href="/settings" />}`) or form buttons. Controlled state (`open`, `onOpenChange`, `checked`/`onCheckedChange`, `value`/`onValueChange`), `modal` (page scroll is not locked) and `openOnHover` on the root are not supported. Accepts `class` instead of `className`. |
| empty | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| field | experimental | generated | verified | none | Accepts `class` instead of `className`. Selectors for checkbox and radio roles (`[role=checkbox]`) match the generated controls by `data-slot`, as their roots carry no role. Checked-state styles (`has-data-checked:`) follow the native `:checked` state of the generated controls. |
| hover-card | experimental | generated | verified | `/shadcn/hover.js` | Opening on hover or keyboard focus needs the client script `/shadcn/hover.js` (`<script type="module" src="/shadcn/hover.js">`); without it the card does not open and the trigger works as a plain link. The card is a native popover placed with CSS anchor positioning. Controlled state (`open`, `onOpenChange`) is not supported. Accepts `class` instead of `className`. |
| input | experimental | generated | verified | none | Client-side field state attributes (`data-dirty`, `data-touched`, `data-focused`, `data-filled`, `data-valid`) and the auto-generated `id` are not rendered. Accepts `class` instead of `className`. |
| input-group | experimental | generated-with-adapter | verified | `/shadcn/input-group.js` | Accepts `class` instead of `className`. Clicking an addon focuses the input with the client script `/shadcn/input-group.js` (`<script type="module" src="/shadcn/input-group.js">`); without it the addon is not clickable. |
| item | experimental | generated | verified | none | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| kbd | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| label | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| marker | experimental | generated | verified | none | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. |
| menubar | experimental | generated | verified | `/shadcn/menu.js` | The menu is a native popover placed with CSS anchor positioning, so it opens without JavaScript (placement needs Chrome 135, Firefox 147 or Safari 26.2). The client script `/shadcn/menu.js` (`<script type="module" src="/shadcn/menu.js">`) adds the menu behavior: focus handling, arrow keys, typeahead, checkbox and radio items, submenus and closing after a choice. Items have no `onClick` on the server: use `render` for links (`render={<a href="/settings" />}`) or form buttons. Controlled state (`open`, `onOpenChange`, `checked`/`onCheckedChange`, `value`/`onValueChange`), `modal` (page scroll is not locked) and `openOnHover` on the root are not supported. Moving between menus with the arrow keys and switching menus by hovering while one is open need the client script `/shadcn/menu.js` (`<script type="module" src="/shadcn/menu.js">`); without it each menu still opens with its trigger. `modal` is not supported. Accepts `class` instead of `className`. |
| message | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| native-select | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| navigation-menu | experimental | generated | verified | `/shadcn/navigation-menu.js` | Opening items on hover, click and the keyboard needs the client script `/shadcn/navigation-menu.js` (`<script type="module" src="/shadcn/navigation-menu.js">`); without it only the top-level links work. The content shows in a native popover placed with CSS anchor positioning under the open item's trigger. Controlled state (`value`, `defaultValue`, `onValueChange`) is not supported. Switching items does not animate the popup's size. Accepts `class` instead of `className`. |
| pagination | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| popover | experimental | generated | verified | none | Built on the native `popover` attribute with Invoker Commands and CSS anchor positioning: no JavaScript, but placement next to the trigger needs Chrome 135, Firefox 147 or Safari 26.2 (elsewhere the popover opens centered). Outside clicks and Escape close it. Controlled state (`open`, `defaultOpen`, `onOpenChange`) and `openOnHover` are not supported. `side`, `align`, `sideOffset` and `alignOffset` place the popover; on collision it flips to the opposite side, but `data-side` keeps the requested side. Focus is not moved into the popover, and the positioner's classes are not rendered. Accepts `class` instead of `className`. |
| progress | experimental | generated | verified | none | Server-rendered: the progressbar is not linked to `ProgressLabel` (Base UI links them on the client); pass `aria-label` or `aria-labelledby`. Function children of `ProgressValue` are not supported. Accepts `class` instead of `className`. |
| radio-group | experimental | generated | verified | none | `value`/`defaultValue` set the initial selection; `onValueChange` and `readOnly` are not supported. Built on native `<input type="radio">` elements sharing the group's `name` (generated unless given): no JavaScript, arrow keys move the selection, and the value is submitted with forms. `id`, `disabled` and `aria-*` go to the input. Accepts `class` instead of `className`. |
| scroll-area | experimental | generated | verified | `/shadcn/scroll-area.js` | The custom scrollbars need the client script `/shadcn/scroll-area.js` (`<script type="module" src="/shadcn/scroll-area.js">`); without it the area scrolls with the browser's own scrollbar. `overflowEdgeThreshold` is not supported. Accepts `class` instead of `className`. |
| select | experimental | generated | verified | none | Built on a customizable native `<select>` (`appearance: base-select`): no JavaScript, keyboard selection and typeahead are the browser's (Space and the arrow keys open it, Enter does not), and `name`/`value` are submitted with forms. Chrome 135, Firefox 149 and Safari 27 or later show upstream's design; older browsers show a classic select with the trigger's styles. `SelectTrigger` renders the `<select>` (so `id` and `aria-*` given to it reach the form control), and `<SelectContent>` must be a direct child of `<Select>`. `value`/`defaultValue` set the initial selection; `onValueChange`, `multiple`, `items`, value render functions and aligning the selected item with the trigger (`alignItemWithTrigger`) are not supported: the list opens below the trigger. Classes given to `SelectContent` are not applied to the list. With an inverted menu color (a preset option), the list keeps the page's colors: the browser's picker cannot take upstream's `dark` class, while the other menus are inverted. Accepts `class` instead of `className`. |
| separator | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| sheet | experimental | generated | verified | none | Built on the native `<dialog>` with Invoker Commands (`command`/`commandfor`): no JavaScript, but requires Baseline 2025 browsers (Chrome 135, Firefox 144, Safari 26.2). Controlled state (`open`, `defaultOpen`, `onOpenChange`) is not supported, and the trigger does not reflect the open state (`aria-expanded`). Triggers and close buttons support `render`, e.g. `render={<Button variant="outline" />}`. The overlay is the dialog's `::backdrop` (the overlay component renders nothing); closing animates out, but only Chromium keeps the popup and backdrop in the top layer meanwhile (elsewhere the backdrop disappears at once); outside clicks close the dialog only where `closedby` is supported. Focus handling is the browser's: after the last control, Tab moves to the browser UI before wrapping (page content stays inert), where Base UI keeps focus inside the popup. Accepts `class` instead of `className`. |
| sidebar | experimental | generated-with-adapter | verified | `/shadcn/sidebar.js` | `render` is supported on the server (element or function), like Base UI. Accepts `class` instead of `className`. Toggling (the trigger, the rail and Ctrl/Cmd+B), remembering the state in the `sidebar_state` cookie and the mobile sheet need the client script `/shadcn/sidebar.js` (`<script type="module" src="/shadcn/sidebar.js">`); without it the sidebar shows in its initial state on wide screens and not at all on narrow ones. On the server the state comes from `open` or `defaultOpen` (read the cookie to restore it); `onOpenChange` is not supported, and `useSidebar()` only reports that state (its setters throw on the server). The mobile sheet is rendered once, empty: the script moves the sidebar's content into it while it is open. |
| skeleton | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| slider | experimental | generated | verified | `/shadcn/slider.js` | Each thumb holds a native `<input type="range">` (focusable, keyboard-operable and submitted with `name`). Pointer dragging, keeping range thumbs in order and moving the thumbs as values change need the client script `/shadcn/slider.js` (`<script type="module" src="/shadcn/slider.js">`); without it the initial values are shown and submitted. Controlled state (`onValueChange`), `format`, `locale` and `largeStep` are not supported (Page Up and Page Down use the browser's step). Accepts `class` instead of `className`. |
| spinner | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| switch | experimental | generated | verified | none | Built on a native `<input type="checkbox" role="switch">` inside the styled root: no JavaScript, and the value is submitted with forms. `id`, `name`, `value`, `disabled`, `required`, `form` and `aria-*` go to the input, so `<Label for>` works as usual. `checked`/`defaultChecked` set the initial state; `onCheckedChange`, `readOnly` and `render` are not supported. Accepts `class` instead of `className`. |
| table | experimental | generated | verified | none | Accepts `class` instead of `className`. Selectors for checkbox and radio roles (`[role=checkbox]`) match the generated controls by `data-slot`, as their roots carry no role. |
| tabs | experimental | generated | verified | `/shadcn/tabs.js` | Switching tabs needs the client script `/shadcn/tabs.js` (`<script type="module" src="/shadcn/tabs.js">`); without it the selected panel is shown. Pointer, Enter, Space, arrow keys, Home and End work like Base UI. Inactive panels are rendered with `hidden` (Base UI does not render them). Controlled state (`onValueChange`) and `render` are not supported; `value`/`defaultValue` set the selected tab. Accepts `class` instead of `className`. |
| textarea | experimental | generated | verified | none | Accepts `class` instead of `className`. |
| toast | experimental | generated-with-adapter | verified | `/shadcn/toast.js` | Toasts are added in the browser with `toast` from the client script (`import { toast } from "/shadcn/toast.js"`, then `toast.add({ title, description, type, actionProps })`), or declaratively with `data-toast-trigger` buttons (`data-toast-title`, `data-toast-description`, `data-toast-type`). The script copies the toast markup from templates that `<Toaster>` renders, so edit the components as usual. On the server, pass toasts to `<Toaster toasts={[{ title: "Saved" }]} />` (for example flash messages after a form post) or use a per-response `createToastManager()` with `<Toaster toastManager={manager}>`; they show without JavaScript, and the script times them out. The exported `toast` is shared by every request on the server, so its `add()` throws there. Action `onClick` and other function props, and `useToastManager()` state updates, work only through `/shadcn/toast.js`. Accepts `class` instead of `className`. |
| toggle | experimental | generated | verified | none | A `label` around a visually hidden native checkbox (the pressed state is its checked state): no JavaScript, and `name`/`value` are submitted with forms. `aria-*` goes to the input, so icon-only toggles need `aria-label` as upstream. Space toggles, Enter does not (a checkbox, not a button); `pressed`/`defaultPressed` set the initial state; `onPressedChange` and `render` are not supported. Accepts `class` instead of `className`. |
| toggle-group | experimental | generated | verified | none | Items are native radios sharing a `name` (checkboxes with `multiple`): the pressed item of a single-selection group cannot be released by pressing it again, and arrow keys select as they move. `defaultValue` sets the pressed items; `value`/`onValueChange` are not supported. A `label` around a visually hidden native checkbox (the pressed state is its checked state): no JavaScript, and `name`/`value` are submitted with forms. `aria-*` goes to the input, so icon-only toggles need `aria-label` as upstream. Space toggles, Enter does not (a checkbox, not a button); `pressed`/`defaultPressed` set the initial state; `onPressedChange` and `render` are not supported. Accepts `class` instead of `className`. |
| tooltip | experimental | generated | verified | `/shadcn/hover.js` | Opening on hover or keyboard focus needs the client script `/shadcn/hover.js` (`<script type="module" src="/shadcn/hover.js">`); without it the tooltip does not open, but the trigger's `aria-describedby` still exposes its text. The popup is a native popover placed with CSS anchor positioning. Unlike Base UI, the popup has `role="tooltip"` and describes the trigger. Controlled state (`open`, `onOpenChange`) is not supported. Accepts `class` instead of `className`. |

Lite alternatives approximate a component that has no port yet, without JavaScript. They are hand-written, not ports, and a port may later take the upstream name ([ADR 0028](docs/adr/0028-offer-hand-written-lite-alternatives-with-a-lite-suffix-for-components-without-a-port.md)).

| Lite alternative | Based on | Status | Visual parity | Client JS | Known differences |
| --- | --- | --- | --- | --- | --- |
| input-otp-lite | input-otp | experimental | approximate | none | A lite alternative to `input-otp` (not a port), with no JavaScript: one native text input over the slots, as in daisyUI, so typing, pasting, one-time-code autofill (`autocomplete="one-time-code"`) and form validation (`minlength`, `pattern`, `required`) come from the browser. One component with `maxLength` slots instead of `InputOTPGroup`, `InputOTPSlot` and `InputOTPSeparator`; the whole group is highlighted while focused (upstream highlights the active slot, with a blinking caret). Characters are aligned with tabular digits: set a monospace font (`class="font-mono"`) for letters. Accepts `class` instead of `className`. |
| date-picker-lite | calendar, input | experimental | not-compared | none | A lite alternative to a date picker built from `calendar` (not a port), with no JavaScript: upstream's Input as a native date input (`type` can also be `datetime-local`, `month` or `week`) with a calendar icon, submitting ISO values. The browser draws the calendar popup, which cannot be styled (it follows `color-scheme` in dark mode) and differs between browsers; the field shows the browser's date format rather than a placeholder. Date ranges and several months are not supported. Accepts `class` instead of `className`. |

<details>
<summary>Not yet available (10 upstream components)</summary>

| Component | Classification | Blocking reasons |
| --- | --- | --- |
| calendar | unsupported | `react-hook:useEffect`, `react-hook:useRef`, `react-runtime-api:React.useEffect`, `react-runtime-api:React.useRef`, `unknown-import:react-day-picker` |
| carousel | unsupported | `event-handler:onClick`, `event-handler:onKeyDownCapture`, `react-hook:useEffect`, `react-hook:useEmblaCarousel`, `react-hook:useState`, `react-runtime-api:React.useEffect`, `react-runtime-api:React.useState`, `react-type-unmapped:React.KeyboardEvent`, `unknown-import:embla-carousel-react` |
| chart | unsupported | `react-hook:useId`, `react-runtime-api:React.useId`, `react-type-unmapped:React.ComponentType`, `unknown-import:recharts` |
| command | unsupported | `unknown-import:cmdk` |
| form | unsupported | `no-files` |
| input-otp | unsupported | `unknown-import:input-otp` |
| message-scroller | unsupported | `render-prop:MessageScrollerPrimitive.Button`, `unknown-import:@shadcn/react/message-scroller` |
| questionnaire | unsupported | `unknown-import:@shadcn/react/questionnaire` |
| resizable | unsupported | `unknown-import:react-resizable-panels` |
| sonner | unsupported | `react-hook:useTheme`, `unknown-import:next-themes`, `unknown-import:sonner` |

</details>
<!-- compatibility-table:end -->

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
