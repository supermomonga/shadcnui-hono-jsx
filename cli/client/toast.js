// @ts-check
/**
 * Toasts: `toast.add()` (Base UI's toast manager API) copies the toast markup
 * from the templates `<Toaster>` renders, and this script stacks, times out,
 * expands and swipes toasts like Base UI. Server-rendered toasts (`<Toaster
 * toasts>`) get the same behavior, and `data-toast-trigger` buttons add toasts
 * without code.
 *
 * Import `toast` from this module in your own module scripts and call
 * `toast.add({ title: "Saved", description: "Your changes were saved." })`.
 */

/**
 * @typedef {object} ToastOptions
 * @property {string} [id]
 * @property {string | Node} [title]
 * @property {string | Node} [description]
 * @property {string} [type] `success`, `info`, `warning`, `error` or `loading`
 * @property {number} [timeout] milliseconds before it closes; 0 keeps it open
 * @property {"low" | "high"} [priority]
 * @property {{ children?: string | Node, onClick?: (event: MouseEvent) => void } & Record<string, unknown>} [actionProps]
 * @property {() => void} [onClose]
 * @property {() => void} [onRemove]
 */

/**
 * @typedef {object} Entry
 * @property {HTMLElement} root
 * @property {ToastOptions} options
 * @property {ReturnType<typeof setTimeout> | undefined} timer
 * @property {number} remaining milliseconds left (paused timers keep it)
 * @property {number} started
 */

/** Movement (px) past which a swipe closes the toast. */
const SWIPE_THRESHOLD = 40
/** Directions a swipe closes toasts in (Base UI's default). */
const SWIPE_DIRECTIONS = ["down", "right"]
/** Presses on these do not start a swipe. */
const SWIPE_IGNORED =
  "button, a, input, textarea, [role=button], [data-swipe-ignore]"

/** @type {Map<string, Entry>} */
const entries = new Map()
let count = 0
let hovering = false
let focused = false
/** @type {Element | null} */
let previousFocus = null

const VIEWPORT = "[data-toast-viewport]"

const viewportOf = () =>
  /** @type {HTMLElement | null} */ (document.querySelector(VIEWPORT))

/** @param {HTMLElement} viewport */
const rootsOf = (viewport) =>
  /** @type {HTMLElement[]} */ ([
    ...viewport.querySelectorAll(":scope > [data-toast]"),
  ])

/**
 * @param {HTMLElement} root
 * @param {string} name
 */
const part = (root, name) =>
  /** @type {HTMLElement | null} */ (
    root.querySelector(`[data-toast-part="${name}"]`)
  )

/** @param {HTMLElement} viewport */
const defaultTimeout = (viewport) => Number(viewport.dataset.timeout ?? 5000)

/** The root's natural height, measured like Base UI. @param {HTMLElement} root */
function measure(root) {
  const previous = root.style.height
  root.style.height = "auto"
  const height = root.offsetHeight
  root.style.height = previous
  return height
}

/**
 * Updates the stack: indexes, offsets, heights, limits and the expanded state.
 *
 * @param {HTMLElement} viewport
 */
function layout(viewport) {
  const limit = Number(viewport.dataset.limit ?? 3)
  const expanded = hovering || focused
  let visible = 0
  let offset = 0
  let frontmost = 0
  rootsOf(viewport).forEach((root, position) => {
    const closing = root.hasAttribute("data-ending-style")
    const index = closing ? position : visible++
    const height = closing ? 0 : measure(root)
    if (position === 0) frontmost = height
    root.style.setProperty("--toast-index", String(index))
    root.style.setProperty("--toast-offset-y", `${offset}px`)
    if (height) root.style.setProperty("--toast-height", `${height}px`)
    else root.style.removeProperty("--toast-height")
    offset += height
    const limited = !closing && index >= limit
    root.toggleAttribute("data-limited", limited)
    root.inert = limited
    const content = part(root, "content")
    content?.toggleAttribute("data-behind", !closing && index > 0)
    for (const element of [root, content]) {
      element?.toggleAttribute("data-expanded", expanded)
    }
    const close = part(root, "close")
    if (close) {
      close.setAttribute(
        "aria-hidden",
        String(!expanded && document.activeElement !== close)
      )
    }
  })
  if (frontmost) {
    viewport.style.setProperty("--toast-frontmost-height", `${frontmost}px`)
  } else {
    viewport.style.removeProperty("--toast-frontmost-height")
  }
  viewport.toggleAttribute("data-expanded", expanded)
}

/** @param {Entry} entry */
function startTimer(entry) {
  clearTimeout(entry.timer)
  entry.timer = undefined
  if (hovering || focused || !document.hasFocus()) return
  if (entry.options.type === "loading" || entry.remaining <= 0) return
  entry.started = Date.now()
  const id = entry.root.dataset.toast ?? ""
  entry.timer = setTimeout(() => toast.close(id), entry.remaining)
}

