// @ts-check
/**
 * Comboboxes: typing in the input filters the items of a native popover
 * placed with CSS anchor positioning, the arrow keys highlight an item
 * (`aria-activedescendant`, focus stays in the input) and Enter or a click
 * selects it, like Base UI. Single comboboxes show the selected label in the
 * input; multiple ones add and remove chips (copied from a template rendered
 * on the server) and keep one hidden input per value for forms.
 *
 * The parts of a combobox share its id in `data-combobox`; the form value
 * lives in the hidden input `[data-combobox-field]`.
 */

/** @typedef {"pointer" | "keyboard" | "input"} OpenReason */

const collator = new Intl.Collator(undefined, {
  usage: "search",
  sensitivity: "base",
  ignorePunctuation: true,
})

/**
 * Base UI's default filter: whether `text` contains `query`, ignoring case,
 * accents and punctuation.
 *
 * @param {string} text
 * @param {string} query
 */
function contains(text, query) {
  if (query === "") return true
  for (let start = 0; start + query.length <= text.length; start++) {
    if (collator.compare(text.slice(start, start + query.length), query) === 0)
      return true
  }
  return false
}

/**
 * Per-combobox state that is not in the markup.
 *
 * @type {WeakMap<HTMLInputElement, { values: string[], reason: OpenReason | null, queryChanged: boolean, keyboard: boolean }>}
 */
const states = new WeakMap()

/** @param {string} id */
const partsOf = (id) => {
  const selector = `[data-combobox="${CSS.escape(id)}"]`
  const field = /** @type {HTMLInputElement | null} */ (
    document.querySelector(
      `input[data-combobox-field="${CSS.escape(id)}"]:not([type="hidden"])`
    )
  )
  const popup = /** @type {HTMLElement | null} */ (
    document.querySelector(`${selector}[data-combobox-popup]`)
  )
  return {
    id,
    field,
    input: /** @type {HTMLInputElement | null} */ (
      document.querySelector(`${selector}[data-combobox-input]`)
    ),
    triggers: /** @type {HTMLElement[]} */ ([
      ...document.querySelectorAll(`${selector}[data-combobox-trigger]`),
    ]),
    popup,
    list: popup?.querySelector('[role="listbox"]') ?? null,
    multiple: field?.hasAttribute("data-multiple") ?? false,
  }
}

/** @typedef {ReturnType<typeof partsOf>} Parts */

/** @param {Element | null} element */
function comboboxOf(element) {
  const id = element
    ?.closest("[data-combobox], [data-combobox-popup]")
    ?.getAttribute("data-combobox")
  return id ? partsOf(id) : null
}

/** @param {Parts} parts */
function stateOf(parts) {
  const field = /** @type {HTMLInputElement} */ (parts.field)
  let state = states.get(field)
  if (!state) {
    state = {
      values: parts.multiple
        ? JSON.parse(field.dataset.values ?? "[]")
        : field.value === ""
          ? []
          : [field.value],
      reason: null,
      queryChanged: false,
      keyboard: false,
    }
    states.set(field, state)
  }
  return state
}

/** @param {Parts} parts */
const itemsOf = (parts) =>
  /** @type {HTMLElement[]} */ ([
    ...(parts.list?.querySelectorAll('[role="option"]') ?? []),
  ])

/** @param {Parts} parts */
const visibleItems = (parts) => itemsOf(parts).filter((item) => !item.hidden)

/** @param {Parts} parts */
const isOpen = (parts) => parts.popup?.matches(":popover-open") ?? false

/** @param {Parts} parts */
const highlighted = (parts) =>
  itemsOf(parts).find((item) => item.hasAttribute("data-highlighted")) ?? null

/**
 * @param {Parts} parts
 * @param {HTMLElement | null} item
 */
function highlight(parts, item) {
  for (const other of itemsOf(parts)) {
    other.toggleAttribute("data-highlighted", other === item)
  }
  if (item && isOpen(parts)) {
    parts.input?.setAttribute("aria-activedescendant", item.id)
    item.scrollIntoView({ block: "nearest" })
  } else {
    parts.input?.removeAttribute("aria-activedescendant")
  }
}

/** @param {Parts} parts */
function selectedLabel(parts) {
  const [value] = stateOf(parts).values
  const item = itemsOf(parts).find((i) => i.dataset.value === value)
  return item?.dataset.label ?? value ?? ""
}

/**
 * Shows the items matching the input, like Base UI's filter, and the empty
 * state when none does.
 *
 * @param {Parts} parts
 */
