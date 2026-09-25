/**
 * Base UI's form controls on native inputs: Checkbox, Switch and Radio keep
 * their styled `span` root with a real `<input>` inside (Base UI renders the
 * root as `role="checkbox"` and a hidden input next to it); Toggle becomes a
 * `label` around a visually hidden checkbox (or a radio in a single-selection
 * ToggleGroup). Checking, keyboard handling, labels and form submission come
 * from the browser, so no JavaScript ships.
 *
 * Base UI state attributes on the root (`data-checked`, `aria-pressed`, ...)
 * become `:has()` variants on the input, and state on inner parts becomes
 * `peer-*` variants (the input is their preceding sibling).
 */
import type { TransformContext } from "../../transformers/context"
import type { FamilyRule } from "./types"
import {
  forEachPart,
  insertHelpers,
  mapFileClasses,
  replacePartTypes,
  splitVariants,
} from "./util"

/** Root state, read from the input inside the root. */
const ROOT_STATE: Readonly<Record<string, string>> = {
  "data-checked": "has-checked",
  "data-unchecked": "not-has-checked",
  "not-data-checked": "not-has-checked",
  "not-data-unchecked": "has-checked",
  "aria-checked": "has-checked",
  "data-pressed": "has-checked",
  "aria-pressed": "has-checked",
  "data-[state=on]": "has-checked",
  "data-disabled": "has-disabled",
  "focus-visible": "has-focus-visible",
  focus: "has-focus",
  "aria-invalid": "has-aria-invalid",
}

/** State of parts after the input inside the root (indicator, thumb). */
const PART_STATE: Readonly<Record<string, string>> = {
  "data-checked": "peer-checked",
  "data-unchecked": "peer-not-checked",
  "not-data-checked": "peer-not-checked",
  "not-data-unchecked": "peer-checked",
  "data-disabled": "peer-disabled",
}

function mapVariants(
  classes: string,
  table: Readonly<Record<string, string>>
): string {
  return classes
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const parts = splitVariants(token)
      const utility = parts.pop() as string
      return [...parts.map((v) => table[v] ?? v), utility].join(":")
    })
    .join(" ")
}

/**
 * Root classes. `disabled:` only matched Base UI roots that were native
 * buttons (Toggle); on `span` roots it never matched and is kept as is.
 */
export function mapRootClasses(classes: string, wasButton = false): string {
  return mapVariants(
    classes,
    wasButton ? { ...ROOT_STATE, disabled: "has-disabled" } : ROOT_STATE
  )
}

export function mapPartClasses(classes: string): string {
  return mapVariants(classes, PART_STATE)
}

const HIT_AREA = /^(absolute|-?inset(-[xy])?-.+)$/

/**
 * Upstream enlarges the clickable area with an absolutely positioned
 * `::after` on the root. The input is the click target now, so it takes that
 * box instead (or the root's box when there is none).
 */
export function splitHitArea(classes: string): {
  root: string
  hitArea: string
} {
  const kept: string[] = []
  const area: string[] = []
  for (const token of classes.split(/\s+/).filter(Boolean)) {
    const parts = splitVariants(token)
    if (parts.length === 2 && parts[0] === "after") {
      const utility = parts[1] as string
      if (!HIT_AREA.test(utility)) {
        throw new Error(`control root: unexpected ::after class ${token}`)
      }
      area.push(utility)
    } else {
      kept.push(token)
    }
  }
  const hitArea = area.length > 0 ? area.join(" ") : "absolute inset-0"
  return { root: kept.join(" "), hitArea }
}

const CONTROL_HELPERS = `const CONTROL_INPUT_PROPS = new Set(["id", "name", "value", "disabled", "required", "form", "autofocus"])

/** Splits props between the native input (form and ARIA attributes) and the styled root. */
function splitControlProps(
  props: Record<string, unknown>
): [Record<string, unknown>, Record<string, unknown>] {
  const input: Record<string, unknown> = {}
  const root: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (CONTROL_INPUT_PROPS.has(key) || key.startsWith("aria-")) input[key] = value
    else root[key] = value
  }
  return [input, root]
}`