/**
 * @param {Entry} entry
 * @param {HTMLElement} viewport
 */
function resetTimer(entry, viewport) {
  entry.remaining = entry.options.timeout ?? defaultTimeout(viewport)
  startTimer(entry)
}

function pause() {
  for (const entry of entries.values()) {
    if (entry.timer === undefined) continue
    clearTimeout(entry.timer)
    entry.timer = undefined
    entry.remaining -= Date.now() - entry.started
  }
}

function resume() {
  const viewport = viewportOf()
  for (const entry of entries.values()) {
    if (entry.remaining <= 0 && viewport) {
      entry.remaining = entry.options.timeout ?? defaultTimeout(viewport)
    }
    startTimer(entry)
  }
}

/**
 * @param {HTMLElement} element
 * @param {string | Node | undefined} content
 */
function fill(element, content) {
  element.replaceChildren(
    content instanceof Node ? content : String(content ?? "")
  )
}

/**
 * Writes `options` into a toast root copied from a template.
 *
 * @param {HTMLElement} root
 * @param {ToastOptions} options
 */
function render(root, options) {
  const id = options.id ?? ""
  root.dataset.toast = id
  if (options.type) root.dataset.type = options.type
  else root.removeAttribute("data-type")
  root.setAttribute(
    "role",
    options.priority === "high" ? "alertdialog" : "dialog"
  )
  const parts = /** @type {const} */ ([
    ["title", options.title, "aria-labelledby"],
    ["description", options.description, "aria-describedby"],
  ])
  for (const [name, content, relation] of parts) {
    const element = part(root, name)
    if (!element) continue
    if (content === undefined || content === "") {
      element.remove()
      root.removeAttribute(relation)
    } else {
      element.id = `${id}-${name}`
      root.setAttribute(relation, element.id)
      fill(element, content)
    }
  }
  const action = part(root, "action")
  const { children, onClick, ...attributes } = options.actionProps ?? {}
  if (action && (children === undefined || children === "")) {
    action.remove()
  } else if (action) {
    fill(action, /** @type {string | Node} */ (children))
    for (const [name, value] of Object.entries(attributes)) {
      if (typeof value === "string") action.setAttribute(name, value)
    }
  }
}

export const toast = {
  /**
   * Shows a toast and returns its id; an existing id updates that toast.
   *
   * @param {ToastOptions} options
   */
  add(options) {
    const viewport = viewportOf()
    if (!viewport) {
      throw new Error("toast.add() needs a <Toaster> on the page")
    }
    const id = options.id ?? `toast-client-${++count}`
    const existing = entries.get(id)
    if (existing && !existing.root.hasAttribute("data-ending-style")) {
      toast.update(id, options)
      return id
    }
    existing?.root.remove()
    const template = viewport.querySelector(
      `template[data-toast-template="${CSS.escape(options.type ?? "")}"]`
    )
    const root =
      template instanceof HTMLTemplateElement
        ? template.content.querySelector("[data-toast]")?.cloneNode(true)
        : null
    if (!(root instanceof HTMLElement)) {
      throw new Error(`no toast template for type "${options.type ?? ""}"`)
    }
    const full = { ...options, id }
    render(root, full)
    root.toggleAttribute("data-starting-style", true)
    viewport.prepend(root)
    /** @type {Entry} */
    const entry = {
      root,
      options: full,
      timer: undefined,
      remaining: 0,
      started: 0,
    }
    entries.set(id, entry)
    layout(viewport)
    // The reflow above starts the enter transition from the starting style.
    root.removeAttribute("data-starting-style")
    resetTimer(entry, viewport)
    return id
  },

  /**
   * Closes a toast, or every toast without an id.
   *
   * @param {string} [id]
   */
  close(id) {
    const viewport = viewportOf()
    if (!viewport) return
    if (id === undefined) {
      for (const each of [...entries.keys()]) toast.close(each)
      return
    }
    const entry = entries.get(id)
    if (!entry || entry.root.hasAttribute("data-ending-style")) return
    const { root } = entry
    clearTimeout(entry.timer)
    const hadFocus =
      root.contains(document.activeElement) &&
      document.activeElement?.matches(":focus-visible")
    root.toggleAttribute("data-ending-style", true)
    entry.options.onClose?.()
    if (hadFocus) moveFocusFrom(root, viewport)
    layout(viewport)
    requestAnimationFrame(() => {
      Promise.all(
        root.getAnimations().map((a) => a.finished.catch(() => undefined))
      ).then(() => {
        root.remove()
        // A toast added again with this id meanwhile keeps its entry.
        if (entries.get(id) === entry) entries.delete(id)
        entry.options.onRemove?.()
        if (entries.size === 0) {
          hovering = false
          focused = false
        }
        layout(viewport)
      })
    })
  },

  /**
   * Changes an open toast.
   *
   * @param {string} id
   * @param {ToastOptions} options
   */
  update(id, options) {
    const viewport = viewportOf()
    const entry = entries.get(id)
    if (!viewport || !entry || entry.root.hasAttribute("data-ending-style"))
      return
    const previous = entry.options
    entry.options = { ...previous, ...options, id }
    if (options.type !== previous.type && options.type !== undefined) {
      // Another type has another icon: copy its template.
      const template = viewport.querySelector(
        `template[data-toast-template="${CSS.escape(options.type)}"]`
      )
      const root =
        template instanceof HTMLTemplateElement
          ? template.content.querySelector("[data-toast]")?.cloneNode(true)
          : null
      if (root instanceof HTMLElement) {
        entry.root.replaceWith(root)
        entry.root = root
      }
    }
    render(entry.root, entry.options)
    layout(viewport)
    if (
      options.timeout !== undefined ||
      (previous.type === "loading" && entry.options.type !== "loading")
    ) {
      resetTimer(entry, viewport)
    }
  },

  /**
   * Shows a loading toast that turns into a success or error toast.
   *
   * @template T
   * @param {Promise<T>} promise
   * @param {{ loading: string | ToastOptions, success: string | ToastOptions | ((value: T) => string | ToastOptions), error: string | ToastOptions | ((error: unknown) => string | ToastOptions) }} options
   */
  promise(promise, options) {
    /** @param {string | ToastOptions} value */
    const resolve = (value) =>
      typeof value === "string" ? { description: value } : value
    const id = toast.add({ ...resolve(options.loading), type: "loading" })
    return promise.then(
      (value) => {
        const success =
          typeof options.success === "function"
            ? options.success(value)
            : options.success
        toast.update(id, {
          timeout: undefined,
          ...resolve(success),
          type: "success",
        })
        return value
      },
      (error) => {
        const failure =
          typeof options.error === "function"
            ? options.error(error)
            : options.error
        toast.update(id, {
          timeout: undefined,
          ...resolve(failure),
          type: "error",
        })
        throw error
      }
    )
  },
}

