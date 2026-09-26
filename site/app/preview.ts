/**
 * Runs in the create page's preview frames: applies the design system the
 * page posts (`{ type: "design-system", code, dark, rtl, pointer }`) with the
 * preset's theme from /api/preset.
 */
interface DesignSystemMessage {
  type: "design-system"
  code: string
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
