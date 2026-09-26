/**
 * Renders the create page's previews: the registry examples
 * (site/generated/create/) with the components of every Base UI style and
 * menu color, as `init` installs them, into static pages
 * (`dist/previews/<style>-<menu color>/<example>.html`). The rest of the
 * design system is applied in the frame at runtime (app/preview.ts): colors,
 * radius and fonts from /api/preset, the direction (the RTL components are
 * used, which also render left to right), and the icon library, whose icons
 * are swapped in from `dist/previews/icons/<library>.json`.
 *
 * `bun site/scripts/previews.ts` runs after `vite build` (it reads the build
 * manifest); `--dev` writes to site/public/previews/ for the Vite dev server.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"
import type { FC } from "hono/jsx"
import { jsx } from "hono/jsx"
import { ICON_MARKER, type IconNames } from "../../cli/src/icons"
import { MENU_COLORS } from "../../cli/src/variants"
import { devInstall } from "../../generator/src/dev-install"
import { INLINED_LIBRARIES } from "../../generator/src/icons/libraries"
import { config } from "../../generator.config"
import { CLIENT_SCRIPTS } from "../app/lib/site"
import site from "../package.json"

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: { dev: { type: "boolean", default: false } },
})

const SITE_DIR = path.resolve(import.meta.dirname, "..")
const CACHE = path.join(SITE_DIR, ".cache", "preview")
const CREATE = path.join(SITE_DIR, "generated", "create")
const OUT = values.dev
  ? path.join(SITE_DIR, "public", "previews")
  : path.join(SITE_DIR, "dist", "previews")

/** The URLs of the preview's stylesheet and script. */
function assets(): { css: string; js: string } {
  if (values.dev) return { css: "/app/preview.css", js: "/app/preview.ts" }
  const manifest = JSON.parse(
    readFileSync(path.join(SITE_DIR, "dist/.vite/manifest.json"), "utf8")
  ) as Record<string, { file: string }>
  const file = (entry: string) => {
    const found = manifest[entry]?.file
    if (!found) throw new Error(`${entry} is not in the build manifest`)
    return `/${found}`
  }
  return { css: file("app/preview.css"), js: file("app/preview.ts") }
}

/** Unique icons of every installed file, by their names in each library. */
const icons = new Map<string, { id: number; names: IconNames }>()

/** Marks each inline icon's `<svg>` with an id, so the frame can swap it. */
function markIcons(source: string): string {
  const lines = source.split("\n")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string
    if (!line.startsWith(ICON_MARKER)) continue
    const json = line.slice(ICON_MARKER.length)
    let icon = icons.get(json)
    if (!icon) {
      icon = { id: icons.size, names: JSON.parse(json) as IconNames }
      icons.set(json, icon)
    }
    for (let j = i + 1; j < lines.length; j++) {
      const svg = (lines[j] as string).indexOf("<svg")
      if (svg === -1) continue
      lines[j] =
        `${(lines[j] as string).slice(0, svg + 4)} data-preview-icon="${icon.id}"${(lines[j] as string).slice(svg + 4)}`
      break
    }
  }
  return lines.join("\n")
}

function markDirectory(dir: string): void {
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".tsx"))) {
    const full = path.join(dir, file)
    writeFileSync(full, markIcons(readFileSync(full, "utf8")))
  }
}

async function render(file: string): Promise<string | null> {
  const mod = (await import(file)) as Record<string, unknown>
  const component = (mod.default ??
    Object.values(mod).find((value) => typeof value === "function")) as
    | FC
    | undefined
  if (!component) return null
  return String(await jsx(component, {}))
}

const items = readdirSync(CREATE)
  .filter((file) => file.endsWith(".tsx") && file !== "example.tsx")
  .map((file) => file.slice(0, -".tsx".length))
const { css, js } = assets()
const scripts = CLIENT_SCRIPTS.map(
  (name) => `<script type="module" src="/shadcn/${name}.js"></script>`
).join("")

rmSync(OUT, { recursive: true, force: true })
rmSync(CACHE, { recursive: true, force: true })
let pages = 0
for (const style of config.styles) {
  for (const menuColor of MENU_COLORS) {
    const combo = `${style.replace(/^base-/, "")}-${menuColor}`
    const dir = path.join(CACHE, combo)
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ private: true, dependencies: site.dependencies })
    )
    await devInstall({ cwd: dir, style, rtl: true, menuColor })
    markDirectory(path.join(dir, "components/ui"))
    cpSync(CREATE, path.join(dir, "create"), { recursive: true })
    for (const file of readdirSync(path.join(dir, "create"))) {
      const full = path.join(dir, "create", file)
      writeFileSync(
        full,
        readFileSync(full, "utf8").replaceAll(
          'from "@/components/ui/',
          'from "../components/ui/'
        )
      )
    }
    markDirectory(path.join(dir, "create"))
    // For the examples' toasts, as in the layout of upstream's website.
    const { Toaster } = (await import(
      path.join(dir, "components/ui/toast.tsx")
    )) as { Toaster: FC }
    const toaster = String(await jsx(Toaster, {}))
    mkdirSync(path.join(OUT, combo), { recursive: true })
    for (const item of items) {
      const body = await render(path.join(dir, "create", `${item}.tsx`))
      if (body === null) continue
      writeFileSync(
        path.join(OUT, combo, `${item}.html`),
        `<!DOCTYPE html><html lang="en" class="style-${style.replace(/^base-/, "")}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="robots" content="noindex"/><title>Preview</title><link rel="stylesheet" href="${css}"/><script type="module" src="${js}"></script>${scripts}</head><body>${body}${toaster}</body></html>`
      )
      pages++
    }
  }
}

// The icons of the other libraries, rendered as `finalize` inlines them.
const iconsDir = path.join(CACHE, "icons")
mkdirSync(iconsDir, { recursive: true })
for (const library of INLINED_LIBRARIES) {
  const components = [...icons.values()].map(({ id, names }) => {
    const icon = library.resolve(names[library.library])
    if (!icon) {
      throw new Error(`${library.library} has no ${names[library.library]}`)
    }
    return library.render(icon).replace(/__COMPONENT__/g, `Icon${id}`)
  })
  const module = path.join(iconsDir, `${library.library}.tsx`)
  writeFileSync(
    module,
    `import { cn } from "cn"
type ComponentProps<_T> = { class?: string; children?: unknown } & Record<string, unknown>
${components.join("\n\n")}
export const ICONS = { ${[...icons.values()].map(({ id }) => `${id}: Icon${id}`).join(", ")} }
`
  )
  const { ICONS } = (await import(module)) as { ICONS: Record<string, FC> }
  const rendered: Record<string, string> = {}
  for (const [id, component] of Object.entries(ICONS)) {
    rendered[id] = String(await jsx(component, {}))
  }
  mkdirSync(path.join(OUT, "icons"), { recursive: true })
  writeFileSync(
    path.join(OUT, "icons", `${library.library}.json`),
    JSON.stringify(rendered)
  )
}

if (!existsSync(OUT)) throw new Error("No previews were written")
console.log(
  `Rendered ${pages} previews (${config.styles.length} styles × ${MENU_COLORS.length} menu colors) and ${icons.size} icons into ${path.relative(SITE_DIR, OUT)}/.`
)