/**
 * Focus leaves a closing toast for the next older one, else a newer one,
 * else where it was before F6.
 *
 * @param {HTMLElement} root
 * @param {HTMLElement} viewport
 */
function moveFocusFrom(root, viewport) {
  const open = rootsOf(viewport).filter(
    (r) => r === root || !r.hasAttribute("data-ending-style")
  )
  const index = open.indexOf(root)
  const next = open[index + 1] ?? open[index - 1]
  if (next && next !== root) next.focus()
  else if (previousFocus instanceof HTMLElement)
    previousFocus.focus({ preventScroll: true })
}

// Server-rendered toasts time out and stack like added ones.
function adopt() {
  // Toasts removed with their `<Toaster>` (an htmx swap) stop their timers.
  for (const [id, entry] of entries) {
    if (entry.root.isConnected) continue
    clearTimeout(entry.timer)
    entries.delete(id)
  }
  const viewport = viewportOf()
  if (!viewport) return
  let adopted = false
  for (const root of rootsOf(viewport)) {
    const known = entries.get(root.dataset.toast ?? "")
    if (known?.root === root) continue
    // Every response numbers its toasts from 1, so an id can be taken.
    const id =
      root.dataset.toast && !known
        ? root.dataset.toast
        : `toast-server-${++count}`
    root.dataset.toast = id
    const timeout = root.dataset.toastTimeout
    /** @type {Entry} */
    const entry = {
      root,
      options: {
        id,
        type: root.dataset.type,
        timeout: timeout === undefined ? undefined : Number(timeout),
      },
      timer: undefined,
      remaining: 0,
      started: 0,
    }
    entries.set(id, entry)
    resetTimer(entry, viewport)
    adopted = true
  }
  if (adopted) layout(viewport)
}
adopt()
// Toasters and toasts rendered later (htmx swaps, streaming).
new MutationObserver((records) => {
  const inserted = records.some((record) =>
    [...record.addedNodes].some(
      (node) =>
        node instanceof Element &&
        (node.matches(`${VIEWPORT}, ${VIEWPORT} > [data-toast]`) ||
          node.querySelector(VIEWPORT) !== null)
    )
  )
  if (inserted) adopt()
}).observe(document.documentElement, { childList: true, subtree: true })

// Hovering or keyboard focus expands the stack and pauses the timers.
document.addEventListener("mouseover", (event) => {
  const viewport = viewportOf()
  if (!viewport || hovering || !(event.target instanceof Node)) return
  if (!viewport.contains(event.target)) return
  hovering = true
  pause()
  layout(viewport)
})

