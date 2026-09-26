import { Hono } from "hono"
import { serveStatic } from "hono/bun"
import { Demo } from "./demo"
import { Layout } from "./layout"

export const app = new Hono()

// The CLI installs client scripts into ./public/shadcn; this example
// serves the repository's copy.
app.use("/shadcn/*", serveStatic({ root: "../../public" }))

app.get("/", (c) =>
  c.html(
    <Layout title="shadcnui-hono-jsx on Hono">
      <Demo runtime="Hono" />
    </Layout>
  )
)

app.post("/subscribe", async (c) => {
  const form = await c.req.formData()
  return c.text(`Subscribed ${form.get("email")}`)
})