function checkableHelpers(
  prefix: string,
  role: string | undefined,
  hitArea: string
): string {
  const input = role
    ? `<input
        type="checkbox"
        // biome-ignore lint/a11y/useAriaPropsForRole: a native checkbox exposes its checked state
        role="${role}"`
    : `<input
        type="checkbox"`
  return `type ${prefix}RootProps = ComponentProps<"span"> & {
  checked?: boolean | undefined
  defaultChecked?: boolean | undefined
  disabled?: boolean | undefined
  required?: boolean | undefined
  name?: string | undefined
  value?: string | undefined
  form?: string | undefined
}

/** The styled root with a native checkbox inside, then the indicator or thumb. */
function ${prefix}RootElement({ checked, defaultChecked, children, ...props }: ${prefix}RootProps) {
  const [input, root] = splitControlProps(props)
  return (
    <span {...root}>
      ${input}
        checked={(checked ?? defaultChecked) || undefined}
        class="peer ${hitArea} m-0 appearance-none outline-none"
        {...input}
      />
      {children}
    </span>
  )
}`
}

/** Shared transform for Checkbox, Switch and Radio (root plus inner parts). */
function transformCheckable(
  ctx: TransformContext,
  local: string,
  o: {
    step: string
    prefix: string
    parts: Readonly<Record<string, string>>
    /** Parts rendered only while checked in Base UI. */
    checkedOnly: readonly string[]
    helpers: (hitArea: string) => string
  }
): void {
  replacePartTypes(ctx, o.step, local, {
    Root: `${o.prefix}RootProps`,
    ...Object.fromEntries(
      Object.keys(o.parts).map((part) => [part, 'ComponentProps<"span">'])
    ),
  })
  let hitArea: string | undefined
  forEachPart(ctx, local, (element) => {
    if (element.part === "Root") {
      element.mapClasses((classes) => {
        const split = splitHitArea(classes)
        hitArea = split.hitArea
        return mapRootClasses(split.root)
      })
      const tag = `${o.prefix}RootElement`
      const attrs = element.attributes().join(" ")
      element.replace(
        element.children
          ? `<${tag} ${attrs}>${element.children}</${tag}>`
          : `<${tag} ${attrs} />`
      )
      return
    }
    if (!(element.part in o.parts)) {
      throw new Error(
        `[${ctx.name}] ${o.step}: unknown part ${local}.${element.part}`
      )
    }
    element.mapClasses((classes) => {
      // Clicks must reach the input underneath; Base UI mounts some parts
      // only while checked.
      const mapped = mapPartClasses(classes).split(" ")
      const extra = [
        "pointer-events-none",
        ...(o.checkedOnly.includes(element.part)
          ? ["peer-not-checked:hidden"]
          : []),
      ].filter((token) => !mapped.includes(token))
      return [...mapped, ...extra].join(" ")
    })
    const attrs = element.attributes().join(" ")
    element.replace(
      element.children
        ? `<span ${attrs}>${element.children}</span>`
        : `<span ${attrs} />`
    )
  })
  if (!hitArea) {
    throw new Error(`[${ctx.name}] ${o.step}: no ${local}.Root element`)
  }
  insertHelpers(ctx, `${CONTROL_HELPERS}\n\n${o.helpers(hitArea)}`)
  ctx.needsComponentProps = true
  ctx.log.push(`${o.step}: ${local} on a native input`)
}

const CHECKBOX_NOTES = (control: string, input: string) => [
  `Built on a native ${input} inside the styled root: no JavaScript, and the value is submitted with forms. \`id\`, \`name\`, \`value\`, \`disabled\`, \`required\`, \`form\` and \`aria-*\` go to the input, so \`<Label for>\` works as usual.`,
  `\`checked\`/\`defaultChecked\` set the initial state; \`onCheckedChange\`, \`readOnly\`${control === "Checkbox" ? ", `indeterminate`" : ""} and \`render\` are not supported.`,
]

export const checkboxFamily: FamilyRule = {
  module: "@base-ui/react/checkbox",
  exportName: "Checkbox",
  kind: "native",
  domParity: "native-structure",
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/checkbox",
  notes: CHECKBOX_NOTES("Checkbox", '`<input type="checkbox">`'),
  transform(ctx, local) {
    transformCheckable(ctx, local, {
      step: "family:Checkbox",
      prefix: "Checkbox",
      parts: { Indicator: "span" },
      checkedOnly: ["Indicator"],
      helpers: (hitArea) => checkableHelpers("Checkbox", undefined, hitArea),
    })
  },
}

export const switchFamily: FamilyRule = {
  module: "@base-ui/react/switch",
  exportName: "Switch",
  kind: "native",
  domParity: "native-structure",
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/switch",
  notes: CHECKBOX_NOTES("Switch", '`<input type="checkbox" role="switch">`'),
  transform(ctx, local) {
    transformCheckable(ctx, local, {
      step: "family:Switch",
      prefix: "Switch",
      parts: { Thumb: "span" },
      checkedOnly: [],
      helpers: (hitArea) => checkableHelpers("Switch", "switch", hitArea),
    })
  },
}

