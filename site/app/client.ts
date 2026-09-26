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
