// @ts-check
/**
 * Menus (dropdown menus, context menus, menubars): the native popover opens,
 * places and dismisses the menu; this script adds Base UI's menu behavior.
 * Opening moves focus into the menu, arrow keys, Home, End and typeahead move
 * between items, Enter and Space choose, choosing an item closes the menu,
 * checkbox and radio items toggle, and submenus open from their trigger by
 * pointer or keyboard. Without it, the menu still opens and its items are
 * reachable with Tab.
 */
import { delegate } from "./core.js"

const MENU = '[role="menu"]'
const ITEM =
  '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'
const SUBMENU_TRIGGER = '[role="menuitem"][aria-haspopup="menu"]'
/** Base UI's delay before a hovered submenu trigger opens its submenu. */
const SUBMENU_DELAY = 100

/** @param {Element} element */
const disabled = (element) => element.getAttribute("aria-disabled") === "true"

/**
 * Items of a menu, without those of its submenus.
 *
 * @param {HTMLElement} menu
 * @returns {HTMLElement[]}
 */
function itemsOf(menu) {
  return [...menu.querySelectorAll(ITEM)].filter(
    /** @returns {item is HTMLElement} */
    (item) => item instanceof HTMLElement && item.closest(MENU) === menu
  )
}

/**
 * The trigger that opens a menu (its popup is labelled by the trigger).
 *
 * @param {HTMLElement} menu
 */
function triggerOf(menu) {
  return document.getElementById(menu.getAttribute("aria-labelledby") ?? "")
}

/**
 * The submenu a submenu trigger opens.
 *
 * @param {Element} trigger
 */
function submenuOf(trigger) {
  const menu = document.getElementById(
    trigger.getAttribute("aria-controls") ?? ""
  )
  return menu?.getAttribute("role") === "menu" ? menu : null
}

/**
 * The outermost menu, whose trigger is not an item of another menu.
 *
 * @param {HTMLElement} menu
 * @returns {HTMLElement}
 */
function rootMenu(menu) {
  const parent = triggerOf(menu)?.closest(MENU)
  return parent instanceof HTMLElement ? rootMenu(parent) : menu
}

/** @typedef {"menu" | "first" | "last" | "none"} OpenFocus Where focus goes when a menu opens. */

/** @type {WeakMap<HTMLElement, OpenFocus>} */
const pendingFocus = new WeakMap()

/**
 * @param {HTMLElement} menu
 * @param {OpenFocus} focus
 * @param {HTMLElement | null} source
 */
function open(menu, focus, source) {
  pendingFocus.set(menu, focus)
  if (menu.matches(":popover-open")) focusIn(menu)
  else menu.showPopover(source ? { source } : undefined)
}

/** @param {HTMLElement} menu */
function focusIn(menu) {
  const focus = pendingFocus.get(menu) ?? "menu"
  pendingFocus.delete(menu)
  const items = itemsOf(menu)
  if (focus === "none") return
  const target =
    focus === "first" ? items[0] : focus === "last" ? items.at(-1) : menu
  target?.focus()
}

/**
 * Closes a whole menu (with its submenus) and returns focus to its trigger.
 *
 * @param {HTMLElement} menu
 */
function closeAll(menu) {
  const root = rootMenu(menu)
  if (root.matches(":popover-open")) root.hidePopover()
  triggerOf(root)?.focus()
}

// Keep the trigger's state attributes in sync, and move focus into an opened menu.
document.addEventListener(
  "toggle",
  (event) => {
    const menu = event.target
    if (
      !(menu instanceof HTMLElement) ||
      menu.getAttribute("role") !== "menu"
    ) {
      return
    }
    const opened = /** @type {ToggleEvent} */ (event).newState === "open"
    const trigger = triggerOf(menu)
    trigger?.setAttribute("aria-expanded", String(opened))
    trigger?.toggleAttribute("data-popup-open", opened)
    menu.toggleAttribute("data-open", opened)
    if (opened) {
      focusIn(menu)
      return
    }
    pendingFocus.delete(menu)
    // Like Base UI, focus returns to the trigger unless it moved elsewhere
    // (an outside click on the page leaves it on the body).
    const active = document.activeElement
    if (!active || active === document.body || menu.contains(active)) {
      trigger?.focus()
    }
  },
  true
)

// Opening from the keyboard focuses the first item (the last for ArrowUp).
delegate(
  "keydown",
  '[aria-haspopup="menu"]:not([role="menuitem"])',
  (event, trigger) => {
    const menu = document.getElementById(
      trigger.getAttribute("commandfor") ?? ""
    )
    if (!menu) return
    if (event.key === "Enter" || event.key === " ") {
      // The native command opens the menu on the click that follows.
      pendingFocus.set(menu, "first")
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      open(menu, event.key === "ArrowDown" ? "first" : "last", trigger)
    }
  }
)

