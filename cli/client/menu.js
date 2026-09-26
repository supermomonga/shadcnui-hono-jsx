// @ts-check
/**
 * Menus (dropdown menus, context menus, menubars): the native popover opens,
 * places and dismisses the menu; this script adds Base UI's menu behavior.
 * Opening moves focus into the menu, arrow keys, Home, End and typeahead move
 * between items, Enter and Space choose, choosing an item closes the menu,
 * checkbox and radio items toggle, submenus open from their trigger by pointer
 * or keyboard, and context menus open at the pointer on a right click.
 * Without it, dropdown menus still open and their items are reachable with
 * Tab (context menus need it).
 */
import { delegate } from "./core.js"

const MENU = '[role="menu"]'
const ITEM =
  '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'
const SUBMENU_TRIGGER = '[role="menuitem"][aria-haspopup="menu"][aria-controls]'
const TRIGGER = '[aria-haspopup="menu"][commandfor]'
const MENUBAR = '[role="menubar"]'
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

/** @type {WeakSet<HTMLElement>} Submenus opened from the keyboard. */
const keyboardOpened = new WeakSet()

const platformName = (navigator.platform || "").toLowerCase()
/**
 * Apple platforms, where VoiceOver may run, as Base UI's production build
 * detects them from `navigator.platform` (iPadOS included).
 */
const APPLE =
  /^i(os$|p)/.test(platformName) ||
  (platformName === "macintel" && navigator.maxTouchPoints > 1) ||
  platformName.startsWith("mac")

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
    // Like Base UI, a submenu opened from the keyboard on Apple platforms
    // drops its trigger's aria-expanded: VoiceOver would announce the state
    // change instead of the submenu item that takes focus.
    if (opened && keyboardOpened.has(menu) && APPLE) {
      trigger?.removeAttribute("aria-expanded")
    } else {
      trigger?.setAttribute("aria-expanded", String(opened))
    }
    if (!opened) keyboardOpened.delete(menu)
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

/**
 * The trigger of a menu, or of the menu next to it in a menubar.
 *
 * @param {Element} trigger
 * @param {1 | -1} step
 * @returns {HTMLElement | null}
 */
function menubarNeighbor(trigger, step) {
  const bar = trigger.closest(MENUBAR)
  if (!bar) return null
  const triggers = [...bar.querySelectorAll(TRIGGER)].filter(
    /** @returns {item is HTMLElement} */
    (item) => item instanceof HTMLElement && item.closest(MENUBAR) === bar
  )
  const index = triggers.indexOf(/** @type {HTMLElement} */ (trigger))
  const loop = bar.getAttribute("data-loop-focus") !== "false"
  const next = index + step
  if (next >= 0 && next < triggers.length) return triggers[next] ?? null
  return loop ? (triggers.at(step === 1 ? 0 : -1) ?? null) : null
}

/**
 * Moves the menubar's tab stop to `trigger`.
 *
 * @param {HTMLElement} trigger
 */
function rove(trigger) {
  const bar = trigger.closest(MENUBAR)
  for (const item of bar?.querySelectorAll(TRIGGER) ?? []) {
    if (item instanceof HTMLElement) item.tabIndex = item === trigger ? 0 : -1
  }
  trigger.focus()
}

/** @param {HTMLElement} trigger */
const menuOfTrigger = (trigger) =>
  document.getElementById(trigger.getAttribute("commandfor") ?? "")

/**
 * The inline arrow keys in reading order: [backward, forward].
 *
 * @param {Element} element
 */
const inlineKeys = (element) =>
  getComputedStyle(element).direction === "rtl"
    ? ["ArrowRight", "ArrowLeft"]
    : ["ArrowLeft", "ArrowRight"]

