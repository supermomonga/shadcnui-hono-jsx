// @ts-check
/**
 * Navigation menus: hovering a trigger (after a short rest), clicking it or
 * pressing ArrowDown opens its item. The item's content moves into the shared
 * viewport of a manual native popover anchored under the trigger with CSS
 * anchor positioning, and Base UI's state attributes (`data-open`,
 * `data-starting-style`, `data-ending-style`, ...) drive the upstream
 * transitions. Arrow keys move between the list's triggers and links and
 * inside the content; Tab enters the open content from its trigger, and
 * Escape or a click outside closes it, like Base UI.
 */

/** @typedef {"hover" | "click" | "keyboard"} OpenReason */

/**
 * @typedef {object} MenuState
 * @property {HTMLElement | null} item the open item
 * @property {OpenReason | null} reason
 * @property {number} openedAt
 * @property {ReturnType<typeof setTimeout> | undefined} timer
 * @property {number} generation increases on every open and close
 */

/** @type {WeakMap<HTMLElement, MenuState>} */
const states = new WeakMap()

/** @param {HTMLElement} root */
function stateOf(root) {
  let state = states.get(root)
  if (!state) {
    state = {
      item: null,
      reason: null,
      openedAt: 0,
      timer: undefined,
      generation: 0,
    }
    states.set(root, state)
  }
  return state
}

/** @param {Element | null} element */
const rootOf = (element) =>
  /** @type {HTMLElement | null} */ (
    element?.closest("[data-navigation-menu]") ?? null
  )

/**
 * Elements of `root` matching `selector`, not those of nested menus.
 *
 * @param {HTMLElement} root
 * @param {string} selector
 */
const own = (root, selector) =>
  /** @type {HTMLElement[]} */ ([...root.querySelectorAll(selector)]).filter(
    (element) => rootOf(element) === root
  )

/** @param {HTMLElement} root */
function partsOf(root) {
  const [positioner] = own(root, "[data-navigation-menu-positioner]")
  const popup = positioner?.firstElementChild
  return {
    positioner: positioner ?? null,
    popup: popup instanceof HTMLElement ? popup : null,
    viewport: /** @type {HTMLElement | null} */ (
      positioner?.querySelector("[data-navigation-menu-viewport]") ?? null
    ),
  }
}

/** @param {HTMLElement} item */
const triggerOf = (item) =>
  /** @type {HTMLElement | null} */ (
    item.querySelector("[data-navigation-menu-trigger]")
  )

/**
 * The content of an item: in the item while closed, in the viewport while
 * open (remembered by the item's key).
 *
 * @param {HTMLElement} root
 * @param {HTMLElement} item
 */
function contentOf(root, item) {
  const key = item.dataset.navigationMenuItem ?? ""
  return (
    own(root, "[data-navigation-menu-content]").find(
      (content) =>
        content.dataset.item === key ||
        content.closest("[data-navigation-menu-item]") === item
    ) ?? null
  )
}

/** Waits for the transitions and animations running inside `element`. */
function settled(/** @type {HTMLElement} */ element) {
  return Promise.all(
    element
      .getAnimations({ subtree: true })
      .map((animation) => animation.finished.catch(() => undefined))
  )
}

/** @param {HTMLElement} element */
const size = (element) => ({
  width: element.offsetWidth,
  height: element.offsetHeight,
})

/**
 * Opens `item` (or switches to it) like Base UI.
 *
 * @param {HTMLElement} root
 * @param {HTMLElement} item
 * @param {OpenReason} reason
 */
