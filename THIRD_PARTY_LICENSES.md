# Third-party licenses

shadcnui-hono-jsx is an unofficial community project. It is not affiliated with,
maintained by, or endorsed by shadcn or the shadcn/ui project.

## shadcn/ui

The generated components in `components/ui/`, the theme in `styles/shadcn/`,
and the upstream snapshot in `upstream/` are derived from
[shadcn/ui](https://github.com/shadcn-ui/ui) (including the `shadcn` package's
`tailwind.css`). They are translated to Hono JSX by this project's generator.

Every registry item also installs `LICENSE-shadcnui-hono-jsx.txt`, which
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

## Base UI

[Base UI](https://github.com/mui/base-ui) (MIT) is used only as a behavioral
reference for the DOM attributes that generated components emit. No Base UI
source code is distributed.

## Runtime dependencies installed by registry items

These packages are installed from npm into the consuming project; they are not
redistributed by this repository.

| Package | License |
| --- | --- |
| [cn](https://github.com/shadcn-ui/cn) | MIT |
| [class-variance-authority](https://github.com/joe-bell/cva) | Apache-2.0 |
| [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) | MIT |
