import { ssgParams } from "hono/ssg"
import { createRoute } from "honox/factory"
import { Link } from "honox/server"
import { SiteScript } from "@/components/site-script"
import { CREATE_ITEMS, createItem } from "@/lib/create-items"
import { CLIENT_SCRIPTS } from "@/lib/site"

/**
 * A registry example of the create page, rendered for the preview frame. The
 * theme comes at runtime: app/preview.ts applies the preset the page sends.
 */
export default createRoute(
  ssgParams(() => CREATE_ITEMS.map((item) => ({ item: item.value }))),
  (c) => {
    const Item = createItem(c.req.param("item") ?? "")
    if (!Item) return c.notFound()
    return c.html(
      <html lang="en" class="style-nova">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="robots" content="noindex" />
          <title>Preview</title>
          <Link href="/app/preview.css" rel="stylesheet" />
          <SiteScript src="/app/preview.ts" />
          {CLIENT_SCRIPTS.map((name) => (
            <script type="module" src={`/shadcn/${name}.js`} />
          ))}
        </head>
        <body>
          <Item />
        </body>
      </html>
    )
  }
)
