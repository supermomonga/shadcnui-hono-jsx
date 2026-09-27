import { ssgParams } from "hono/ssg"
import { createRoute } from "honox/factory"
import { ArrowUpRight } from "lucide"
import { Icon } from "@/components/icon"
import { Logo } from "@/components/site-header"
import { findComponent } from "@/lib/catalog"
import { componentMeta, embeddable, embedExample } from "@/lib/embed"
import { exampleComponent } from "@/lib/examples"
import { siteConfig } from "@/lib/site"

/** A component's demo in a frame, as the oEmbed responses embed it. */
export default createRoute(
  ssgParams(() => embeddable.map((entry) => ({ name: entry.name }))),
  (c) => {
    const entry = findComponent(c.req.param("name") ?? "")
    const example = entry && embedExample(entry.name)
    const Example = example && exampleComponent(example)
    if (!entry || !Example) return c.notFound()
    const { title, description } = componentMeta(entry)
    const href = new URL(`/docs/components/${entry.name}`, siteConfig.url)
    return c.render(
      <div class="flex h-svh flex-col">
        <div data-slot="preview" class="min-h-0 flex-1 overflow-auto">
          <div class="preview flex min-h-full w-full items-center justify-center p-10">
            <Example />
          </div>
        </div>
        <a
          href={href.toString()}
          target="_blank"
          rel="noopener"
          class="flex h-11 shrink-0 items-center gap-2 border-t px-4 text-sm transition-colors hover:bg-muted/50"
        >
          <Logo class="size-4 shrink-0" />
          <span class="font-medium">{title}</span>
          <span class="truncate text-muted-foreground">{siteConfig.name}</span>
          <Icon
            icon={ArrowUpRight}
            class="ml-auto size-4 shrink-0 text-muted-foreground"
          />
        </a>
      </div>,
      { title, description, bare: true }
    )
  }
)