function open(root, item, reason) {
  const state = stateOf(root)
  const { positioner, popup, viewport } = partsOf(root)
  const trigger = triggerOf(item)
  const content = contentOf(root, item)
  if (!positioner || !popup || !viewport || !trigger || !content) return
  clearTimeout(state.timer)
  const previous = state.item
  state.reason = reason
  state.openedAt = performance.now()
  if (previous === item && positioner.hasAttribute("data-open")) return
  const generation = ++state.generation
  const mounted = positioner.matches(":popover-open")
  const before = mounted ? size(popup) : null

  // The previous content leaves; both get the direction of the switch.
  let direction = null
  if (previous && previous !== item && mounted) {
    const from = triggerOf(previous)?.getBoundingClientRect()
    const to = trigger.getBoundingClientRect()
    direction = from && to.left < from.left ? "left" : "right"
    const leaving = contentOf(root, previous)
    const previousTrigger = triggerOf(previous)
    if (previousTrigger) setTriggerOpen(previousTrigger, null)
    if (leaving) leave(root, previous, leaving, direction)
  }
  for (const other of own(root, "[data-navigation-menu-content]")) {
    if (other !== content && !other.hidden && other.parentElement !== viewport)
      other.hidden = true
  }

  state.item = item
  setTriggerOpen(trigger, popup.id)
  root.toggleAttribute("data-open", true)
  item.closest("ul")?.toggleAttribute("data-open", true)

  content.dataset.item = item.dataset.navigationMenuItem ?? ""
  content.style.removeProperty("position")
  content.removeAttribute("inert")
  viewport.append(content)
  content.hidden = false
  setOpenState(content, true)
  if (direction) content.dataset.activationDirection = direction
  else content.removeAttribute("data-activation-direction")
  content.toggleAttribute("data-starting-style", true)

  positioner.style.setProperty(
    "position-anchor",
    trigger.style.getPropertyValue("anchor-name")
  )
  positioner.style.removeProperty("pointer-events")
  for (const element of [positioner, popup]) {
    setOpenState(element, true)
    element.removeAttribute("data-ending-style")
  }
  if (!mounted) {
    for (const element of [positioner, popup]) {
      element.toggleAttribute("data-starting-style", true)
      element.style.transition = "none"
    }
    positioner.showPopover()
  }

  // Measure the new content, then animate the popup from the old size.
  positioner.style.removeProperty("--positioner-width")
  positioner.style.removeProperty("--positioner-height")
  popup.style.setProperty("--popup-width", "auto")
  popup.style.setProperty("--popup-height", "auto")
  const after = size(popup)
  positioner.style.setProperty("--positioner-width", `${after.width}px`)
  positioner.style.setProperty("--positioner-height", `${after.height}px`)
  if (before) {
    popup.style.setProperty("--popup-width", `${before.width}px`)
    popup.style.setProperty("--popup-height", `${before.height}px`)
  }
  requestAnimationFrame(() => {
    if (state.generation !== generation) return
    for (const element of [positioner, popup, content]) {
      element.removeAttribute("data-starting-style")
    }
    positioner.style.removeProperty("transition")
    popup.style.removeProperty("transition")
    if (before) {
      popup.style.setProperty("--popup-width", `${after.width}px`)
      popup.style.setProperty("--popup-height", `${after.height}px`)
      settled(popup).then(() => {
        if (state.generation !== generation) return
        popup.style.setProperty("--popup-width", "auto")
        popup.style.setProperty("--popup-height", "auto")
      })
    }
  })
}

/**
 * Animates a content out of the viewport, then returns it to its item.
 *
 * @param {HTMLElement} root
 * @param {HTMLElement} item
 * @param {HTMLElement} content
 * @param {string | null} direction
 */
function leave(root, item, content, direction) {
  setOpenState(content, false)
  content.toggleAttribute("data-ending-style", true)
  content.setAttribute("inert", "")
  content.style.position = "absolute"
  content.style.top = "0"
  content.style.left = "0"
  if (direction) content.dataset.activationDirection = direction
  settled(content).then(() => {
    if (stateOf(root).item === item) return
    content.removeAttribute("data-ending-style")
    content.removeAttribute("inert")
    content.style.removeProperty("position")
    content.style.removeProperty("top")
    content.style.removeProperty("left")
    content.hidden = true
    item.append(content)
  })
}

/**
 * Closes the open item; focus returns to its trigger when it was in the
 * popup or lost.
 *
 * @param {HTMLElement} root
 * @param {boolean} [restoreFocus]
 */
