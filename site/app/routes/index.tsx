import { createRoute } from "honox/factory"
import { ArrowRight } from "lucide"
import { CardsDemo } from "@/components/cards-demo"
import { Icon } from "@/components/icon"
import {
  PageActions,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/lib/site"

const title = "The Foundation for your Design System, in Hono JSX"

export default createRoute((c) =>
  c.render(
    <div class="flex flex-1 flex-col">
      <PageHeader class="md:**:[.container]:pb-8 lg:**:[.container]:pb-12">
        <Badge
          variant="secondary"
          class="bg-muted"
          render={<a href="/create" />}
        >
          Create a preset and install it with one command{" "}
          <Icon icon={ArrowRight} />
        </Badge>
        <PageHeaderHeading class="max-w-4xl">{title}</PageHeaderHeading>
        <PageHeaderDescription>{siteConfig.description}</PageHeaderDescription>
        <PageActions>
          <Button class="h-[35px]" render={<a href="/docs/installation" />}>
            Get Started
          </Button>
          <Button variant="secondary" render={<a href="/docs/components" />}>
            View Components
          </Button>
        </PageActions>
      </PageHeader>
      <div class="container-wrapper flex-1 p-0">
        <div class="container overflow-hidden px-0 lg:max-w-none">
          <section>
            <CardsDemo />
          </section>
        </div>
      </div>
    </div>,
    { description: siteConfig.description }
  )
)