function filter(parts) {
  const { field, input, popup, list } = parts
  if (!field || !input || !popup || !list) return
  const state = stateOf(parts)
  const query = input.value.trim()
  const label = parts.multiple ? "" : selectedLabel(parts)
  // A single combobox shows every item while its input holds the selection.
  const bypass =
    !parts.multiple &&
    !state.queryChanged &&
    query !== "" &&
    label.length === query.length &&
    contains(label, query)
  const filtering = field.hasAttribute("data-filter")
  let empty = true
  for (const item of itemsOf(parts)) {
    item.hidden =
      filtering && !bypass && !contains(item.dataset.label ?? "", query)
    if (!item.hidden) empty = false
  }
  for (const group of list.querySelectorAll('[role="group"]')) {
    if (group instanceof HTMLElement) {
      group.hidden = !group.querySelector('[role="option"]:not([hidden])')
    }
  }
  empty = filtering && empty
  for (const element of [popup, list]) {
    element.toggleAttribute("data-empty", empty)
  }
  for (const element of [input, ...parts.triggers]) {
    element.toggleAttribute("data-list-empty", empty)
  }
  for (const status of popup.querySelectorAll("[data-combobox-empty]")) {
    const template = status.querySelector(":scope > template")
    if (!(template instanceof HTMLTemplateElement)) continue
    status.replaceChildren(
      template,
      ...(empty ? [template.content.cloneNode(true)] : [])
    )
  }
  const current = highlighted(parts)
  if (current?.hidden) highlight(parts, null)
}

/**
 * @param {Parts} parts
 * @param {OpenReason} reason
 */
function open(parts, reason) {
  const { input, popup } = parts
  if (!input || !popup || input.disabled || isOpen(parts)) return
  for (const other of document.querySelectorAll(
    "[data-combobox-popup]:popover-open"
  )) {
    const combobox = comboboxOf(other)
    if (combobox && combobox.id !== parts.id) close(combobox)
  }
  const state = stateOf(parts)
  state.reason = reason
  filter(parts)
  popup.showPopover()
  for (const element of [input, ...parts.triggers]) {
    element.setAttribute("aria-expanded", "true")
    element.setAttribute("aria-controls", parts.list?.id ?? "")
    element.toggleAttribute("data-popup-open", true)
    element.toggleAttribute("data-pressed", true)
  }
}

/** @param {Parts} parts */
function close(parts) {
  const { input, popup } = parts
  if (!input || !popup) return
  if (isOpen(parts)) popup.hidePopover()
  highlight(parts, null)
  for (const element of [input, ...parts.triggers]) {
    element.setAttribute("aria-expanded", "false")
    element.removeAttribute("aria-controls")
    element.removeAttribute("data-popup-open")
    element.removeAttribute("data-pressed")
  }
  const state = stateOf(parts)
  state.reason = null
  state.queryChanged = false
  // The input shows the selection again (single) or clears (multiple).
  input.value = parts.multiple ? "" : selectedLabel(parts)
}

/**
 * The item a combobox highlights when it opens: the selected one, else the
 * first (or last) enabled one when opened with the arrow keys.
 *
 * @param {Parts} parts
 * @param {"first" | "last" | null} fallback
 */
function initialItem(parts, fallback) {
  const items = visibleItems(parts)
  const selected = items.find((item) => item.hasAttribute("data-selected"))
  if (selected || !fallback) return selected ?? null
  const enabled = items.filter((item) => !item.hasAttribute("data-disabled"))
  return (fallback === "first" ? enabled[0] : enabled.at(-1)) ?? null
}

/**
 * Renders the selection: items and indicators, the form fields, the trigger,
 * the clear button, the value and the chips.
 *
 * @param {Parts} parts
 */