function close(root, restoreFocus = false) {
  const state = stateOf(root)
  const item = state.item
  const { positioner, popup } = partsOf(root)
  clearTimeout(state.timer)
  if (!item || !positioner || !popup) return
  const generation = ++state.generation
  const trigger = triggerOf(item)
  const content = contentOf(root, item)
  state.item = null
  state.reason = null
  if (trigger) setTriggerOpen(trigger, null)
  root.removeAttribute("data-open")
  item.closest("ul")?.removeAttribute("data-open")
  const current = size(popup)
  popup.style.setProperty("--popup-width", `${current.width}px`)
  popup.style.setProperty("--popup-height", `${current.height}px`)
  positioner.style.pointerEvents = "none"
  for (const element of [positioner, popup, content]) {
    if (!element) continue
    setOpenState(element, false)
    element.toggleAttribute("data-ending-style", true)
  }
  const focusInside =
    document.activeElement === document.body ||
    positioner.contains(document.activeElement)
  settled(positioner).then(() => {
    if (state.generation !== generation) return
    positioner.hidePopover()
    positioner.style.removeProperty("pointer-events")
    for (const element of [positioner, popup, content]) {
      element?.removeAttribute("data-ending-style")
    }
    if (content) {
      content.hidden = true
      item.append(content)
    }
    if (restoreFocus && focusInside) trigger?.focus()
  })
}

/**
 * @param {HTMLElement} element
 * @param {boolean} open
 */
function setOpenState(element, open) {
  element.toggleAttribute("data-open", open)
  element.toggleAttribute("data-closed", !open)
}

/**
 * @param {HTMLElement} trigger
 * @param {string | null} controls the popup id while open
 */
function setTriggerOpen(trigger, controls) {
  trigger.setAttribute("aria-expanded", String(controls !== null))
  if (controls) trigger.setAttribute("aria-controls", controls)
  else trigger.removeAttribute("aria-controls")
  trigger.toggleAttribute("data-popup-open", controls !== null)
  trigger.toggleAttribute("data-pressed", controls !== null)
}

/** @param {HTMLElement} root */
const delays = (root) => ({
  delay: Number(root.dataset.delay ?? 50),
  closeDelay: Number(root.dataset.closeDelay ?? 50),
})

/** @param {Element} target */
function triggerItem(target) {
  const trigger = target.closest("[data-navigation-menu-trigger]")
  const item = trigger?.closest("[data-navigation-menu-item]")
  const root = rootOf(trigger ?? null)
  return trigger instanceof HTMLElement &&
    item instanceof HTMLElement &&
    root &&
    !trigger.hasAttribute("disabled")
    ? { root, item, trigger }
    : null
}

// Hover: resting on a trigger opens it; while open, entering another trigger
// switches at once. Leaving the trigger and the popup closes a hover-opened
// menu after the close delay.
document.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch" || !(event.target instanceof Element))
    return
  const found = triggerItem(event.target)
  if (!found) return
  const { root, item } = found
  const state = stateOf(root)
  if (state.item === item) {
    clearTimeout(state.timer)
    return
  }
  if (state.item) {
    open(root, item, "hover")
    return
  }
  clearTimeout(state.timer)
  state.timer = setTimeout(() => open(root, item, "hover"), delays(root).delay)
})

document.addEventListener(
  "pointerenter",
  (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target.matches("[data-navigation-menu-positioner]")) {
      const root = rootOf(target)
      if (root) clearTimeout(stateOf(root).timer)
    }
  },
  true
)

document.addEventListener(
  "pointerleave",
  (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement) || event.pointerType === "touch")
      return
    if (
      !target.matches(
        "[data-navigation-menu-trigger], [data-navigation-menu-positioner]"
      )
    )
      return
    const root = rootOf(target)
    if (!root) return
    const state = stateOf(root)
    clearTimeout(state.timer)
    if (state.reason !== "hover") return
    state.timer = setTimeout(() => close(root), delays(root).closeDelay)
  },
  true
)

