import { ssgParams } from "hono/ssg"
import { createRoute } from "honox/factory"
import { exampleComponent, manifest } from "@/lib/examples"

/** Examples that need the whole viewport, shown in a frame (`type="block"`). */
export const BLOCK_EXAMPLES = ["sidebar-demo"]

export default createRoute(
  ssgParams(() =>
    BLOCK_EXAMPLES.filter((name) => exampleComponent(name)).map((name) => ({
      name,
    }))
  ),
  (c) => {
    const name = c.req.param("name") ?? ""
    const Example = exampleComponent(name)
    if (!Example || !manifest.examples[name]) return c.notFound()
    return c.render(<Example />, { title: name, bare: true })
  }
)
