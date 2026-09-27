import { raw } from "hono/html"
import { jsxRenderer } from "hono/jsx-renderer"
import { Link } from "honox/server"
import { THEME_SCRIPT } from "@/components/mode-switcher"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { SiteScript } from "@/components/site-script"
import { Toaster } from "@/components/ui/toast"
import { CLIENT_SCRIPTS, siteConfig } from "@/lib/site"

export default jsxRenderer(
  ({ children, title, description, bare, oembed }, c) => {
    const pageTitle = title ? `${title} - ${siteConfig.name}` : siteConfig.name
    const pageDescription = description ?? siteConfig.description
    const url = new URL(c.req.path, siteConfig.url).toString()
    const { ogImage, themeColor } = siteConfig
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
          {bare && <meta name="robots" content="noindex" />}
          <link rel="canonical" href={url} />
          <meta
            name="theme-color"
            media="(prefers-color-scheme: light)"
            content={themeColor.light}
          />
          <meta
            name="theme-color"
            media="(prefers-color-scheme: dark)"
            content={themeColor.dark}
          />
          {/* Link previews (Open Graph, X) and embeds (oEmbed). */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content={siteConfig.name} />
          <meta property="og:locale" content="en_US" />
          <meta property="og:url" content={url} />
          <meta property="og:title" content={title ?? siteConfig.name} />
          <meta property="og:description" content={pageDescription} />
          <meta
            property="og:image"
            content={new URL(ogImage.url, siteConfig.url).toString()}
          />
          <meta property="og:image:type" content="image/png" />
          <meta property="og:image:width" content={String(ogImage.width)} />
          <meta property="og:image:height" content={String(ogImage.height)} />
          <meta property="og:image:alt" content={ogImage.alt} />
          <meta name="twitter:card" content="summary_large_image" />
          {oembed && (
            <link
              rel="alternate"
              type="application/json+oembed"
              href={new URL(oembed, siteConfig.url).toString()}
              title={pageTitle}
            />
          )}
          <link rel="icon" href="/favicon.ico" sizes="32x32" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.webmanifest" />
          <script>{raw(THEME_SCRIPT)}</script>
          <Link href="/app/style.css" rel="stylesheet" />
          <SiteScript src="/app/client.ts" />
          {CLIENT_SCRIPTS.map((name) => (
            <script type="module" src={`/shadcn/${name}.js`} />
          ))}
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
          {/* For the examples' toasts, as in the layout of upstream's website. */}
          <Toaster />
        </body>
      </html>
    )
  }
)
