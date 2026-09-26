/**
 * The create page's controller: keeps the design system in the URL
 * (`?preset=<code>&item=<example>&rtl=true&pointer=true`, codes as on
 * ui.shadcn.com/create), shows it in the customizer, previews it in the
 * frame (hovering an option previews it before choosing), and writes the
 * commands of Get Code.
 */
import {
  decodePreset,
  encodePreset,
  generateRandomConfig,
  isPresetCode,
  type PresetConfig,
} from "../../cli/generated/shadcn-preset.js"
import { commandVariants, PACKAGE_MANAGERS } from "./lib/commands"
import {
  DEFAULT_CONFIG,
  NAMED_PRESETS,
  OPTIONS,
  type Param,
} from "./lib/create-options"
import { CLI } from "./lib/site"

interface State {
  config: PresetConfig
  item: string
  rtl: boolean
  pointer: boolean
}

const data = JSON.parse(
  document.getElementById("create-data")?.textContent ?? "{}"
) as { items: string[] }

const frame = document.querySelector<HTMLIFrameElement>("[data-preview-frame]")
const defaultItem = (frame?.dataset.item ?? data.items[0]) as string

/** The prerendered preview of a style and menu color (scripts/previews.ts). */
function previewUrl(): string {
  return `/previews/${state.config.style}-${state.config.menuColor}/${state.item}`
}

function presetFrom(value: string | null): PresetConfig | null {
  if (!value) return null
  const named = NAMED_PRESETS[value]
  if (named) return named
  return isPresetCode(value) ? decodePreset(value) : null
}

function read(): State {
  const params = new URLSearchParams(location.search)
  const item = params.get("item")
  return {
    config: { ...(presetFrom(params.get("preset")) ?? DEFAULT_CONFIG) },
    item: item && data.items.includes(item) ? item : defaultItem,
    rtl: params.get("rtl") === "true",
    pointer: params.get("pointer") === "true",
  }
}

let state = read()
/** A value previewed while its option is hovered. */
let preview: Partial<PresetConfig> | null = null

const code = (config: PresetConfig) => encodePreset(config)

function flags(options: { only?: string } = {}): string {
  return [
    options.only ? ` --only ${options.only}` : "",
    // `apply` keeps the project's direction unless asked; `--only` leaves components alone.
    !options.only && state.rtl ? " --rtl" : "",
    !options.only && state.pointer ? " --pointer" : "",
  ].join("")
}

function writeCommands() {
  const preset = code(state.config)
  const mode =
    document.querySelector<HTMLInputElement>("[data-apply-mode]:checked")
      ?.value ?? "full"
  const commands: Record<string, string> = {
    init: `npx ${CLI} init --preset ${preset}${flags()}`,
    apply: `npx ${CLI} apply --preset ${preset}${flags(mode === "full" ? {} : { only: mode })}`,
  }
  for (const [name, npm] of Object.entries(commands)) {
    const variants = commandVariants(npm)
    for (const pm of PACKAGE_MANAGERS) {
      const element = document.querySelector(
        `[data-command="${name}"][data-command-pm="${pm}"]`
      )
      if (element) element.textContent = variants?.[pm] ?? npm
    }
  }
}

let themeRequest = 0
async function writeTheme() {
  const element = document.querySelector("[data-theme-css]")
  if (!element) return
  const request = ++themeRequest
  element.textContent = "Loading…"
  try {
    const response = await fetch(
      `/api/preset?preset=${code(state.config)}&pointer=${state.pointer}`
    )
    const body = (await response.json()) as { css?: string; error?: string }
    if (request === themeRequest) {
      element.textContent = body.css ?? body.error ?? ""
    }
  } catch (error) {
    if (request === themeRequest) element.textContent = String(error)
  }
}

function post() {
  const config = { ...state.config, ...preview }
  frame?.contentWindow?.postMessage(
    {
      type: "design-system",
      code: code(config),
      iconLibrary: config.iconLibrary,
      dark: document.documentElement.classList.contains("dark"),
      rtl: state.rtl,
      pointer: state.pointer,
    },
    location.origin
  )
}

