/**
 * Smoke test for the production build: imports the built Bun server and
 * checks that the demo page renders with the generated components and a
 * stylesheet link.
 */
import path from "node:path"

const entry = path.resolve(import.meta.dirname, "../dist/index.js")
const app = (await import(entry)).default as {
  fetch: (request: Request) => Promise<Response>
}

const response = await app.fetch(new Request("http://localhost/"))
const html = await response.text()
const failures: string[] = []
if (response.status !== 200) failures.push(`status ${response.status}`)
for (const slot of [
  "button",
  "badge",
  "alert",
  "card",
  "input",
  "separator",
  "table",
]) {
  if (!html.includes(`data-slot="${slot}"`))
    failures.push(`missing data-slot="${slot}"`)
}
if (!/<link[^>]+rel="stylesheet"/.test(html))
  failures.push("missing stylesheet link")
for (const attribute of ["className=", " variant=", " render="]) {
  if (html.includes(attribute)) failures.push(`leaked ${attribute}`)
}

if (failures.length > 0) {
  console.error(`HonoX smoke test failed:\n  ${failures.join("\n  ")}`)
  process.exit(1)
}
console.log("HonoX smoke test passed.")
