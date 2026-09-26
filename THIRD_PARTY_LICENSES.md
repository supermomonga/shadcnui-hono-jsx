# Third-party licenses

shadcnui-hono-jsx is an unofficial community project. It is not affiliated with,
maintained by, or endorsed by shadcn or the shadcn/ui project.

## shadcn/ui

The component templates and the vendored files in `cli/generated/`, the themes
the CLI builds, and the upstream snapshot in `upstream/` are derived from
[shadcn/ui](https://github.com/shadcn-ui/ui) (including the `shadcn` package's
`tailwind.css` and `shadcn/preset` module). The components are translated to
Hono JSX by this project's generator.

The CLI installs `LICENSE-shadcnui-hono-jsx.txt` with the components, which
carries this notice (and this project's MIT notice for its own additions and
modifications) into the receiving project. `upstream/licenses/` holds snapshots
of the upstream license texts; they are monitored for changes and are not used
to build that notice (see
[ADR 0013](./docs/adr/0013-ship-a-reviewed-license-notice-with-every-registry-item-and-gate-upstream-license-changes.md)).

```
MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Icon libraries

Generated components that show icons inline SVG from the icon library of the
preset. The generator reads them from these pinned packages at generation
time (`upstream/licenses/` holds the reviewed license texts), and the CLI
package carries them in `generated/templates/` (Lucide) and
`generated/icons/`:

| Library | Package | License |
| --- | --- | --- |
| [Lucide](https://lucide.dev) | `lucide` | ISC (some icons derive from Feather, MIT) |
| [Tabler Icons](https://tabler.io/icons) | `@tabler/icons` | MIT |
| [Hugeicons](https://hugeicons.com) | `@hugeicons/core-free-icons` | MIT |
| [Phosphor Icons](https://phosphoricons.com) | `@phosphor-icons/core` | MIT |
| [Remix Icon](https://remixicon.com) | `remixicon` | Remix Icon License v1.0 (not an open source license: no selling the icons on their own, no competing icon library, no logos or brand identity) |

The CLI installs `LICENSE-shadcnui-hono-jsx.txt` with the components; it
reproduces the full license of the preset's icon library.

## Base UI

[Base UI](https://github.com/mui/base-ui) (MIT) is used only as a behavioral
reference for the DOM attributes that generated components emit. No Base UI
source code is distributed.

## Runtime dependencies installed by the CLI

These packages are installed from npm into the consuming project; they are not
redistributed by this repository. The CLI also installs the
`@fontsource-variable/*` packages of the preset's fonts (each under its own
license, mostly the SIL Open Font License), as the shadcn CLI does.

| Package | License |
| --- | --- |
| [cn](https://github.com/shadcn-ui/cn) | MIT |
| [class-variance-authority](https://github.com/joe-bell/cva) | Apache-2.0 |
| [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) | MIT |