function renderValue(parts) {
  const { field } = parts
  if (!field) return
  const { values } = stateOf(parts)
  for (const item of itemsOf(parts)) {
    const selected = values.includes(item.dataset.value ?? "")
    item.setAttribute("aria-selected", String(selected))
    item.toggleAttribute("data-selected", selected)
    for (const indicator of item.querySelectorAll(
      "[data-combobox-indicator]"
    )) {
      if (indicator.closest('[role="option"]') !== item) continue
      indicator.toggleAttribute("hidden", !selected)
      indicator.toggleAttribute("data-selected", selected)
    }
  }
  for (const trigger of parts.triggers) {
    trigger.toggleAttribute("data-placeholder", values.length === 0)
  }
  if (parts.multiple) {
    field.dataset.values = JSON.stringify(values)
    const name = field.dataset.name
    for (const hidden of document.querySelectorAll(
      `input[type="hidden"][data-combobox-field="${CSS.escape(parts.id)}"]`
    )) {
      hidden.remove()
    }
    if (name) {
      field.after(
        ...values.map((value) => {
          const hidden = document.createElement("input")
          hidden.type = "hidden"
          hidden.name = name
          hidden.value = value
          if (field.getAttribute("form"))
            hidden.setAttribute("form", field.getAttribute("form") ?? "")
          hidden.dataset.comboboxField = parts.id
          return hidden
        })
      )
    }
    renderChips(parts)
  } else {
    field.value = values[0] ?? ""
    for (const value of document.querySelectorAll(
      `[data-combobox-value="${CSS.escape(parts.id)}"]`
    )) {
      if (!value.querySelector("template, [data-combobox-chip]")) {
        value.textContent =
          selectedLabel(parts) || value.getAttribute("data-placeholder") || ""
      }
    }
  }
  renderClear(parts, values.length > 0)
}

/**
 * Mounts the clear buttons while there is a value (kept in a template otherwise).
 *
 * @param {Parts} parts
 * @param {boolean} visible
 */
function renderClear(parts, visible) {
  const id = CSS.escape(parts.id)
  if (visible) {
    for (const template of document.querySelectorAll(
      `template[data-combobox-clear="${id}"]`
    )) {
      if (template instanceof HTMLTemplateElement) {
        template.replaceWith(template.content.cloneNode(true))
      }
    }
  } else {
    for (const button of document.querySelectorAll(
      `[data-combobox="${id}"][data-combobox-clear]`
    )) {
      const template = document.createElement("template")
      template.dataset.comboboxClear = parts.id
      button.replaceWith(template)
      template.content.append(button)
    }
  }
}

/**
 * Adds and removes chips so they follow the values, copying new chips from
 * the template of `ComboboxValue` (its sample label replaced).
 *
 * @param {Parts} parts
 */
function renderChips(parts) {
  const container = document.querySelector(
    `[data-combobox-value="${CSS.escape(parts.id)}"]`
  )
  const template = container?.querySelector(":scope > template")
  if (!container || !(template instanceof HTMLTemplateElement)) return
  const { values } = stateOf(parts)
  const chips = [...container.querySelectorAll("[data-combobox-chip]")]
  // Server-rendered chips follow the initial values.
  const initial = JSON.parse(container.getAttribute("data-initial") ?? "[]")
  chips.forEach((chip, index) => {
    if (!chip.hasAttribute("data-value")) {
      chip.setAttribute("data-value", initial[index] ?? "")
    }
  })
  const byValue = new Map(
    chips.map((chip) => [chip.getAttribute("data-value") ?? "", chip])
  )
  const sample = template.dataset.label ?? ""
  let previous = null
  for (const value of values) {
    let chip = byValue.get(value)
    byValue.delete(value)
    if (!chip) {
      const label =
        itemsOf(parts).find((item) => item.dataset.value === value)?.dataset
          .label ?? value
      const copy = /** @type {DocumentFragment} */ (
        template.content.cloneNode(true)
      ).querySelector("[data-combobox-chip]")
      if (!copy) return
      relabel(copy, sample, label)
      copy.setAttribute("data-value", value)
      chip = copy
    }
    if (previous) previous.after(chip)
    else container.prepend(chip)
    previous = chip
  }
  for (const chip of byValue.values()) chip?.remove()
}

/**
 * Replaces `from` with `to` in the text and attributes of a copied chip.
 *
 * @param {Element} element
 * @param {string} from
 * @param {string} to
 */
function relabel(element, from, to) {
  if (from === "") return
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    node.nodeValue = (node.nodeValue ?? "").replaceAll(from, to)
  }
  for (const each of [element, ...element.querySelectorAll("*")]) {
    for (const attribute of each.attributes) {
      if (attribute.value.includes(from)) {
        attribute.value = attribute.value.replaceAll(from, to)
      }
    }
  }
}

/**
 * Selects an item: single comboboxes take its value and close, multiple ones
 * toggle it.
 *
 * @param {Parts} parts
 * @param {HTMLElement} item
 */
function select(parts, item) {
  if (item.hasAttribute("data-disabled")) return
  const state = stateOf(parts)
  const value = item.dataset.value ?? ""
  if (parts.multiple) {
    state.values = state.values.includes(value)
      ? state.values.filter((v) => v !== value)
      : [...state.values, value]
    renderValue(parts)
    if (parts.input && parts.input.value.trim() !== "") {
      close(parts)
    } else {
      filter(parts)
    }
  } else {
    state.values = [value]
    renderValue(parts)
    close(parts)
  }
  parts.field?.dispatchEvent(new Event("change", { bubbles: true }))
}

