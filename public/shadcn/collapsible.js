// @ts-check
/**
 * Collapsibles whose trigger is not the first child: the trigger button
 * toggles the panel (hidden while closed), like Base UI. Collapsibles with the trigger first are native
 * `<details>` and need no script.
 */
import { delegate } from "./core.js"

const ROOT = "[data-collapsible]"

/** @param {HTMLElement} root */
const partsOf = (root) => {
  /** @param {string} selector */
  const own = (selector) =>
    /** @type {HTMLElement[]} */ ([...root.querySelectorAll(selector)]).filter(
      (element) => element.closest(ROOT) === root
    )
  return {
    triggers: own("[data-collapsible-trigger]"),
    panel: own("[data-collapsible-panel]")[0] ?? null,
  }
}

/**
 * @param {HTMLElement} root
 * @param {boolean} open
 */
function setOpen(root, open) {
  const { triggers, panel } = partsOf(root)
  if (panel) panel.hidden = !open
  for (const element of [root, panel]) {
    element?.toggleAttribute("data-open", open)
    element?.toggleAttribute("data-closed", !open)
  }
  for (const trigger of triggers) {
    trigger.setAttribute("aria-expanded", String(open))
    if (open && panel) trigger.setAttribute("aria-controls", panel.id)
    else trigger.removeAttribute("aria-controls")
    trigger.toggleAttribute("data-panel-open", open)
  }
}

delegate("click", "[data-collapsible-trigger]", (_event, trigger) => {
  const root = trigger.closest(ROOT)
  if (!(root instanceof HTMLElement) || trigger.hasAttribute("disabled")) return
  setOpen(root, !root.hasAttribute("data-open"))
})
