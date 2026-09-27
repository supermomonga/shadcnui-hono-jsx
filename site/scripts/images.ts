/**
 * Renders the site's social image and icons into site/public/, where they are
 * committed: og.png, a screenshot of the dev server's /og-image page
 * (app/routes/og-image.tsx), and the PNG icons and favicon.ico, from
 * favicon.svg. Run `bun run site:images` after changing either, or when the
 * home page's cards change enough to show.
 *
 * Needs Playwright's Chromium (`bunx playwright install chromium`), as the
 * visual tests do.
 */
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { chromium } from "playwright-core"
import { createServer } from "vite"
import { siteConfig } from "../app/lib/site"

const SITE_DIR = path.resolve(import.meta.dirname, "..")
const PUBLIC = path.join(SITE_DIR, "public")

/** The icons, on white where platforms would fill transparency with black. */
const ICONS = [
  { file: "apple-touch-icon.png", size: 180, background: "#ffffff" },
  { file: "icon-192.png", size: 192, background: "#ffffff" },
  { file: "icon-512.png", size: 512, background: "#ffffff" },
]

/** An ICO file holding one PNG image, which every browser reads. */
function ico(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(22)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // number of images
  header.writeUInt8(size, 6) // width
  header.writeUInt8(size, 7) // height
  header.writeUInt8(0, 8) // no palette
  header.writeUInt8(0, 9) // reserved
  header.writeUInt16LE(1, 10) // color planes
  header.writeUInt16LE(32, 12) // bits per pixel
  header.writeUInt32LE(png.length, 14)
  header.writeUInt32LE(header.length, 18) // offset of the image
  return Buffer.concat([header, png])
}

// HonoX's dev server resolves its entry (app/server.ts) from the working directory.
process.chdir(SITE_DIR)
const server = await createServer({
  root: SITE_DIR,
  configFile: path.join(SITE_DIR, "vite.config.ts"),
  logLevel: "warn",
})
await server.listen()
const browser = await chromium.launch()
try {
  const base = server.resolvedUrls?.local[0]
  if (!base) throw new Error("The dev server has no local URL")
  const { width, height } = siteConfig.ogImage
  const page = await browser.newPage({
    viewport: { width, height },
    colorScheme: "light",
  })
  const response = await page.goto(new URL("/og-image", base).toString(), {
    waitUntil: "networkidle",
  })
  if (!response?.ok()) {
    throw new Error(`/og-image responded with ${response?.status()}`)
  }
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(PUBLIC, "og.png") })

  const svg = readFileSync(path.join(PUBLIC, "favicon.svg"))
  const icon = async (size: number, background?: string) => {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(
      `<body style="margin:0;background:${background ?? "transparent"}"><img src="data:image/svg+xml;base64,${svg.toString("base64")}" width="${size}" height="${size}" style="display:block"></body>`
    )
    return page.screenshot({ omitBackground: !background })
  }
  for (const { file, size, background } of ICONS) {
    writeFileSync(path.join(PUBLIC, file), await icon(size, background))
  }
  writeFileSync(path.join(PUBLIC, "favicon.ico"), ico(await icon(32), 32))
  console.log(
    `Wrote og.png, favicon.ico and ${ICONS.map((i) => i.file).join(", ")} into site/public/.`
  )
} finally {
  await browser.close()
  await server.close()
}