/** @param {Parts} parts */
function clearValue(parts) {
  stateOf(parts).values = []
  renderValue(parts)
  parts.field?.dispatchEvent(new Event("change", { bubbles: true }))
}

/**
 * @param {Parts} parts
 * @param {number} index
 * @param {boolean} [focusInput]
 */
function removeValue(parts, index, focusInput = true) {
  const state = stateOf(parts)
  state.values = state.values.filter((_, i) => i !== index)
  renderValue(parts)
  filter(parts)
  parts.field?.dispatchEvent(new Event("change", { bubbles: true }))
  if (focusInput) parts.input?.focus()
}

/**
 * Moves the highlight like Base UI: past either end it returns to the input
 * (no highlight) unless `autoHighlight` makes it wrap.
 *
 * @param {Parts} parts
 * @param {1 | -1} step
 */
function move(parts, step) {
  const items = visibleItems(parts)
  if (items.length === 0) return
  const current = highlighted(parts)
  const index = current ? items.indexOf(current) : -1
  const wrap = parts.field?.hasAttribute("data-auto-highlight") ?? false
  let next
  if (index === -1) next = step === 1 ? 0 : items.length - 1
  else if (index + step < 0 || index + step >= items.length)
    next = wrap ? (index + step + items.length) % items.length : -1
  else next = index + step
  highlight(parts, items[next] ?? null)
}

document.addEventListener("keydown", (event) => {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (target.matches("[data-combobox-chip]")) {
    chipKeydown(event, target)
    return
  }
  if (
    !(target instanceof HTMLInputElement) ||
    !target.matches("[data-combobox-input]")
  )
    return
  const parts = comboboxOf(target)
  if (!parts || parts.input !== target) return
  const state = stateOf(parts)
  state.keyboard = true
  const opened = isOpen(parts)
  switch (event.key) {
    case "ArrowDown":
    case "ArrowUp": {
      event.preventDefault()
      if (!opened) {
        open(parts, "keyboard")
        highlight(
          parts,
          initialItem(parts, event.key === "ArrowDown" ? "first" : "last")
        )
      } else {
        move(parts, event.key === "ArrowDown" ? 1 : -1)
      }
      break
    }
    case "Enter": {
      const item = highlighted(parts)
      if (opened && item) {
        event.preventDefault()
        item.click()
      } else if (opened) {
        close(parts)
      }
      break
    }
    case "Escape": {
      if (opened) {
        event.preventDefault()
        close(parts)
      } else if (target.value !== "" || state.values.length > 0) {
        event.preventDefault()
        target.value = ""
        clearValue(parts)
      }
      break
    }
    case "Tab":
      if (opened) close(parts)
      break
    case "Backspace":
      if (parts.multiple && target.value === "" && state.values.length > 0) {
        removeValue(parts, state.values.length - 1, false)
      }
      break
    case inlineKeys(target)[0]:
      if (
        parts.multiple &&
        target.selectionStart === 0 &&
        target.selectionEnd === 0
      ) {
        const chips = chipsOf(parts)
        const last = chips.at(-1)
        if (last) {
          event.preventDefault()
          last.focus()
        }
      }
      break
  }
})

/** @param {Parts} parts */
const chipsOf = (parts) =>
  /** @type {HTMLElement[]} */ ([
    ...document.querySelectorAll(
      `[data-combobox-value="${CSS.escape(parts.id)}"] [data-combobox-chip]`
    ),
  ]).filter((chip) => chip.closest("template") === null)

/**
 * @param {KeyboardEvent} event
 * @param {HTMLElement} chip
 */
function chipKeydown(event, chip) {
  const parts = comboboxOf(chip)
  if (!parts?.input) return
  const chips = chipsOf(parts)
  const index = chips.indexOf(chip)
  switch (event.key) {
    case "ArrowLeft":
    case "ArrowRight": {
      event.preventDefault()
      const [backKey] = inlineKeys(chip)
      const next = chips[index + (event.key === backKey ? -1 : 1)]
      if (next) next.focus()
      else parts.input.focus()
      break
    }
    case "Backspace":
    case "Delete": {
      event.preventDefault()
      removeValue(parts, index, false)
      const remaining = chipsOf(parts)
      const next = remaining[index] ?? remaining[index - 1]
      if (next) next.focus()
      else parts.input.focus()
      break
    }
    case "ArrowDown":
    case "ArrowUp":
      event.preventDefault()
      parts.input.focus()
      open(parts, "keyboard")
      break
    default:
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key.length === 1
      ) {
        parts.input.focus()
      }
  }
}

