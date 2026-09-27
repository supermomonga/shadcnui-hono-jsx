/**
 * Serves site/dist like Cloudflare's static assets (`/docs` → docs.html,
 * 404.html for missing pages) for local checks and the smoke test. `/api/*`
 * goes to the Worker's app.
 */
import { existsSync, statSync } from "node:fs"
import path from "node:path"
import api from "../app/api/preset"

const dist = path.resolve(import.meta.dirname, "../dist")
const port = Number(process.env.PORT ?? 4174)

function file(pathname: string): string | undefined {
  const base = path.join(dist, decodeURIComponent(pathname))
  for (const candidate of [
    base,
    `${base}.html`,
    path.join(base, "index.html"),
  ]) {
    if (
      candidate.startsWith(dist) &&
      existsSync(candidate) &&
      statSync(candidate).isFile()
    ) {
      return candidate
    }
  }
}

const server = Bun.serve({
  port,
  fetch(request) {
    const { pathname } = new URL(request.url)
    if (pathname.startsWith("/api/")) return api.fetch(request)
    const found = file(pathname === "/" ? "/index.html" : pathname)
    if (found) return new Response(Bun.file(found))
    return new Response(Bun.file(path.join(dist, "404.html")), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    })
  },
})
console.log(`Serving site/dist at ${server.url}`)