export const radioFamily: FamilyRule = {
  module: "@base-ui/react/radio",
  exportName: "Radio",
  kind: "native",
  domParity: "native-structure",
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/radio",
  notes: [
    'Built on native `<input type="radio">` elements sharing the group\'s `name` (generated unless given): no JavaScript, arrow keys move the selection, and the value is submitted with forms. `id`, `disabled` and `aria-*` go to the input.',
  ],
  transform(ctx, local) {
    transformCheckable(ctx, local, {
      step: "family:Radio",
      prefix: "Radio",
      parts: { Indicator: "span" },
      checkedOnly: ["Indicator"],
      helpers: (hitArea) => `type RadioRootProps = ComponentProps<"span"> & {
  value: string
  disabled?: boolean | undefined
}

/** The styled root with a native radio of the enclosing group inside, then the indicator. */
function RadioRootElement({ value, disabled, children, ...props }: RadioRootProps) {
  const group = useContext(RadioGroupContext)
  const [input, root] = splitControlProps(props)
  return (
    <span {...root}>
      <input
        type="radio"
        name={group.name}
        value={value}
        checked={group.value === value || undefined}
        disabled={group.disabled || disabled || undefined}
        required={group.required || undefined}
        class="peer ${hitArea} m-0 appearance-none outline-none"
        {...input}
      />
      {children}
    </span>
  )
}`,
    })
    ctx.honoValues.add("useContext")
  },
}

const RADIO_GROUP_HELPERS = `type RadioGroupRootProps = ComponentProps<"div"> & {
  name?: string | undefined
  /** Value of the radio that is selected on load. */
  defaultValue?: string | undefined
  value?: string | undefined
  disabled?: boolean | undefined
  required?: boolean | undefined
}

interface RadioGroupContextValue {
  name: string | undefined
  value: string | undefined
  disabled: boolean
  required: boolean
}

const RadioGroupContext = createContext<RadioGroupContextValue>({
  name: undefined,
  value: undefined,
  disabled: false,
  required: false,
})

/** Radios in the group share a \`name\`, so the browser keeps one selected. */
function RadioGroupRootElement({
  name,
  defaultValue,
  value,
  disabled = false,
  required = false,
  ...props
}: RadioGroupRootProps) {
  const id = useId().replaceAll(":", "-")
  return (
    <RadioGroupContext.Provider
      value={{ name: name ?? \`radio-group\${id}\`, value: value ?? defaultValue, disabled, required }}
    >
      <div role="radiogroup" aria-required={required ? "true" : undefined} {...props} />
    </RadioGroupContext.Provider>
  )
}`

