import { ssgParams } from "hono/ssg"
import { createRoute } from "honox/factory"
import { ComponentInstall } from "@/components/component-install"
import { ComponentNotes } from "@/components/component-notes"
import { DocsPage, StatusBadge } from "@/components/docs-page"
import { DocsLayout } from "@/components/docs-sidebar"
import { mdxComponents } from "@/components/mdx-components"
import { components, findComponent } from "@/lib/catalog"
import { componentPages } from "@/lib/docs"
import { componentMeta, embedExample, oembedPath } from "@/lib/embed"

export default createRoute(
  ssgParams(() => components.map((entry) => ({ name: entry.name }))),
  (c) => {
    const entry = findComponent(c.req.param("name") ?? "")
    if (!entry) return c.notFound()
    const href = `/docs/components/${entry.name}`
    const page = componentPages.get(entry.name)
    const { title, description } = componentMeta(entry)
    const Content = page?.default
    return c.render(
      <DocsLayout pathname={href}>
        <DocsPage
          href={href}
          title={title}
          description={description}
          toc={
            page?.toc ?? [
              { depth: 2, title: "Installation", id: "installation" },
              { depth: 2, title: "Notes", id: "notes" },
            ]
          }
          badges={
            <>
              {entry.kind === "lite" && <StatusBadge>Lite</StatusBadge>}
              {entry.scripts.length > 0 && <StatusBadge>Client JS</StatusBadge>}
              {entry.unreleased && <StatusBadge>Unreleased</StatusBadge>}
            </>
          }
        >
          {Content ? (
            <Content components={mdxComponents} />
          ) : (
            <>
              <h2 id="installation">Installation</h2>
              <ComponentInstall name={entry.name} />
              <h2 id="notes">Notes</h2>
              <ComponentNotes name={entry.name} />
            </>
          )}
        </DocsPage>
      </DocsLayout>,
      {
        title,
        description,
        oembed: embedExample(entry.name) && oembedPath(entry.name),
      }
    )
  }
)
