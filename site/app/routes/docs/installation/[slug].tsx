import { ssgParams } from "hono/ssg"
import { createRoute } from "honox/factory"
import { childSlugs, renderDoc } from "@/components/doc-route"

export default createRoute(
  ssgParams(() => childSlugs("/docs/installation")),
  (c) =>
    renderDoc(c, `/docs/installation/${c.req.param("slug")}`) ?? c.notFound()
)
