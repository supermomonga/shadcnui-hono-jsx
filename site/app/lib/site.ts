export const siteConfig = {
  name: "shadcnui-hono-jsx",
  url: "https://shadcn-hono.omofla.sh",
  description:
    "Accessible components with thoughtful defaults, translated from shadcn/ui into Hono JSX. Server-rendered, no React, styled by the presets of ui.shadcn.com/create.",
  links: {
    github: "https://github.com/supermomonga/shadcnui-hono-jsx",
    npm: "https://www.npmjs.com/package/shadcnui-hono-jsx",
    upstream: "https://ui.shadcn.com",
    releases: "https://github.com/supermomonga/shadcnui-hono-jsx/releases",
  },
  navItems: [
    { href: "/", label: "Home" },
    { href: "/docs/installation", label: "Docs" },
    { href: "/docs/components", label: "Components" },
    { href: "/create", label: "Create" },
  ],
} as const

/** The package the documented commands run. */
export const CLI = "shadcnui-hono-jsx@latest"