/** @type {{ text: string, time: number }} Typed characters for typeahead. */
const typed = { text: "", time: 0 }

delegate("keydown", MENU, (event, menu) => {
  const items = itemsOf(menu)
  const current =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  const index = current ? items.indexOf(current) : -1
  const loop = menu.dataset.loopFocus !== "false"
  const last = items.length - 1
  /** @param {HTMLElement | undefined} item */
  const move = (item) => {
    event.preventDefault()
    item?.focus()
  }
  switch (event.key) {
    case "ArrowDown":
      return move(
        items[index < 0 ? 0 : index < last ? index + 1 : loop ? 0 : last]
      )
    case "ArrowUp":
      return move(
        items[index < 0 ? last : index > 0 ? index - 1 : loop ? last : 0]
      )
    case "Home":
      return move(items[0])
    case "End":
      return move(items[last])
    case "ArrowRight": {
      if (current?.matches(SUBMENU_TRIGGER) && !disabled(current)) {
        const submenu = submenuOf(current)
        if (submenu) {
          event.preventDefault()
          open(submenu, "first", current)
        }
      }
      return
    }
    case "ArrowLeft": {
      const trigger = triggerOf(menu)
      if (trigger?.closest(MENU)) {
        event.preventDefault()
        menu.hidePopover()
        trigger.focus()
      }
      return
    }
    case "Enter":
    case " ": {
      if (current && index >= 0) {
        event.preventDefault()
        current.click()
      }
      return
    }
    case "Tab": {
      // Close, and let Tab continue from the trigger.
      const root = rootMenu(menu)
      triggerOf(root)?.focus()
      root.hidePopover()
      return
    }
  }
  if (
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    const now = Date.now()
    typed.text =
      now - typed.time < 500
        ? typed.text + event.key.toLowerCase()
        : event.key.toLowerCase()
    typed.time = now
    const start = typed.text.length === 1 ? index + 1 : Math.max(index, 0)
    const ordered = [...items.slice(start), ...items.slice(0, start)]
    const match = ordered.find((item) =>
      (item.textContent ?? "").trim().toLowerCase().startsWith(typed.text)
    )
    if (match) move(match)
  }
})

delegate("click", ITEM, (event, item) => {
  const menu = item.closest(MENU)
  if (!(menu instanceof HTMLElement)) return
  if (disabled(item)) {
    event.preventDefault()
    return
  }
  if (item.matches(SUBMENU_TRIGGER)) {
    const submenu = submenuOf(item)
    if (submenu) open(submenu, "first", item)
    return
  }
  const role = item.getAttribute("role")
  if (role === "menuitemcheckbox") {
    setChecked(item, item.getAttribute("aria-checked") !== "true")
  } else if (role === "menuitemradio") {
    const group = item.closest('[role="group"]') ?? menu
    for (const radio of group.querySelectorAll('[role="menuitemradio"]')) {
      if (radio.closest(MENU) === menu) setChecked(radio, radio === item)
    }
  }
  const close = item.dataset.closeOnClick
  if (close === "true" || (close === undefined && role === "menuitem")) {
    closeAll(menu)
  }
})

/**
 * @param {Element} item
 * @param {boolean} checked
 */
function setChecked(item, checked) {
  item.setAttribute("aria-checked", String(checked))
  item.toggleAttribute("data-checked", checked)
  item.toggleAttribute("data-unchecked", !checked)
}

/** @type {ReturnType<typeof setTimeout> | undefined} */
let submenuTimer

// Pointer movement highlights (focuses) items and opens submenus after a delay.
delegate("pointermove", ITEM, (event, item) => {
  if (event.pointerType === "touch" || document.activeElement === item) return
  const menu = item.closest(MENU)
  if (!(menu instanceof HTMLElement)) return
  item.focus({ preventScroll: true })
  clearTimeout(submenuTimer)
  submenuTimer = setTimeout(() => {
    // Close sibling submenus, then open this item's.
    for (const other of itemsOf(menu)) {
      const submenu = other.matches(SUBMENU_TRIGGER) ? submenuOf(other) : null
      if (submenu && other !== item && submenu.matches(":popover-open")) {
        submenu.hidePopover()
      }
    }
    if (item.matches(SUBMENU_TRIGGER) && !disabled(item)) {
      const submenu = submenuOf(item)
      // Hovering keeps focus on the trigger, like Base UI.
      if (submenu && !submenu.matches(":popover-open")) {
        open(submenu, "none", item)
      }
    }
  }, SUBMENU_DELAY)
})
