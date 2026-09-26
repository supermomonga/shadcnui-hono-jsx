import { createRoute } from "honox/factory"
import {
  PageActions,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header"
import { Button } from "@/components/ui/button"

export default createRoute((c) =>
  c.render(
    <PageHeader>
      <PageHeaderHeading>Create</PageHeaderHeading>
      <PageHeaderDescription>
        Pick a style, colors, fonts and icons, preview them, and get the command
        that installs them.
      </PageHeaderDescription>
      <PageActions>
        <Button render={<a href="https://ui.shadcn.com/create" />}>
          Open ui.shadcn.com/create
        </Button>
      </PageActions>
    </PageHeader>,
    { title: "Create" }
  )
)
