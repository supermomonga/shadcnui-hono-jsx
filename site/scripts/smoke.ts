/**
 * Checks the built site (dist/): every page exists, internal links resolve,
 * no React prop leaks into the HTML, and the output stays within Cloudflare's
 * static asset limits (20,000 files, 25 MiB per file on the Free plan).
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import catalog from "../../cli/generated/catalog.json"

const dist = path.resolve(import.meta.dirname, "../dist")
const failures: string[] = []

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

const files = walk(dist)
const relative = new Set(files.map((file) => `/${path.relative(dist, file)}`))

function resolves(pathname: string): boolean {
  const clean = pathname.replace(/\/$/, "") || "/"
  return (
    clean === "/" ||
    relative.has(clean) ||
    relative.has(`${clean}.html`) ||
    relative.has(`${clean}/index.html`)
  )
}

if (files.length >= 20_000)
  failures.push(`${files.length} files (limit 20,000)`)
for (const file of files) {
  if (statSync(file).size >= 25 * 1024 * 1024) {
    failures.push(`${path.relative(dist, file)} is 25 MiB or larger`)
  }
}

const pages = [
  "/index.html",
  "/404.html",
  "/docs.html",
  "/docs/components.html",
  "/create.html",
  ...catalog.items.map((item) => `/docs/components/${item.name}.html`),
]
for (const page of pages) {
  if (!relative.has(page)) failures.push(`missing ${page}`)
}

for (const file of files.filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(file, "utf8")
  const name = path.relative(dist, file)
  if (/\sclassName=/.test(html)) failures.push(`${name} renders className`)
  for (const [, href] of html.matchAll(/\shref="(\/[^"#?]*)/g)) {
    if (href && !href.startsWith("/api/") && !resolves(href)) {
      failures.push(`${name} links to missing ${href}`)
    }
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"))
  process.exit(1)
}
console.log(`Checked ${files.length} files and ${pages.length} pages in dist/.`)
