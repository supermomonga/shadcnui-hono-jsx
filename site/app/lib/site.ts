export const siteConfig = {
  name: "shadcn/ui Hono JSX",
  url: "https://shadcn-hono.omofla.sh",
  description:
    "Accessible components with thoughtful defaults, translated from shadcn/ui into Hono JSX. Server-rendered, no React, styled by the presets of ui.shadcn.com/create.",
  /** The social image (public/og.png, `bun run site:images`). */
  ogImage: {
    url: "/og.png",
    width: 1200,
    height: 630,
    alt: "shadcn/ui Hono JSX: shadcn/ui's cards, rendered by Hono JSX",
  },
  /** The browser UI's colors: the default preset's background. */
  themeColor: { light: "#ffffff", dark: "#0a0a0a" },
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

/**
 * The components' client scripts (public/shadcn/): pages render every
 * component, and the scripts only listen on the document.
 */
export const CLIENT_SCRIPTS = [
  "avatar",
  "collapsible",
  "combobox",
  "drawer",
  "hover",
  "input-group",
  "menu",
  "navigation-menu",
  "scroll-area",
  "sidebar",
  "slider",
  "tabs",
  "toast",
]
