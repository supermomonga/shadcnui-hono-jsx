/**
 * Checks the built site (dist/): every page exists, internal links and the
 * head's links (icons, social image, oEmbed) resolve, no React prop leaks
 * into the HTML, and the output stays within Cloudflare's static asset limits
 * (20,000 files, 25 MiB per file on the Free plan).
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import catalog from "../../cli/generated/catalog.json"
import { siteConfig } from "../app/lib/site"

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
  "/previews/nova-default/button-example.html",
  "/previews/icons/tabler.json",
  "/404.html",
  "/docs.html",
  "/docs/components.html",
  "/create.html",
  "/og.png",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
  "/embed/button.html",
  "/oembed/button.json",
  ...catalog.items.map((item) => `/docs/components/${item.name}.html`),
]
if (relative.has("/og-image.html"))
  failures.push("the dev-only /og-image is built")
for (const page of pages) {
  if (!relative.has(page)) failures.push(`missing ${page}`)
}

/** The path of a URL on the site, or undefined for other sites. */
function sitePath(url: string): string | undefined {
  const parsed = new URL(url, siteConfig.url)
  return parsed.origin === siteConfig.url ? parsed.pathname : undefined
}

/**
 * Internal links of a page, the head's links (icons, canonical, oEmbed, the
 * social image), and whether it renders React's className.
 */
async function inspect(html: string) {
  const links: string[] = []
  const head: string[] = []
  const inExamples: string[] = []
  let className = false
  await new HTMLRewriter()
    .on("head link[href]", {
      element(element) {
        head.push(element.getAttribute("href") ?? "")
      },
    })
    .on("meta[property='og:image']", {
      element(element) {
        head.push(element.getAttribute("content") ?? "")
      },
    })
    .on("*", {
      element(element) {
        if (element.hasAttribute("classname")) className = true
      },
    })
    .on("a[href^='/']", {
      element(element) {
        links.push(element.getAttribute("href") ?? "")
      },
    })
    // Examples keep upstream's links, which point into ui.shadcn.com.
    .on("[data-slot='preview'] a[href^='/']", {
      element(element) {
        inExamples.push(element.getAttribute("href") ?? "")
      },
    })
    .transform(new Response(html))
    .text()
  for (const link of inExamples) links.splice(links.indexOf(link), 1)
  return { links, head, className }
}

for (const file of files.filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(file, "utf8")
  const name = path.relative(dist, file)
  const { links, head, className } = await inspect(html)
  if (className) failures.push(`${name} renders className`)
  // The create page's previews are upstream's examples.
  if (name.startsWith("previews/")) continue
  for (const url of head) {
    const href = sitePath(url)
    if (href && !resolves(href))
      failures.push(`${name} links to missing ${url}`)
  }
  for (const link of links) {
    const href = link.replace(/[#?].*$/, "")
    if (href && !href.startsWith("/api/") && !resolves(href)) {
      failures.push(`${name} links to missing ${href}`)
    }
  }
}

// The oEmbed responses embed pages that exist.
for (const file of files.filter((f) =>
  f.includes(`${path.sep}oembed${path.sep}`)
)) {
  const name = path.relative(dist, file)
  const response = JSON.parse(readFileSync(file, "utf8")) as {
    html: string
    thumbnail_url: string
  }
  const src = /<iframe src="([^"]+)"/.exec(response.html)?.[1] ?? ""
  for (const url of [src, response.thumbnail_url]) {
    const href = sitePath(url)
    if (!href || !resolves(href)) failures.push(`${name} embeds missing ${url}`)
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"))
  process.exit(1)
}
console.log(`Checked ${files.length} files and ${pages.length} pages in dist/.`)
