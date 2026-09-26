// @ts-check
/**
 * Sliders: each thumb holds a native range input (focus, keyboard, form
 * value). This script moves the thumbs and the indicator when the values
 * change, keeps the thumbs of a range slider in order, and adds pointer
 * dragging on the control, like Base UI. Without it the initial values are
 * shown and submitted.
 */
import { delegate } from "./core.js"

const CONTROL = "[data-slider-control]"
const THUMB = "[data-slider-thumb]"

/**
 * @param {HTMLElement} control
 * @returns {HTMLInputElement[]}
 */
const inputsOf = (control) =>
  [...control.querySelectorAll(`${THUMB} > input[type="range"]`)].filter(
    /** @returns {input is HTMLInputElement} */
    (input) =>
      input instanceof HTMLInputElement && input.closest(CONTROL) === control
  )

/** @param {HTMLInputElement} input */
function percentOf(input) {
  const min = Number(input.min)
  const max = Number(input.max)
  return max === min ? 0 : ((Number(input.value) - min) / (max - min)) * 100
}

/**
 * Places the thumbs and the indicator for the current input values.
 *
 * @param {HTMLElement} control
 */
function render(control) {
  const inputs = inputsOf(control)
  const vertical = control.dataset.orientation === "vertical"
  const edge = control.dataset.thumbAlignment === "edge"
  const range = inputs.length > 1
  for (const input of inputs) {
    const thumb = input.parentElement
    if (!thumb) continue
    const percent = percentOf(input)
    const shift = edge ? percent : 50
    if (vertical) {
      thumb.style.bottom = `${percent}%`
      thumb.style.translate = `-50% ${shift}%`
    } else {
      thumb.style.insetInlineStart = `${percent}%`
      // --slider-dir is -1 in right-to-left text (a class on the thumb).
      thumb.style.translate = `calc(var(--slider-dir, 1) * -${shift}%) -50%`
    }
    if (range) {
      const index = inputs.indexOf(input)
      input.setAttribute(
        "aria-valuetext",
        `${input.value} ${index === 0 ? "start" : "end"} range`
      )
    }
  }
  const indicator = control.querySelector("[data-slider-indicator]")
  if (indicator instanceof HTMLElement && inputs.length > 0) {
    const first = inputs[0]
    const last = inputs.at(-1)
    const start = range && first ? percentOf(first) : 0
    const end = last ? percentOf(last) : 0
    indicator.style.setProperty(
      vertical ? "bottom" : "inset-inline-start",
      `${start}%`
    )
    indicator.style.setProperty(
      vertical ? "height" : "width",
      `${end - start}%`
    )
  }
}

/**
 * Keeps a thumb between its neighbors (with the minimum steps between them).
 *
 * @param {HTMLElement} control
 * @param {HTMLInputElement} input
 */
function constrain(control, input) {
  const inputs = inputsOf(control)
  const index = inputs.indexOf(input)
  const gap =
    Number(
      control.closest('[role="group"]')?.getAttribute("data-min-steps") ?? 0
    ) * Number(input.step || 1)
  const previous = inputs[index - 1]
  const next = inputs[index + 1]
  let value = Number(input.value)
  if (previous) value = Math.max(value, Number(previous.value) + gap)
  if (next) value = Math.min(value, Number(next.value) - gap)
  if (value !== Number(input.value)) input.value = String(value)
}

// Keyboard (and any other) changes to the native inputs.
delegate("input", `${THUMB} > input[type="range"]`, (_event, input) => {
  const control = input.closest(CONTROL)
  if (
    !(control instanceof HTMLElement) ||
    !(input instanceof HTMLInputElement)
  ) {
    return
  }
  constrain(control, input)
  render(control)
})

/**
 * The value under the pointer, for the given thumb's input.
 *
 * @param {HTMLElement} control
 * @param {HTMLInputElement} input
 * @param {PointerEvent} event
 * @param {number} [grab] pointer distance from the thumb's center when it was pressed
 */
function valueAt(control, input, event, grab = 0) {
  const rect = control.getBoundingClientRect()
  const thumb = input.parentElement?.getBoundingClientRect()
  const vertical = control.dataset.orientation === "vertical"
  const edge = control.dataset.thumbAlignment === "edge"
  const size = vertical ? rect.height : rect.width
  const thumbSize = edge && thumb ? (vertical ? thumb.height : thumb.width) : 0
  const rtl = getComputedStyle(control).direction === "rtl"
  let offset = vertical
    ? rect.bottom - event.clientY
    : rtl
      ? rect.right - event.clientX
      : event.clientX - rect.left
  offset -= thumbSize / 2 + grab
  const ratio = Math.min(Math.max(offset / Math.max(size - thumbSize, 1), 0), 1)
  const min = Number(input.min)
  const max = Number(input.max)
  const step = Number(input.step) || 1
  return Math.round((min + ratio * (max - min) - min) / step) * step + min
}

/**
 * Sets a thumb's value like a user change, firing `input` and `change`.
 *
 * @param {HTMLInputElement} input
 * @param {number} value
 */
function setValue(input, value) {
  if (Number(input.value) === value) return
  input.value = String(value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

delegate("pointerdown", CONTROL, (event, control) => {
  if (event.button !== 0 || control.hasAttribute("data-disabled")) return
  const inputs = inputsOf(control)
  if (inputs.length === 0) return
  const first = inputs[0]
  if (!first) return
  // The thumb nearest to the pointer moves (the pressed thumb, if any).
  const pressed =
    event.target instanceof Element ? event.target.closest(THUMB) : null
  const target = valueAt(control, first, event)
  const input =
    inputs.find((candidate) => candidate.parentElement === pressed) ??
    inputs.reduce((best, candidate) =>
      Math.abs(Number(candidate.value) - target) <
      Math.abs(Number(best.value) - target)
        ? candidate
        : best
    )
  event.preventDefault()
  input.focus({ preventScroll: true })
  control.setPointerCapture(event.pointerId)
  control.toggleAttribute("data-dragging", true)
  // Pressing a thumb keeps it under the pointer where it was grabbed;
  // pressing the track moves the thumb's center to the pointer.
  let grab = 0
  if (pressed && input.parentElement === pressed) {
    const rect = pressed.getBoundingClientRect()
    const vertical = control.dataset.orientation === "vertical"
    const rtl = getComputedStyle(control).direction === "rtl"
    grab = vertical
      ? rect.top + rect.height / 2 - event.clientY
      : (event.clientX - (rect.left + rect.width / 2)) * (rtl ? -1 : 1)
  } else {
    setValue(input, valueAt(control, input, event))
  }
  /** @param {PointerEvent} move */
  const onMove = (move) => setValue(input, valueAt(control, input, move, grab))
  const onUp = () => {
    control.removeEventListener("pointermove", onMove)
    control.toggleAttribute("data-dragging", false)
    input.dispatchEvent(new Event("change", { bubbles: true }))
  }
  control.addEventListener("pointermove", onMove)
  control.addEventListener("pointerup", onUp, { once: true })
  control.addEventListener("pointercancel", onUp, { once: true })
})