document.addEventListener("mouseout", (event) => {
  const viewport = viewportOf()
  if (!viewport || !hovering) return
  const to = event.relatedTarget
  if (to instanceof Node && viewport.contains(to)) return
  hovering = false
  layout(viewport)
  if (!focused && document.hasFocus()) resume()
})

document.addEventListener("focusin", (event) => {
  const viewport = viewportOf()
  const target = event.target
  if (!viewport || !(target instanceof Element)) return
  if (!viewport.contains(target) || !target.matches(":focus-visible")) return
  focused = true
  pause()
  layout(viewport)
})

document.addEventListener("focusout", (event) => {
  const viewport = viewportOf()
  if (!viewport || !focused) return
  const to = event.relatedTarget
  if (to instanceof Node && viewport.contains(to)) return
  focused = false
  layout(viewport)
  if (!hovering) resume()
})

window.addEventListener("blur", pause)
window.addEventListener("focus", () => {
  if (!hovering && !focused) resume()
})

document.addEventListener("keydown", (event) => {
  const viewport = viewportOf()
  if (!viewport) return
  // F6 moves focus to the notifications.
  if (
    event.key === "F6" &&
    entries.size > 0 &&
    !viewport.contains(document.activeElement)
  ) {
    event.preventDefault()
    previousFocus = document.activeElement
    viewport.focus()
    focused = true
    pause()
    layout(viewport)
    return
  }
  if (event.key !== "Escape" || !(event.target instanceof Element)) return
  const root = event.target.closest("[data-toast]")
  if (root instanceof HTMLElement && viewport.contains(root)) {
    toast.close(root.dataset.toast)
  }
})

document.addEventListener("click", (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  const trigger = target.closest("[data-toast-trigger]")
  if (trigger instanceof HTMLElement) {
    const { toastTitle, toastDescription, toastType, toastTimeout } =
      trigger.dataset
    toast.add({
      title: toastTitle,
      description: toastDescription,
      type: toastType,
      timeout: toastTimeout === undefined ? undefined : Number(toastTimeout),
    })
    return
  }
  const root = target.closest("[data-toast]")
  if (!(root instanceof HTMLElement)) return
  const id = root.dataset.toast ?? ""
  if (target.closest('[data-toast-part="close"]')) {
    toast.close(id)
  } else if (target.closest('[data-toast-part="action"]')) {
    entries
      .get(id)
      ?.options.actionProps?.onClick?.(/** @type {MouseEvent} */ (event))
  }
})

// Swiping down or right past 40px closes a toast.
document.addEventListener("pointerdown", (event) => {
  const target = event.target
  if (event.button !== 0 || !(target instanceof Element)) return
  if (target.closest(SWIPE_IGNORED)) return
  const root = target.closest("[data-toast]")
  const viewport = viewportOf()
  if (!(root instanceof HTMLElement) || !viewport?.contains(root)) return
  const start = { x: event.clientX, y: event.clientY }
  /** @type {"x" | "y" | null} */
  let axis = null
  let movement = 0
  /** @type {string | null} */
  let direction = null
  root.setPointerCapture(event.pointerId)
  if (!hovering) {
    hovering = true
    pause()
    layout(viewport)
  }
  /** @param {PointerEvent} move */
  const onMove = (move) => {
    const dx = move.clientX - start.x
    const dy = move.clientY - start.y
    if (!axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 1) return
      axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y"
      root.toggleAttribute("data-swiping", true)
      root.style.transition = "none"
    }
    const delta = axis === "x" ? dx : dy
    const toward =
      axis === "x" ? (delta > 0 ? "right" : "left") : delta > 0 ? "down" : "up"
    const allowed = SWIPE_DIRECTIONS.includes(toward)
    // Movement against the allowed directions is damped.
    movement = allowed ? delta : Math.sign(delta) * Math.abs(delta) ** 0.5
    direction = allowed ? toward : null
    if (direction) root.dataset.swipeDirection = direction
    else root.removeAttribute("data-swipe-direction")
    root.style.setProperty(`--toast-swipe-movement-${axis}`, `${movement}px`)
  }
  const onUp = () => {
    root.removeEventListener("pointermove", onMove)
    root.removeEventListener("pointerup", onUp)
    root.removeEventListener("pointercancel", onUp)
    if (!axis) return
    root.removeAttribute("data-swiping")
    root.style.removeProperty("transition")
    if (direction && Math.abs(movement) > SWIPE_THRESHOLD) {
      toast.close(root.dataset.toast)
    } else {
      root.removeAttribute("data-swipe-direction")
      root.style.setProperty("--toast-swipe-movement-x", "0px")
      root.style.setProperty("--toast-swipe-movement-y", "0px")
    }
  }
  root.addEventListener("pointermove", onMove)
  root.addEventListener("pointerup", onUp)
  root.addEventListener("pointercancel", onUp)
})
