// @ts-check
/**
 * Drawers: dragging an open drawer toward its edge moves it with the pointer
 * (Base UI's `--drawer-swipe-movement-*` and `--drawer-swipe-progress`) and,
 * released past half its size or flicked, closes it; otherwise it slides
 * back, like Base UI. Mouse and pen drags start outside the drawer's content
 * (for example on the swipe handle); touch drags start anywhere unless they
 * scroll the content. Opening and closing otherwise use the native dialog.
 */

/** Movement before a press becomes a swipe, in pixels. */
const MIN_SWIPE_THRESHOLD = 10
/** A release faster than this (pixels per millisecond) closes the drawer. */
const FAST_SWIPE_VELOCITY = 0.5
/** Presses on these never start a swipe. */
const IGNORED =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [data-swipe-ignore]'

/** @param {HTMLDialogElement} popup */
function reset(popup) {
  for (const axis of ["x", "y"]) {
    popup.style.setProperty(`--drawer-swipe-movement-${axis}`, "0px")
  }
  popup.style.setProperty("--drawer-swipe-progress", "0")
}

/** @param {EventTarget | null} target */
function drawerOf(target) {
  if (!(target instanceof Element) || target.closest(IGNORED)) return null
  const popup = target.closest("dialog[data-drawer]")
  return popup instanceof HTMLDialogElement && popup.open ? popup : null
}

/**
 * Tracks one drag of `popup` from `start` (a client coordinate).
 *
 * @param {HTMLDialogElement} popup
 * @param {{ x: number, y: number }} start
 * @param {number} time
 */
function swipe(popup, start, time) {
  const direction = popup.dataset.swipeDirection ?? "down"
  const vertical = direction === "down" || direction === "up"
  const sign = direction === "down" || direction === "right" ? 1 : -1
  const size = vertical ? popup.offsetHeight : popup.offsetWidth
  let swiping = false
  /** The distance at which the drag became a swipe; movement starts there. */
  let offset = 0
  let displacement = 0
  let velocity = 0
  let last = time
  return {
    get swiping() {
      return swiping
    },
    /**
     * @param {{ x: number, y: number }} point
     * @param {number} now
     */
    move(point, now) {
      const delta = (vertical ? point.y - start.y : point.x - start.x) * sign
      if (!swiping) {
        if (Math.abs(delta) < MIN_SWIPE_THRESHOLD) return
        swiping = true
        offset = delta
        popup.toggleAttribute("data-swiping", true)
      }
      const next = Math.max(0, delta - offset)
      velocity = (next - displacement) / Math.max(now - last, 1)
      displacement = next
      last = now
      popup.style.setProperty(
        `--drawer-swipe-movement-${vertical ? "y" : "x"}`,
        `${displacement * sign}px`
      )
      popup.style.setProperty(
        "--drawer-swipe-progress",
        String(Math.min(displacement / Math.max(size, 1), 1))
      )
    },
    end() {
      if (!swiping) return
      popup.removeAttribute("data-swiping")
      const threshold = Math.max(size * 0.5, MIN_SWIPE_THRESHOLD)
      if (displacement > threshold || velocity >= FAST_SWIPE_VELOCITY) {
        // It closes from where it was released, then the swipe state resets.
        popup.close()
        Promise.all(
          popup.getAnimations().map((a) => a.finished.catch(() => undefined))
        ).then(() => {
          if (!popup.open) reset(popup)
        })
      } else {
        reset(popup)
      }
    },
  }
}

// Mouse and pen: drags that start outside the content.
document.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch" || event.button !== 0) return
  const popup = drawerOf(event.target)
  if (!popup || !(event.target instanceof Element)) return
  if (event.target.closest("[data-drawer-content], button, a[href]")) return
  const drag = swipe(
    popup,
    { x: event.clientX, y: event.clientY },
    event.timeStamp
  )
  /** @param {PointerEvent} move */
  const onMove = (move) => {
    drag.move({ x: move.clientX, y: move.clientY }, move.timeStamp)
    if (drag.swiping && !popup.hasPointerCapture(event.pointerId)) {
      popup.setPointerCapture(event.pointerId)
    }
  }
  const onUp = () => {
    document.removeEventListener("pointermove", onMove)
    document.removeEventListener("pointerup", onUp)
    document.removeEventListener("pointercancel", onUp)
    drag.end()
  }
  document.addEventListener("pointermove", onMove)
  document.addEventListener("pointerup", onUp)
  document.addEventListener("pointercancel", onUp)
})

/**
 * Whether a touch at `target` should scroll instead: it is inside content
 * that can scroll back toward the drawer's closing edge.
 *
 * @param {Element} target
 * @param {HTMLDialogElement} popup
 */
function scrollsFirst(target, popup) {
  const direction = popup.dataset.swipeDirection ?? "down"
  for (
    let el = /** @type {Element | null} */ (target);
    el && el !== popup;
    el = el.parentElement
  ) {
    const style = getComputedStyle(el)
    if (direction === "down" || direction === "up") {
      if (
        !/auto|scroll/.test(style.overflowY) ||
        el.scrollHeight <= el.clientHeight
      )
        continue
      if (
        direction === "down"
          ? el.scrollTop > 0
          : el.scrollTop + el.clientHeight < el.scrollHeight
      )
        return true
    } else {
      if (
        !/auto|scroll/.test(style.overflowX) ||
        el.scrollWidth <= el.clientWidth
      )
        continue
      if (
        direction === "right"
          ? el.scrollLeft > 0
          : el.scrollLeft + el.clientWidth < el.scrollWidth
      )
        return true
    }
  }
  return false
}

// Touch: drags anywhere in the drawer, unless they scroll its content.
document.addEventListener(
  "touchstart",
  (event) => {
    const popup = drawerOf(event.target)
    const touch = event.touches[0]
    if (!popup || !touch || event.touches.length > 1) return
    if (event.target instanceof Element && scrollsFirst(event.target, popup))
      return
    const drag = swipe(
      popup,
      { x: touch.clientX, y: touch.clientY },
      event.timeStamp
    )
    /** @param {TouchEvent} move */
    const onMove = (move) => {
      const point = move.touches[0]
      if (!point) return
      drag.move({ x: point.clientX, y: point.clientY }, move.timeStamp)
      if (drag.swiping && move.cancelable) move.preventDefault()
    }
    const onEnd = () => {
      document.removeEventListener("touchmove", onMove)
      document.removeEventListener("touchend", onEnd)
      document.removeEventListener("touchcancel", onEnd)
      drag.end()
    }
    document.addEventListener("touchmove", onMove, { passive: false })
    document.addEventListener("touchend", onEnd)
    document.addEventListener("touchcancel", onEnd)
  },
  { passive: true }
)

// A module: its declarations stay local.
export {}
