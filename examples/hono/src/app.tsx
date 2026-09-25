import { Hono } from "hono"
import { Demo } from "./demo"
import { Layout } from "./layout"

export const app = new Hono()

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
