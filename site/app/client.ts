import { createClient } from "honox/client"

createClient()

// Theme toggle (components/mode-switcher.tsx).
document.addEventListener("click", (event) => {
  const toggle = (event.target as Element).closest("[data-mode-toggle]")
  if (!toggle) return
  const dark = document.documentElement.classList.toggle("dark")
  try {
    localStorage.theme = dark ? "dark" : "light"
  } catch {}
})

// Copy buttons (components/code-block.tsx): `data-copy`, or the active tab's code.
document.addEventListener("click", async (event) => {
  const button = (event.target as Element).closest<HTMLElement>("[data-copy]")
  if (!button) return
  let value = button.dataset.copy ?? ""
  if (!value) {
    const figure = button.closest("figure")
    const panel = figure?.querySelector<HTMLElement>(
      '[role="tabpanel"]:not([hidden]) code'
    )
    value = panel?.textContent ?? ""
  }
  await navigator.clipboard.writeText(value)
  button.dataset.copied = ""
  setTimeout(() => delete button.dataset.copied, 2000)
})

// Component previews: expand the code, and switch the language of RTL examples.
document.addEventListener("click", (event) => {
  const button = (event.target as Element).closest("[data-view-code]")
  button
    ?.closest<HTMLElement>('[data-slot="code"]')
    ?.setAttribute("data-open", "")
})

document.addEventListener("change", (event) => {
  const select = event.target as HTMLSelectElement
  if (!select.matches("[data-rtl-language]")) return
  const preview = select.closest('[data-slot="component-preview"]')
  for (const variant of preview?.querySelectorAll<HTMLElement>(
    '[data-slot="preview"][data-lang]'
  ) ?? []) {
    variant.hidden = variant.dataset.lang !== select.value
  }
})

// Package manager tabs: remember the choice and show it in every command.
const PM_KEY = "packageManager"

function selectPackageManager(pm: string) {
  for (const trigger of document.querySelectorAll<HTMLElement>(
    `[data-pm-tabs] [data-pm="${pm}"]`
  )) {
    if (trigger.getAttribute("aria-selected") !== "true") trigger.click()
  }
}

document.addEventListener("click", (event) => {
  const trigger = (event.target as Element).closest<HTMLElement>(
    "[data-pm-tabs] [data-pm]"
  )
  if (!trigger?.dataset.pm || !event.isTrusted) return
  try {
    localStorage.setItem(PM_KEY, trigger.dataset.pm)
  } catch {}
  queueMicrotask(() => selectPackageManager(trigger.dataset.pm as string))
})

function restorePackageManager() {
  try {
    const pm = localStorage.getItem(PM_KEY)
    if (pm) selectPackageManager(pm)
  } catch {}
}

// Table of contents: highlight the section in view.
function watchTableOfContents() {
  const links = [
    ...document.querySelectorAll<HTMLAnchorElement>("[data-toc] a[href^='#']"),
  ]
  if (links.length === 0) return
  const byId = new Map(links.map((link) => [link.hash.slice(1), link]))
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        for (const link of links) link.dataset.active = "false"
        const link = byId.get(entry.target.id)
        if (link) link.dataset.active = "true"
      }
    },
    { rootMargin: "0% 0% -80% 0%" }
  )
  for (const id of byId.keys()) {
    const heading = document.getElementById(id)
    if (heading) observer.observe(heading)
  }
}

// Keep the active sidebar item in view.
function revealActiveSidebarItem() {
  const sidebar = document.querySelector<HTMLElement>("[data-docs-sidebar]")
  const active = sidebar?.querySelectorAll<HTMLElement>("[data-active]")
  const item = active?.[active.length - 1]
  if (!sidebar || !item) return
  const top = item.offsetTop - sidebar.clientHeight / 2
  if (item.offsetTop > sidebar.clientHeight - 80) sidebar.scrollTop = top
}

// Search (components/search.tsx): ⌘K opens it; it filters /search.json.
interface SearchEntry {
  title: string
  href: string
  description?: string
}
let searchIndex:
  | Promise<{ pages: SearchEntry[]; components: SearchEntry[] }>
  | undefined

function searchDialog() {
  return document.getElementById("search") as HTMLDialogElement | null
}

async function renderSearch(query: string) {
  const results = document.querySelector<HTMLElement>("[data-search-results]")
  if (!results) return
  searchIndex ??= fetch("/search.json").then((response) => response.json())
  const index = await searchIndex
  const q = query.trim().toLowerCase()
  const match = (entry: SearchEntry) =>
    !q ||
    entry.title.toLowerCase().includes(q) ||
    (entry.description ?? "").toLowerCase().includes(q)
  const groups = [
    { heading: "Pages", entries: index.pages.filter(match) },
    { heading: "Components", entries: index.components.filter(match) },
  ].filter((group) => group.entries.length > 0)
  results.replaceChildren()
  if (groups.length === 0) {
    const empty = document.createElement("p")
    empty.className = "py-6 text-center text-sm text-muted-foreground"
    empty.textContent = "No results found."
    results.append(empty)
    return
  }
  for (const group of groups) {
    const heading = document.createElement("div")
    heading.className =
      "px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground"
    heading.textContent = group.heading
    results.append(heading)
    for (const entry of group.entries) {
      const link = document.createElement("a")
      link.href = entry.href
      link.role = "option"
      link.dataset.searchResult = ""
      link.className =
        "flex h-9 items-center rounded-md border border-transparent px-3 text-sm font-medium outline-none data-[selected]:border-input data-[selected]:bg-input/50"
      link.textContent = entry.title
      results.append(link)
    }
  }
  selectResult(0)
}

function selectResult(index: number) {
  const links = [
    ...document.querySelectorAll<HTMLElement>("[data-search-result]"),
  ]
  for (const [i, link] of links.entries()) {
    link.toggleAttribute("data-selected", i === index)
  }
  links[index]?.scrollIntoView({ block: "nearest" })
}

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    const dialog = searchDialog()
    if (!dialog) return
    event.preventDefault()
    if (!dialog.open) dialog.showModal()
    return
  }
  const dialog = searchDialog()
  if (!dialog?.open) return
  const links = [
    ...document.querySelectorAll<HTMLElement>("[data-search-result]"),
  ]
  const current = links.findIndex((link) => link.hasAttribute("data-selected"))
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault()
    const step = event.key === "ArrowDown" ? 1 : -1
    selectResult((current + step + links.length) % Math.max(links.length, 1))
  } else if (event.key === "Enter" && links[current]) {
    event.preventDefault()
    links[current].click()
  }
})

document.addEventListener("input", (event) => {
  const input = event.target as HTMLInputElement
  if (input.matches("[data-search-input]")) void renderSearch(input.value)
})

document.addEventListener(
  "toggle",
  (event) => {
    const dialog = event.target as HTMLElement
    if (dialog.id !== "search" || !(dialog as HTMLDialogElement).open) return
    const input = dialog.querySelector<HTMLInputElement>("[data-search-input]")
    if (input) input.value = ""
    void renderSearch("")
  },
  true
)
document.addEventListener("click", (event) => {
  if ((event.target as Element).closest('[commandfor="search"]')) {
    void renderSearch("")
  }
})

function init() {
  restorePackageManager()
  watchTableOfContents()
  revealActiveSidebarItem()
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
