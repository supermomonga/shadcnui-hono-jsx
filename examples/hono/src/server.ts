import { serveStatic } from "hono/bun"
import { app } from "./app"

app.use("/style.css", serveStatic({ root: "./public" }))

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
}