document.addEventListener("input", (event) => {
  const input = event.target
  if (
    !(input instanceof HTMLInputElement) ||
    !input.matches("[data-combobox-input]")
  )
    return
  const parts = comboboxOf(input)
  if (!parts || parts.input !== input) return
  const state = stateOf(parts)
  const query = input.value.trim()
  if (!parts.multiple && input.value === "" && state.values.length > 0) {
    clearValue(parts)
  }
  if (query !== "") state.queryChanged = true
  if (query !== "" && !isOpen(parts)) open(parts, "input")
  filter(parts)
  const autoHighlight = parts.field?.hasAttribute("data-auto-highlight")
  highlight(
    parts,
    autoHighlight && query !== "" ? (visibleItems(parts)[0] ?? null) : null
  )
})

document.addEventListener("mousedown", (event) => {
  const target = event.target
  if (!(target instanceof Element) || event.button !== 0) return
  const parts = comboboxOf(target)
  // Outside presses close open comboboxes.
  for (const popup of document.querySelectorAll(
    "[data-combobox-popup]:popover-open"
  )) {
    const other = comboboxOf(popup)
    if (other && other.id !== parts?.id) close(other)
  }
  if (!parts?.input) return
  const input = parts.input
  if (target.closest('[role="option"]')) {
    event.preventDefault()
  } else if (
    target.closest("[data-combobox-chip-remove], [data-combobox-clear]")
  ) {
    event.preventDefault()
  } else if (target.closest("[data-combobox-trigger]")) {
    event.preventDefault()
    input.focus()
  } else if (target === input) {
    stateOf(parts).keyboard = false
    if (!isOpen(parts)) {
      open(parts, "pointer")
      highlight(parts, initialItem(parts, null))
    }
  } else if (
    target.closest("[data-combobox-chips]") &&
    !target.closest("[data-combobox-chip]")
  ) {
    event.preventDefault()
    input.focus()
    if (!isOpen(parts)) open(parts, "pointer")
  }
})

document.addEventListener("click", (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  const parts = comboboxOf(target)
  if (!parts?.input) return
  const item = target.closest('[role="option"]')
  const remove = target.closest("[data-combobox-chip-remove]")
  if (item instanceof HTMLElement && parts.list?.contains(item)) {
    select(parts, item)
  } else if (remove) {
    const chip = remove.closest("[data-combobox-chip]")
    const index =
      chip instanceof HTMLElement ? chipsOf(parts).indexOf(chip) : -1
    if (index !== -1) removeValue(parts, index)
  } else if (target.closest("[data-combobox-clear]")) {
    parts.input.value = ""
    highlight(parts, null)
    clearValue(parts)
    filter(parts)
    parts.input.focus()
  } else if (target.closest("[data-combobox-trigger]")) {
    const state = stateOf(parts)
    if (!isOpen(parts)) {
      open(parts, "pointer")
      highlight(parts, initialItem(parts, null))
    } else if (state.reason === "pointer") {
      close(parts)
    }
  }
})

// Hovering an item highlights it; leaving the items clears the highlight.
document.addEventListener("mousemove", (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  const item = target.closest('[role="option"]')
  const parts = comboboxOf(item)
  if (!parts || !(item instanceof HTMLElement) || item.hidden) return
  stateOf(parts).keyboard = false
  if (!item.hasAttribute("data-highlighted")) highlight(parts, item)
})

document.addEventListener(
  "mouseout",
  (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const item = target.closest('[role="option"]')
    const parts = comboboxOf(item)
    if (!parts || stateOf(parts).keyboard) return
    const to = event.relatedTarget
    if (to instanceof Element && to.closest('[role="option"]')) return
    if (to instanceof Node && item?.contains(to)) return
    highlight(parts, null)
  },
  true
)

// Focus moving out of the combobox (Tab) closes it.
document.addEventListener("focusout", (event) => {
  const input = event.target
  if (
    !(input instanceof HTMLInputElement) ||
    !input.matches("[data-combobox-input]")
  )
    return
  const parts = comboboxOf(input)
  const to = event.relatedTarget
  if (!parts || !isOpen(parts)) return
  if (to instanceof Element && comboboxOf(to)?.id === parts.id) return
  if (to === null) return
  close(parts)
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