// Opening from the keyboard focuses the first item (the last for ArrowUp);
// in a menubar, the arrow keys move between the triggers (in reading order).
delegate("keydown", TRIGGER, (event, trigger) => {
  const menu = menuOfTrigger(trigger)
  if (!menu) return
  const horizontal =
    trigger.closest(MENUBAR)?.getAttribute("aria-orientation") !== "vertical"
  const [previousKey, nextKey] = horizontal
    ? inlineKeys(trigger)
    : ["ArrowUp", "ArrowDown"]
  if (
    trigger.closest(MENUBAR) &&
    (event.key === previousKey || event.key === nextKey)
  ) {
    const neighbor = menubarNeighbor(trigger, event.key === nextKey ? 1 : -1)
    if (neighbor) {
      event.preventDefault()
      rove(neighbor)
    }
    return
  }
  if (event.key === "Enter" || event.key === " ") {
    // The native command opens the menu on the click that follows.
    pendingFocus.set(menu, "first")
  } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault()
    open(menu, event.key === "ArrowDown" ? "first" : "last", trigger)
  }
})

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
  // Submenus open toward the end of the line and close toward its start.
  const [backward, forward] = inlineKeys(menu)
  const key =
    event.key === forward
      ? "Forward"
      : event.key === backward
        ? "Backward"
        : event.key
  switch (key) {
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
    case "Forward": {
      if (current?.matches(SUBMENU_TRIGGER) && !disabled(current)) {
        const submenu = submenuOf(current)
        if (submenu) {
          event.preventDefault()
          keyboardOpened.add(submenu)
          open(submenu, "first", current)
        }
        return
      }
      switchMenubarMenu(event, menu, 1)
      return
    }
    case "Backward": {
      const trigger = triggerOf(menu)
      if (trigger?.closest(MENU)) {
        event.preventDefault()
        menu.hidePopover()
        trigger.focus()
        return
      }
      switchMenubarMenu(event, menu, -1)
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
    if (!submenu) return
    // Enter and Space click without a pointer (detail 0).
    if (event.detail === 0) keyboardOpened.add(submenu)
    open(submenu, "first", item)
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
 * In a menubar, the left and right arrows move from a menu to the next one.
 *
 * @param {KeyboardEvent} event
 * @param {HTMLElement} menu
 * @param {1 | -1} step
 */
function switchMenubarMenu(event, menu, step) {
  const root = rootMenu(menu)
  const trigger = triggerOf(root)
  const neighbor = trigger ? menubarNeighbor(trigger, step) : null
  const next = neighbor ? menuOfTrigger(neighbor) : null
  if (!neighbor || !next) return
  event.preventDefault()
  rove(neighbor)
  // Like Base UI, the next menu itself takes focus.
  open(next, "menu", neighbor)
}

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

// Context menus open at the pointer: the invisible anchor inside the trigger
// area moves there, and CSS anchor positioning places the menu next to it.
delegate("contextmenu", "[data-context-menu]", (event, area) => {
  const menu = document.getElementById(area.dataset.contextMenu ?? "")
  const anchor = area.querySelector(":scope > [data-context-menu-anchor]")
  if (!menu || !(anchor instanceof HTMLElement)) return
  event.preventDefault()
  anchor.style.left = `${event.clientX}px`
  anchor.style.top = `${event.clientY}px`
  const show = () => {
    if (menu.matches(":popover-open")) menu.hidePopover()
    open(menu, "menu", null)
  }
  // Where the menu event fires on pointer down, the release that follows
  // would light-dismiss a popover opened now.
  if (event.buttons === 0) show()
  else {
    document.addEventListener("pointerup", () => setTimeout(show), {
      once: true,
    })
  }
})

// While a menubar menu is open, hovering another trigger opens its menu.
delegate("pointermove", `${MENUBAR} ${TRIGGER}`, (event, trigger) => {
  if (event.pointerType === "touch") return
  const bar = trigger.closest(MENUBAR)
  const menu = menuOfTrigger(trigger)
  if (!bar || !menu || menu.matches(":popover-open")) return
  const openMenu = [...bar.querySelectorAll(TRIGGER)]
    .map((item) => (item instanceof HTMLElement ? menuOfTrigger(item) : null))
    .find((other) => other?.matches(":popover-open"))
  if (!openMenu) return
  rove(trigger)
  open(menu, "menu", trigger)
})
