/**
 * Static server for the rendered test pages (.output/) and the client
 * scripts (public/shadcn/, served at /shadcn/ as in an installed app).
 * Module scripts do not load from file:// URLs. Started by Playwright.
 */
import path from "node:path"
import { SERVER_PORT } from "./server-url"

const HERE = import.meta.dir
const ROOTS: [prefix: string, dir: string][] = [
  ["/shadcn/", path.resolve(HERE, "../../public/shadcn")],
  ["/", path.join(HERE, ".output")],
]

Bun.serve({
  port: SERVER_PORT,
  hostname: "127.0.0.1",
  async fetch(request) {
    const { pathname } = new URL(request.url)
    for (const [prefix, dir] of ROOTS) {
      if (!pathname.startsWith(prefix)) continue
      const file = path.join(dir, pathname.slice(prefix.length))
      if (!file.startsWith(dir)) break
      const body = Bun.file(file)
      if (await body.exists()) return new Response(body)
      break
    }
    return new Response("Not found", { status: 404 })
  },
})
