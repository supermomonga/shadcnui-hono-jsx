import { raw } from "hono/html"
import { jsxRenderer } from "hono/jsx-renderer"
import { Link } from "honox/server"
import { THEME_SCRIPT } from "@/components/mode-switcher"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { SiteScript } from "@/components/site-script"
import { siteConfig } from "@/lib/site"

export default jsxRenderer(({ children, title, description, bare }, c) => {
  const pageTitle = title ? `${title} - ${siteConfig.name}` : siteConfig.name
  const pageDescription = description ?? siteConfig.description
  const url = new URL(c.req.path, siteConfig.url).toString()
  return (
    <html
      lang="en"
      class="[--header-height:calc(var(--spacing)*14)] lg:[--header-height:calc(var(--spacing)*16)]"
    >
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:site_name" content={siteConfig.name} />
        <meta name="twitter:card" content="summary" />
        <link rel="canonical" href={url} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script>{raw(THEME_SCRIPT)}</script>
        <Link href="/app/style.css" rel="stylesheet" />
        <SiteScript src="/app/client.ts" />
        <script type="module" src="/shadcn/tabs.js" />
      </head>
      <body class="group/body overscroll-none bg-background font-sans text-foreground antialiased [--footer-height:calc(var(--spacing)*14)] xl:[--footer-height:calc(var(--spacing)*24)]">
        {bare ? (
          children
        ) : (
          <div
            data-slot="layout"
            class="group/layout relative z-10 flex min-h-svh flex-col bg-background has-data-[slot=designer]:h-svh has-data-[slot=designer]:overflow-hidden"
          >
            <SiteHeader pathname={c.req.path} />
            <main class="flex min-h-0 flex-1 flex-col">{children}</main>
            <SiteFooter />
          </div>
        )}
      </body>
    </html>
  )
})
