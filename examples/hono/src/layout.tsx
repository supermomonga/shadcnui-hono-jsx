import type { Child } from "hono/jsx"

export function Layout({
  title,
  children,
}: {
  title: string
  children?: Child
}) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="stylesheet" href="/style.css" />
        {/* Optional client scripts for interactive components (public/shadcn/). */}
        <script type="module" src="/shadcn/tabs.js" />
      </head>
      <body class="min-h-svh bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
