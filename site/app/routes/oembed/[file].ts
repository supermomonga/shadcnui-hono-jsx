import { ssgParams } from "hono/ssg"
import { createRoute } from "honox/factory"
import { findComponent } from "@/lib/catalog"
import { embeddable, embedExample, oembedResponse } from "@/lib/embed"

/** `/oembed/<name>.json`: the oEmbed response of a component page. */
export default createRoute(
  ssgParams(() => embeddable.map((entry) => ({ file: `${entry.name}.json` }))),
  (c) => {
    const file = c.req.param("file") ?? ""
    const entry = findComponent(file.replace(/\.json$/, ""))
    if (!file.endsWith(".json") || !entry || !embedExample(entry.name)) {
      return c.notFound()
    }
    return c.json(oembedResponse(entry))
  }
)
