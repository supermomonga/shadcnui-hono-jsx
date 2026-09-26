import { raw } from "hono/html"
import { ssgParams } from "hono/ssg"
import { createRoute } from "honox/factory"
import { ComponentInstall } from "@/components/component-install"
import { DocsPage, StatusBadge } from "@/components/docs-page"
import { DocsLayout } from "@/components/docs-sidebar"
import { components, findComponent, titleOf } from "@/lib/catalog"
import { inlineMarkdown } from "@/lib/inline-markdown"

export default createRoute(
  ssgParams(() => components.map((entry) => ({ name: entry.name }))),
  (c) => {
    const entry = findComponent(c.req.param("name") ?? "")
    if (!entry) return c.notFound()
    const href = `/docs/components/${entry.name}`
    const basedOn = entry.compatibility?.basedOn?.map((b) => b.name) ?? []
    const upstreamName = entry.kind === "lite" ? basedOn[0] : entry.name
    const description =
      entry.kind === "lite"
        ? `A hand-written alternative to the shadcn/ui ${basedOn.map(titleOf).join(" and ")} component, without JavaScript.`
        : `The shadcn/ui ${entry.title} component for Hono JSX.`
    const toc = [
      { depth: 2, title: "Installation", id: "installation" },
      { depth: 2, title: "Notes", id: "notes" },
    ]
    return c.render(
      <DocsLayout pathname={href}>
        <DocsPage
          href={href}
          title={entry.title}
          description={description}
          toc={toc}
          badges={
            <>
              {entry.kind === "lite" && <StatusBadge>Lite</StatusBadge>}
              {entry.scripts.length > 0 && <StatusBadge>Client JS</StatusBadge>}
              {entry.unreleased && <StatusBadge>Unreleased</StatusBadge>}
            </>
          }
        >
          <h2 id="installation">Installation</h2>
          <ComponentInstall entry={entry} />
          <h2 id="notes">Notes</h2>
          <ul>
            {(entry.compatibility?.knownDifferences ?? []).map((note) => (
              <li>{raw(inlineMarkdown(note))}</li>
            ))}
            {upstreamName && (
              <li>
                Upstream documentation:{" "}
                <a
                  href={`https://ui.shadcn.com/docs/components/base/${upstreamName}`}
                >
                  shadcn/ui {titleOf(upstreamName)}
                </a>
                .
              </li>
            )}
          </ul>
        </DocsPage>
      </DocsLayout>,
      { title: entry.title, description }
    )
  }
)
