import { disableSSG } from "hono/ssg"
import { createRoute } from "honox/factory"
import api from "../../api/preset"

export default createRoute(disableSSG(), (c) => api.fetch(c.req.raw))
