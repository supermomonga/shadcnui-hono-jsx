import type { Context } from "hono"
import { ComponentsList } from "./components-list"
import { DocsPage } from "./docs-page"
import { DocsLayout } from "./docs-sidebar"

const description =
  "Here you can find all the components available in shadcnui-hono-jsx: the shadcn/ui components translated into Hono JSX, and lite alternatives: for the ones that need a React library upstream, and for other uses such as tabs that link to pages."

export function renderComponentsIndex(c: Context) {
  return c.render(
    <DocsLayout pathname="/docs/components">
      <DocsPage
        href="/docs/components"
        title="Components"
        description={description}
        toc={[]}
      >
        <ComponentsList />
        <p>
          Components marked <strong>(Lite)</strong> are hand-written
          alternatives in upstream's style for components whose upstream version
          is built on a React library. Upstream components that are not
          available yet are listed on the{" "}
          <a href="/docs/compatibility">Compatibility</a> page.
        </p>
      </DocsPage>
    </DocsLayout>,
    { title: "Components", description }
  )
}
