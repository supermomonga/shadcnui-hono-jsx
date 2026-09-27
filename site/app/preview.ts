/**
 * Runs in the create page's preview frames: applies the design system the
 * page posts (`{ type: "design-system", code, dark, rtl, pointer }`) with the
 * preset's theme from /api/preset.
 */
interface DesignSystemMessage {
  type: "design-system"
  code: string
  iconLibrary: string
  dark: boolean
  rtl: boolean
  pointer: boolean
}

interface PresetTheme {
  cssVars: {
    theme?: Record<string, string>
    light?: Record<string, string>
    dark?: Record<string, string>
  }
  fontPackages: string[]
}

const themes = new Map<string, Promise<PresetTheme>>()

function theme(code: string, pointer: boolean): Promise<PresetTheme> {
  const key = `${code}:${pointer}`
  let found = themes.get(key)
  if (!found) {
    found = fetch(`/api/preset?preset=${code}&pointer=${pointer}`).then(
      (response) => {
        if (!response.ok) throw new Error(`/api/preset ${response.status}`)
        return response.json() as Promise<PresetTheme>
      }
    )
    themes.set(key, found)
  }
  return found
}

function declarations(vars: Record<string, string> | undefined): string {
  return Object.entries(vars ?? {})
    .map(
      ([name, value]) =>
        `${name.startsWith("--") ? name : `--${name}`}: ${value};`
    )
    .join("")
}

/** The icons of a library by id (scripts/previews.ts renders them). */
const iconSets = new Map<string, Promise<Record<string, string>>>()

function iconSet(library: string): Promise<Record<string, string>> {
  let found = iconSets.get(library)
  if (!found) {
    found = fetch(`/previews/icons/${library}.json`).then((response) =>
      response.json()
    )
    iconSets.set(library, found)
  }
  return found
}

/** The rendered Lucide icons, to swap back to. */
const lucide = new WeakMap<
  Element,
  { attributes: [string, string][]; html: string }
>()

/** SVG attributes that come from the icon library, not from the component. */
const LIBRARY_ATTRIBUTES = new Set([
  "xmlns",
  "width",
  "height",
  "viewBox",
  "viewbox",
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "color",
  "class",
  "data-preview-icon",
])

async function swapIcons(library: string) {
  const svgs = [...document.querySelectorAll("svg[data-preview-icon]")]
  for (const svg of svgs) {
    if (!lucide.has(svg)) {
      lucide.set(svg, {
        attributes: [...svg.attributes].map((a) => [a.name, a.value]),
        html: svg.innerHTML,
      })
    }
  }
  const set = library === "lucide" ? null : await iconSet(library)
  const template = document.createElement("template")
  for (const svg of svgs) {
    const original = lucide.get(svg)
    if (!original) continue
    const id = (svg as SVGElement).dataset.previewIcon ?? ""
    const source = set?.[id]
    let attributes = original.attributes
    let html = original.html
    if (source) {
      template.innerHTML = source
      const replacement = template.content.firstElementChild
      if (!replacement) continue
      const own = original.attributes.filter(
        ([name]) => !LIBRARY_ATTRIBUTES.has(name)
      )
      const classes = (
        original.attributes.find(([name]) => name === "class")?.[1] ?? ""
      )
        .split(/\s+/)
        .filter((c) => c && c !== "lucide" && !c.startsWith("lucide-"))
      const ownClass = replacement.getAttribute("class") ?? ""
      attributes = [
        ...[...replacement.attributes]
          .filter((a) => a.name !== "class")
          .map((a) => [a.name, a.value] as [string, string]),
        ["class", [ownClass, ...classes].filter(Boolean).join(" ")],
        ["data-preview-icon", id],
        ...own,
      ]
      html = replacement.innerHTML
    }
    for (const name of svg.getAttributeNames()) svg.removeAttribute(name)
    for (const [name, value] of attributes) svg.setAttribute(name, value)
    svg.innerHTML = html
  }
}

const style = document.createElement("style")
document.head.append(style)
const fonts = new Set<string>()
let latest = 0

async function apply(message: DesignSystemMessage) {
  const root = document.documentElement
  root.classList.toggle("dark", message.dark)
  root.dir = message.rtl ? "rtl" : "ltr"
  root.toggleAttribute("data-pointer", message.pointer)
  const request = ++latest
  void swapIcons(message.iconLibrary)
  try {
    const { cssVars, fontPackages } = await theme(message.code, message.pointer)
    if (request !== latest) return
    for (const pkg of fontPackages) {
      if (fonts.has(pkg)) continue
      fonts.add(pkg)
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = `https://cdn.jsdelivr.net/npm/${pkg}/index.css`
      document.head.append(link)
    }
    style.textContent = `:root{${declarations(cssVars.theme)}${declarations(cssVars.light)}}.dark{${declarations(cssVars.dark)}}`
  } finally {
    root.setAttribute("data-ready", "")
  }
}

window.addEventListener("message", (event) => {
  if (event.origin !== location.origin) return
  const data = event.data as DesignSystemMessage | undefined
  if (data?.type === "design-system") void apply(data)
})

// Shown on its own (not in a frame), or when the page never posts.
setTimeout(() => document.documentElement.setAttribute("data-ready", ""), 3000)
window.parent.postMessage({ type: "preview-ready" }, location.origin)
