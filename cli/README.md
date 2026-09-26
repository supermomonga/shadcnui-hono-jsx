# shadcnui-hono-jsx

Installs [shadcn/ui](https://ui.shadcn.com) components ported to
[Hono JSX](https://hono.dev/docs/guides/jsx), without React, styled by a
preset from [ui.shadcn.com/create](https://ui.shadcn.com/create).

> [!WARNING]
> **Experimental.** This is an unofficial community project. It is not
> affiliated with, maintained by, or endorsed by shadcn or the shadcn/ui
> project.

In the root of a Hono project with Tailwind CSS v4:

```sh
npx shadcnui-hono-jsx init --preset <code>   # or bunx; without --preset, nova
npx shadcnui-hono-jsx add button card
npx shadcnui-hono-jsx apply --preset <code>  # change the preset later
```

`init` writes `shadcnui-hono-jsx.json`, the theme (`styles/shadcn/`) and
`LICENSE-shadcnui-hono-jsx.txt`; `add` writes components to
`components/ui/`. See the
[repository](https://github.com/supermomonga/shadcnui-hono-jsx#readme) for the
setup, the supported components and their differences from shadcn/ui.

The package contains sources derived from shadcn/ui and icons of the preset's
icon library; see [LICENSE](./LICENSE). Remix Icon is under the Remix Icon
License v1.0, which is not an open source license.
