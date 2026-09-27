import { createRoute } from "honox/factory"
import { components } from "@/lib/catalog"
import { componentPages, docsNav } from "@/lib/docs"

/** The search dialog's index (components/search.tsx, app/client.ts). */
export default createRoute((c) =>
  c.json({
    pages:
      docsNav[1]?.items.map((item) => ({
        title: item.title,
        href: item.href,
      })) ?? [],
    components: components.map((entry) => ({
      title: entry.title,
      href: `/docs/components/${entry.name}`,
      description: componentPages.get(entry.name)?.frontmatter.description,
    })),
  })
)