function render() {
  const values: Record<string, string> = {
    ...(state.config as unknown as Record<string, string>),
    item: state.item,
  }
  for (const picker of document.querySelectorAll<HTMLElement>(
    "[data-picker]"
  )) {
    const param = picker.dataset.picker as string
    const value = values[param] ?? ""
    for (const option of picker.querySelectorAll<HTMLElement>(
      "[data-picker-option]"
    )) {
      option.setAttribute(
        "aria-selected",
        String(option.dataset.value === value)
      )
    }
    const selected = picker.querySelector<HTMLElement>(
      `[data-picker-option][data-value="${CSS.escape(value)}"]`
    )
    const label = picker.querySelector("[data-picker-label]")
    if (label && selected) {
      label.textContent =
        selected.querySelector("span.flex-1")?.textContent ?? value
    }
    const swatch = picker.querySelector<HTMLElement>("[data-picker-swatch]")
    const option = OPTIONS[param as Param]?.find((o) => o.value === value)
    if (swatch) swatch.style.setProperty("--color", option?.swatch ?? "")
  }
  for (const element of document.querySelectorAll("[data-preset-code]")) {
    element.textContent = code(state.config)
  }
  for (const input of document.querySelectorAll<HTMLInputElement>(
    "[data-flag]"
  )) {
    input.checked = state[input.dataset.flag as "rtl" | "pointer"]
  }
  const url = new URL(location.href)
  url.searchParams.set("preset", code(state.config))
  url.searchParams.set("item", state.item)
  for (const flag of ["rtl", "pointer"] as const) {
    if (state[flag]) url.searchParams.set(flag, "true")
    else url.searchParams.delete(flag)
  }
  history.replaceState(null, "", url)
  writeCommands()
  if (frame && new URL(frame.src, location.href).pathname !== previewUrl()) {
    frame.src = previewUrl()
  } else {
    post()
  }
}

function set(next: Partial<State>) {
  state = { ...state, ...next }
  render()
}

function choose(param: string, value: string) {
  if (param === "item") {
    set({ item: value })
    return
  }
  const config = { ...state.config, [param]: value } as PresetConfig
  // A base color's own theme follows the base color, as upstream's picker does.
  if (param === "baseColor" && state.config.theme === state.config.baseColor) {
    config.theme = value as PresetConfig["theme"]
  }
  set({ config })
}

document.addEventListener("click", (event) => {
  const target = event.target as Element
  const option = target.closest<HTMLElement>("[data-picker-option]")
  if (option?.dataset.param && option.dataset.value) {
    preview = null
    choose(option.dataset.param, option.dataset.value)
    option.closest<HTMLElement>("[popover]")?.hidePopover()
    return
  }
  if (target.closest("[data-random]")) {
    set({ config: generateRandomConfig() })
  } else if (target.closest("[data-reset]")) {
    set({ config: { ...DEFAULT_CONFIG }, rtl: false, pointer: false })
  } else if (target.closest("[data-copy-preset]")) {
    void navigator.clipboard.writeText(code(state.config))
  } else if (target.closest("[data-mode-toggle]")) {
    // The site's toggle switched the page; the frame follows.
    queueMicrotask(post)
  }
})

// Hovering an option previews it; leaving the list restores the choice.
document.addEventListener("pointerover", (event) => {
  const option = (event.target as Element).closest<HTMLElement>(
    "[data-picker-option]"
  )
  const param = option?.dataset.param
  // The style and the menu color are other pages; they preview when chosen.
  if (
    !option ||
    !param ||
    ["item", "style", "menuColor"].includes(param) ||
    !option.dataset.value
  ) {
    return
  }
  preview = { [param]: option.dataset.value } as Partial<PresetConfig>
  post()
})
document.addEventListener(
  "toggle",
  (event) => {
    const target = event.target as HTMLElement
    if (target.matches("[data-picker-content]") && preview) {
      preview = null
      post()
    }
  },
  true
)

document.addEventListener("change", (event) => {
  const target = event.target as HTMLInputElement
  if (target.matches("[data-flag]")) {
    set({ [target.dataset.flag as "rtl" | "pointer"]: target.checked })
    void writeTheme()
  } else if (target.matches("[data-apply-mode]")) {
    writeCommands()
  }
})

// Get Code: the theme tab shows theme.css as `init` writes it.
document.addEventListener("click", (event) => {
  if ((event.target as Element).closest('[commandfor="get-code"]')) {
    void writeTheme()
  }
})
document.addEventListener("click", (event) => {
  if ((event.target as Element).closest("[data-copy-theme]")) {
    const css = document.querySelector("[data-theme-css]")?.textContent ?? ""
    void navigator.clipboard.writeText(css)
  }
})

// Open Preset: a code, a named preset, or a URL with `?preset=`.
document
  .querySelector<HTMLFormElement>("[data-open-preset]")
  ?.addEventListener("submit", (event) => {
    const form = event.currentTarget as HTMLFormElement
    const value = String(new FormData(form).get("preset") ?? "").trim()
    let candidate = value
    try {
      candidate = new URL(value).searchParams.get("preset") ?? value
    } catch {}
    const config = presetFrom(candidate)
    const error = form.querySelector<HTMLElement>("[data-open-preset-error]")
    if (!config) {
      event.preventDefault()
      if (error) error.hidden = false
      return
    }
    if (error) error.hidden = true
    form.reset()
    set({ config: { ...config } })
  })

window.addEventListener("message", (event) => {
  if (event.origin !== location.origin) return
  if ((event.data as { type?: string })?.type === "preview-ready") post()
})

// Keep the page's dark mode and the frame's in step.
new MutationObserver(post).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["class"],
})

render()