// Clicks toggle; a click soon after a hover-open keeps the menu open.
document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return
  const found = triggerItem(event.target)
  if (found) {
    const { root, item } = found
    const state = stateOf(root)
    if (state.item !== item) {
      open(root, item, "click")
    } else if (
      state.reason === "hover" &&
      performance.now() - state.openedAt < 500
    ) {
      state.reason = "click"
    } else {
      close(root)
    }
    return
  }
  const link = event.target.closest("a")
  const root = rootOf(event.target)
  if (link && root && link.hasAttribute("data-close-on-click")) {
    close(root)
    return
  }
  // A click outside the menu and its popup closes open menus.
  for (const positioner of document.querySelectorAll(
    "[data-navigation-menu-positioner]:popover-open"
  )) {
    const menu = rootOf(positioner)
    if (menu && !menu.contains(event.target)) close(menu)
  }
})

/**
 * Tabbable elements inside `container`, in order.
 *
 * @param {Element} container
 */
const tabbables = (container) =>
  /** @type {HTMLElement[]} */ ([
    ...container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ),
  ]).filter((element) => element.checkVisibility())

/**
 * The triggers and links of the list, for the arrow keys.
 *
 * @param {HTMLElement} root
 */
const listItems = (root) =>
  own(root, "[data-navigation-menu-trigger], a").filter(
    (element) => !element.closest("[data-navigation-menu-positioner]")
  )

document.addEventListener("keydown", (event) => {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  const root = rootOf(target)
  if (!root) return
  const state = stateOf(root)
  const { positioner } = partsOf(root)
  const inContent = positioner?.contains(target) ?? false

  if (event.key === "Escape" && state.item) {
    event.preventDefault()
    close(root, true)
    return
  }
  const [backKey, forwardKey] = inlineKeys(root)
  if (inContent && positioner) {
    const items = tabbables(positioner)
    const index = items.indexOf(target)
    if (["ArrowDown", "ArrowUp", backKey, forwardKey].includes(event.key)) {
      event.preventDefault()
      const step =
        event.key === "ArrowDown" || event.key === forwardKey ? 1 : -1
      items[(index + step + items.length) % items.length]?.focus()
    } else if (event.key === "Tab" && state.item) {
      const trigger = triggerOf(state.item)
      if (!trigger) return
      if (event.shiftKey && index === 0) {
        event.preventDefault()
        trigger.focus()
      } else if (!event.shiftKey && index === items.length - 1) {
        // Continue after the trigger, like Base UI's focus guards.
        const list = listItems(root)
        const next = list[list.indexOf(trigger) + 1]
        if (next) {
          event.preventDefault()
          next.focus()
        } else {
          close(root)
        }
      }
    }
    return
  }

  const list = listItems(root)
  const index = list.indexOf(target)
  if (index === -1) return
  const horizontal = root.dataset.orientation !== "vertical"
  const [back, forward] = horizontal
    ? [backKey, forwardKey]
    : ["ArrowUp", "ArrowDown"]
  if (event.key === back || event.key === forward) {
    event.preventDefault()
    event.stopPropagation()
    list[index + (event.key === forward ? 1 : -1)]?.focus()
    return
  }
  const found = triggerItem(target)
  if (found && event.key === (horizontal ? "ArrowDown" : forwardKey)) {
    event.preventDefault()
    open(root, found.item, "keyboard")
    return
  }
  if (event.key === "Tab" && positioner && state.item) {
    const open = triggerOf(state.item)
    const content = tabbables(positioner)
    if (!event.shiftKey && target === open && content[0]) {
      // Tab from the open trigger enters its content.
      event.preventDefault()
      content[0].focus()
    } else if (event.shiftKey && open && list[index - 1] === open) {
      const last = content.at(-1)
      if (last) {
        event.preventDefault()
        last.focus()
      }
    }
  }
})

// Focus leaving the menu (and its popup) closes it.
document.addEventListener("focusout", (event) => {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  const root = rootOf(target)
  if (!root || !stateOf(root).item) return
  const { positioner } = partsOf(root)
  if (positioner?.contains(target)) return
  const to = event.relatedTarget
  if (to instanceof Node && (root.contains(to) || positioner?.contains(to)))
    return
  close(root)
})

/**
 * The inline arrow keys in reading order: [backward, forward].
 *
 * @param {Element} element
 */
const inlineKeys = (element) =>
  getComputedStyle(element).direction === "rtl"
    ? ["ArrowRight", "ArrowLeft"]
    : ["ArrowLeft", "ArrowRight"]

// A module: its declarations stay local.
export {}