export const radioGroupFamily: FamilyRule = {
  module: "@base-ui/react/radio-group",
  exportName: "RadioGroup",
  kind: "native",
  domParity: "native-structure",
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/radio-group",
  notes: [
    "`value`/`defaultValue` set the initial selection; `onValueChange` and `readOnly` are not supported.",
  ],
  transform(ctx, local) {
    const step = "family:RadioGroup"
    replacePartTypes(ctx, step, local, { "": "RadioGroupRootProps" })
    forEachPart(ctx, local, (element) => {
      if (element.part !== "") {
        throw new Error(
          `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
        )
      }
      const attrs = element.attributes().join(" ")
      element.replace(
        element.children
          ? `<RadioGroupRootElement ${attrs}>${element.children}</RadioGroupRootElement>`
          : `<RadioGroupRootElement ${attrs} />`
      )
    })
    insertHelpers(ctx, RADIO_GROUP_HELPERS)
    ctx.needsComponentProps = true
    for (const value of ["createContext", "useContext", "useId"]) {
      ctx.honoValues.add(value)
    }
    ctx.log.push(`${step}: ${local} as a native radio group`)
  },
}

const TOGGLE_HELPERS = `type ToggleRootProps = ComponentProps<"label"> & {
  pressed?: boolean | undefined
  defaultPressed?: boolean | undefined
  disabled?: boolean | undefined
  name?: string | undefined
  value?: string | undefined
  form?: string | undefined
}

/** Set by a toggle group: its items are radios (or checkboxes with \`multiple\`) sharing a name. */
interface ToggleGroupItemContextValue {
  name: string
  multiple: boolean
  values: readonly string[]
  disabled: boolean
}

const ToggleGroupItemContext = createContext<ToggleGroupItemContextValue | null>(null)

/** A label around a visually hidden checkbox: pressing toggles it without JavaScript. */
function ToggleRootElement({
  pressed,
  defaultPressed,
  value,
  disabled,
  children,
  ...props
}: ToggleRootProps) {
  const group = useContext(ToggleGroupItemContext)
  const [input, root] = splitControlProps(props)
  const isPressed = group
    ? value !== undefined && group.values.includes(value)
    : (pressed ?? defaultPressed ?? false)
  return (
    <label {...root}>
      <input
        type={group && !group.multiple ? "radio" : "checkbox"}
        name={group?.name}
        value={value}
        checked={isPressed || undefined}
        disabled={group?.disabled || disabled || undefined}
        class="peer sr-only"
        {...input}
      />
      {children}
    </label>
  )
}`

export const toggleFamily: FamilyRule = {
  module: "@base-ui/react/toggle",
  exportName: "Toggle",
  kind: "native",
  domParity: "native-structure",
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/toggle",
  notes: [
    "A `label` around a visually hidden native checkbox (the pressed state is its checked state): no JavaScript, and `name`/`value` are submitted with forms. `aria-*` goes to the input, so icon-only toggles need `aria-label` as upstream.",
    "Space toggles, Enter does not (a checkbox, not a button); `pressed`/`defaultPressed` set the initial state; `onPressedChange` and `render` are not supported.",
  ],
  transform(ctx, local) {
    const step = "family:Toggle"
    replacePartTypes(ctx, step, local, { "": "ToggleRootProps" })
    mapFileClasses(ctx, (classes) => mapRootClasses(classes, true))
    forEachPart(ctx, local, (element) => {
      if (element.part !== "") {
        throw new Error(
          `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
        )
      }
      const attrs = element.attributes().join(" ")
      element.replace(
        element.children
          ? `<ToggleRootElement ${attrs}>${element.children}</ToggleRootElement>`
          : `<ToggleRootElement ${attrs} />`
      )
    })
    insertHelpers(ctx, `${CONTROL_HELPERS}\n\n${TOGGLE_HELPERS}`)
    ctx.needsComponentProps = true
    ctx.honoValues.add("createContext")
    ctx.honoValues.add("useContext")
    ctx.log.push(`${step}: ${local} as a label with a native checkbox`)
  },
}

const TOGGLE_GROUP_HELPERS = `type ToggleGroupRootProps = ComponentProps<"div"> & {
  name?: string | undefined
  /** Values of the items that are pressed on load. */
  defaultValue?: readonly string[] | undefined
  /** Lets several items be pressed; otherwise the items are radios. */
  multiple?: boolean | undefined
  disabled?: boolean | undefined
}

function ToggleGroupRootElement({
  name,
  defaultValue = [],
  multiple = false,
  disabled = false,
  ...props
}: ToggleGroupRootProps) {
  const id = useId().replaceAll(":", "-")
  return (
    <ToggleGroupItemContext.Provider
      value={{ name: name ?? \`toggle-group\${id}\`, multiple, values: defaultValue, disabled }}
    >
      <div role="group" {...props} />
    </ToggleGroupItemContext.Provider>
  )
}`

export const toggleGroupFamily: FamilyRule = {
  module: "@base-ui/react/toggle-group",
  exportName: "ToggleGroup",
  kind: "native",
  domParity: "native-structure",
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/toggle-group",
  notes: [
    "Items are native radios sharing a `name` (checkboxes with `multiple`): the pressed item of a single-selection group cannot be released by pressing it again, and arrow keys select as they move. `defaultValue` sets the pressed items; `value`/`onValueChange` are not supported.",
  ],
  transform(ctx, local) {
    const step = "family:ToggleGroup"
    replacePartTypes(ctx, step, local, { "": "ToggleGroupRootProps" })
    forEachPart(ctx, local, (element) => {
      if (element.part !== "") {
        throw new Error(
          `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
        )
      }
      const attrs = element.attributes().join(" ")
      element.replace(
        element.children
          ? `<ToggleGroupRootElement ${attrs}>${element.children}</ToggleGroupRootElement>`
          : `<ToggleGroupRootElement ${attrs} />`
      )
    })
    insertHelpers(ctx, TOGGLE_GROUP_HELPERS)
    ctx.needsComponentProps = true
    ctx.honoValues.add("useId")
    ctx.log.push(`${step}: ${local} as a native radio or checkbox group`)
  },
}
