/**
 * Base UI's Select on a customizable native `<select>` (`appearance:
 * base-select`): the trigger is the `<select>` with a `<button>` showing
 * `<selectedcontent>`, items are `<option>`s, and the popup's classes style
 * the browser's picker (`::picker(select)`), which CSS anchor positioning
 * places next to the select. Opening, keyboard selection, typeahead and form
 * submission come from the browser, so no JavaScript ships. Browsers without
 * customizable selects show a classic `<select>` with the trigger's styles.
 *
 * The options must be inside the `<select>`, so the root hands the content
 * element to the trigger, which renders it after its button.
 */
import { Node, SyntaxKind } from "ts-morph"
import { POPUP_STATE_VARIANTS } from "./dialog"
import type { FamilyRule } from "./types"
import {
  forEachPart,
  insertHelpers,
  partClasses,
  replacePartTypes,
  splitVariants,
} from "./util"

const PICKER = "[&::picker(select)]"

/** Popup positioning handled by anchor positioning in the top layer. */
const POPUP_POSITIONING = /^(relative|absolute|fixed|isolate|z-.*)$/

/**
 * Popup classes for the picker: `data-open:`/`data-closed:` become the
 * select's `open:`/`not-open:` state, `data-[side=…]:` reads the select's
 * `data-side`, and alignment with the trigger (not supported) is dropped.
 */
export function mapPickerClasses(classes: string): string {
  const mapped: string[] = []
  for (const token of classes.split(/\s+/).filter(Boolean)) {
    const parts = splitVariants(token)
    const utility = parts.pop() as string
    if (parts.some((v) => v.startsWith("data-[align-trigger="))) continue
    if (parts.length === 0 && POPUP_POSITIONING.test(utility)) continue
    const variants = parts.map((v) => POPUP_STATE_VARIANTS[v] ?? v)
    mapped.push([...variants, PICKER, utility].join(":"))
  }
  return mapped.join(" ")
}

/**
 * Trigger classes on the `<select>`: its button is `display: contents`, so
 * child variants (`*:`) reach the value one level deeper, and the placeholder
 * state is the placeholder option being selected.
 */
export function mapTriggerClasses(classes: string): string {
  return classes
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const parts = splitVariants(token)
      const utility = parts.pop() as string
      const variants = parts.map((v) =>
        v === "*"
          ? "**"
          : v === "data-placeholder"
            ? "has-[option[data-placeholder]:checked]"
            : v
      )
      return [...variants, utility].join(":")
    })
    .join(" ")
}

/** Item state on the native option; the browser's checkmark is replaced by upstream's indicator. */
export function mapItemClasses(classes: string): string {
  const states: Readonly<Record<string, string>> = {
    "data-disabled": "disabled",
    "data-highlighted": "focus",
    "data-selected": "checked",
  }
  const mapped = classes
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const parts = splitVariants(token)
      const utility = parts.pop() as string
      return [...parts.map((v) => states[v] ?? v), utility].join(":")
    })
  // The browser's checkmark and disabled color give way to upstream's.
  return [...mapped, "[&::checkmark]:hidden", "disabled:text-inherit"].join(" ")
}

/** Customizable select, picker resets and placement read from CSS variables set by the root. */
export const SELECT_BASE = [
  "[appearance:base-select]",
  "[&::picker-icon]:hidden",
  `${PICKER}:[appearance:base-select]`,
  `${PICKER}:border-0`,
  `${PICKER}:p-0`,
  `${PICKER}:[margin:var(--select-picker-margin)]`,
  `${PICKER}:[position-area:var(--select-picker-area)]`,
  `${PICKER}:[position-try-fallbacks:flip-block]`,
  `${PICKER}:transition-[display,overlay]`,
  `${PICKER}:transition-discrete`,
].join(" ")

function helpers(o: {
  picker: string
  defaults: Readonly<Record<string, string>>
  content: string
  value: string
}): string {
  const defaults = Object.entries(o.defaults)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ")
  return `type SelectRootProps = {
  name?: string | undefined
  /** Value of the item that is selected on load. */
  defaultValue?: string | undefined
  value?: string | undefined
  disabled?: boolean | undefined
  required?: boolean | undefined
  form?: string | undefined
  children?: Child
}

type SelectSide = "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end"
type SelectAlign = "start" | "center" | "end"

type SelectPositionerProps = {
  side?: SelectSide | undefined
  align?: SelectAlign | undefined
  sideOffset?: number | undefined
  alignOffset?: number | undefined
  alignItemWithTrigger?: boolean | undefined
  class?: string | undefined
  children?: Child
}

type SelectValueProps = ComponentProps<"span"> & { placeholder?: Child }

type SelectItemProps = ComponentProps<"option"> & { value: string }

interface SelectContextValue {
  name: string | undefined
  value: string | undefined
  disabled: boolean
  required: boolean
  form: string | undefined
  content: Child
  side: SelectSide
  style: Record<string, string>
}

const SelectContext = createContext<SelectContextValue | null>(null)

function useSelectContext(): SelectContextValue {
  const context = useContext(SelectContext)
  if (!context) throw new Error("Select parts must be rendered inside <Select>")
  return context
}

/** Upstream defaults of ${o.content}'s placement props. */
const SELECT_CONTENT_DEFAULTS = { ${defaults} }

/** Upstream's popup classes, applied to the browser's picker. */
const SELECT_PICKER_CLASSES = ${JSON.stringify(`${SELECT_BASE} ${o.picker}`)}

/** First element with the given component or tag in a children tree. */
function findSelectElement(node: unknown, tag: unknown): JSXNode | undefined {
  for (const child of [node].flat(Number.POSITIVE_INFINITY)) {
    if (!isValidElement(child)) continue
    const element = child as JSXNode
    if (element.tag === tag) return element
    const found = findSelectElement(element.props.children, tag)
    if (found) return found
  }
  return undefined
}

/** CSS variables for the picker: placement like Base UI's positioner, and its size variables. */
function selectPickerStyle(p: {
  side: SelectSide
  align: SelectAlign
  sideOffset: number
  alignOffset: number
}): Record<string, string> {
  const block = p.side === "top" || p.side === "bottom"
  const logical = p.side === "inline-start" || p.side === "inline-end"
  const span = block
    ? { start: "span-x-end", center: "", end: "span-x-start" }[p.align]
    : logical
      ? { start: "span-block-end", center: "", end: "span-block-start" }[p.align]
      : { start: "span-y-end", center: "", end: "span-y-start" }[p.align]
  const offset = \`\${p.sideOffset}px\`
  const cross = \`\${p.alignOffset}px\`
  const margin = {
    top: \`0 0 \${offset} \${cross}\`,
    bottom: \`\${offset} 0 0 \${cross}\`,
    left: \`\${cross} \${offset} 0 0\`,
    right: \`\${cross} 0 0 \${offset}\`,
    "inline-start": \`\${cross} \${offset} 0 0\`,
    "inline-end": \`\${cross} 0 0 \${offset}\`,
  }[p.side]
  const edge = { start: "0%", center: "50%", end: "100%" }[p.align]
  const origin = {
    top: \`\${edge} 100%\`,
    bottom: \`\${edge} 0%\`,
    left: \`100% \${edge}\`,
    right: \`0% \${edge}\`,
    "inline-start": \`100% \${edge}\`,
    "inline-end": \`0% \${edge}\`,
  }[p.side]
  return {
    "--select-picker-area": [p.side, span].filter(Boolean).join(" "),
    "--select-picker-margin": margin,
    "--transform-origin": origin,
    "--anchor-width": "anchor-size(width)",
    "--available-height": "100%",
  }
}

/** Adds \`extra\` declarations to a string or object \`style\` prop (the prop wins). */
function withStyle(
  style: string | JSX.CSSProperties | undefined,
  extra: Record<string, string>
): string | JSX.CSSProperties {
  if (typeof style === "string") {
    const css = Object.entries(extra).map(([key, value]) => \`\${key}:\${value}\`)
    return [...css, style].join(";")
  }
  return { ...extra, ...style }
}

/**
 * Holds the selection and hands <${o.content}> to the trigger, which renders
 * it inside the native <select>.
 */
function SelectRootElement({
  name,
  defaultValue,
  value,
  disabled = false,
  required = false,
  form,
  children,
}: SelectRootProps) {
  const nodes = ([children] as unknown[]).flat(Number.POSITIVE_INFINITY) as unknown[]
  const content = nodes.find(
    (node) => isValidElement(node) && (node as JSXNode).tag === ${o.content}
  ) as JSXNode | undefined
  if (!content) throw new Error("<${o.content}> must be a child of <Select>")
  const placement = { ...SELECT_CONTENT_DEFAULTS }
  for (const [key, prop] of Object.entries(content.props)) {
    if (key in placement && prop !== undefined) Object.assign(placement, { [key]: prop })
  }
  return (
    <SelectContext.Provider
      value={{
        name,
        value: value ?? defaultValue,
        disabled,
        required,
        form,
        content,
        side: placement.side as SelectSide,
        style: selectPickerStyle(placement as Parameters<typeof selectPickerStyle>[0]),
      }}
    >
      {nodes.filter((node) => node !== content) as Child[]}
    </SelectContext.Provider>
  )
}

/** The \`<selectedcontent>\` element (not yet in Hono's JSX types) mirrors the selected option. */
const SelectedContent = "selectedcontent" as "span"

/** The native select: its button shows the value, then a placeholder option and the items. */
function SelectTriggerElement({
  class: className,
  style,
  children,
  ...props
}: ComponentProps<"div">) {
  const select = useSelectContext()
  const placeholder = findSelectElement(children, ${o.value})?.props.placeholder
  return (
    <select
      name={select.name}
      disabled={select.disabled || undefined}
      required={select.required || undefined}
      form={select.form}
      data-side={select.side}
      style={withStyle(style, select.style)}
      class={cn(SELECT_PICKER_CLASSES, className)}
      {...props}
    >
      <button type="button" class="contents">
        {children}
      </button>
      <option
        value=""
        disabled
        hidden
        selected={select.value === undefined || undefined}
        data-placeholder=""
      >
        {placeholder as Child}
      </option>
      {select.content}
    </select>
  )
}

function SelectValueElement({
  placeholder: _placeholder,
  children: _children,
  ...props
}: SelectValueProps) {
  return <SelectedContent {...props} />
}

/** Portal, positioner, popup and list: the picker is the browser's, styled by the select. */
function SelectPassthrough({ children }: { children?: Child; [prop: string]: unknown }) {
  return <>{children}</>
}

function SelectItemElement({ value, ...props }: SelectItemProps) {
  const select = useContext(SelectContext)
  return <option value={value} selected={select?.value === value || undefined} {...props} />
}

/**
 * Upstream's indicator, shown only inside the selected option and not in the
 * select's value (Base UI does not render it otherwise, so upstream's
 * \`*:[span]:last:flex\` on the item must not win).
 */
function SelectItemIndicatorElement({
  render,
  ...props
}: ComponentProps<"span", RenderProp>) {
  return renderElement(
    <span class="in-[option:not(:checked)]:hidden! in-[selectedcontent]:hidden!" {...props} />,
    render
  )
}`
}

const PASSTHROUGH = new Set(["Portal", "Positioner", "Popup", "List"])

const TYPES: Readonly<Record<string, string>> = {
  Root: "SelectRootProps",
  // Generic attributes: upstream's \`size\` variant would clash with the select's.
  Trigger: 'ComponentProps<"div">',
  Value: "SelectValueProps",
  Icon: 'ComponentProps<"span">',
  Portal: "{ children?: Child }",
  Positioner: "SelectPositionerProps",
  Popup: 'ComponentProps<"div">',
  List: 'ComponentProps<"div">',
  Group: 'ComponentProps<"optgroup">',
  GroupLabel: 'ComponentProps<"legend">',
  Item: "SelectItemProps",
  ItemText: 'ComponentProps<"span">',
  ItemIndicator: 'ComponentProps<"span", RenderProp>',
  Separator: 'ComponentProps<"hr">',
  ScrollUpArrow: 'ComponentProps<"div">',
  ScrollDownArrow: 'ComponentProps<"div">',
}

export const selectFamily: FamilyRule = {
  module: "@base-ui/react/select",
  exportName: "Select",
  kind: "native",
  domParity: "native-structure",
  renderableParts: ["ItemIndicator", "Icon"],
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/select",
  notes: [
    "Built on a customizable native `<select>` (`appearance: base-select`): no JavaScript, keyboard selection and typeahead are the browser's (Space and the arrow keys open it, Enter does not), and `name`/`value` are submitted with forms. Chrome 135, Firefox 149 and Safari 27 or later show upstream's design; older browsers show a classic select with the trigger's styles.",
    "`SelectTrigger` renders the `<select>` (so `id` and `aria-*` given to it reach the form control), and `<SelectContent>` must be a direct child of `<Select>`. `value`/`defaultValue` set the initial selection; `onValueChange`, `multiple`, `items`, value render functions and aligning the selected item with the trigger (`alignItemWithTrigger`) are not supported: the list opens below the trigger. Classes given to `SelectContent` are not applied to the list.",
  ],
  transform(ctx, local) {
    const step = "family:Select"
    replacePartTypes(ctx, step, local, TYPES)
    // `const Select = SelectPrimitive.Root` and similar value references.
    const refs = ctx.sf
      .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
      .filter(
        (access) =>
          access.getExpression().getText() === local &&
          access.getName() === "Root" &&
          !Node.isJsxOpeningElement(access.getParent()) &&
          !Node.isJsxSelfClosingElement(access.getParent()) &&
          !Node.isJsxClosingElement(access.getParent())
      )
    for (const ref of refs.reverse()) ref.replaceWithText("SelectRootElement")

    const picker = partClasses(ctx, local, "Popup")
      .map(mapPickerClasses)
      .join(" ")
    const names: Record<string, string> = {}
    let defaults: Record<string, string> = {}
    forEachPart(ctx, local, (element) => {
      const part = element.part
      if (!(part in TYPES)) {
        throw new Error(`[${ctx.name}] ${step}: unknown part ${local}.${part}`)
      }
      names[part] = element.component
      const attrs = () => element.attributes().join(" ")
      const wrap = (tag: string) =>
        element.children
          ? `<${tag} ${attrs()}>${element.children}</${tag}>`
          : `<${tag} ${attrs()} />`
      if (part === "Positioner") {
        defaults = positionerDefaults(ctx, element.component, element)
        element.replace(wrap("SelectPassthrough"))
      } else if (PASSTHROUGH.has(part)) {
        element.replace(wrap("SelectPassthrough"))
      } else if (part === "Trigger") {
        element.mapClasses(mapTriggerClasses)
        element.replace(wrap("SelectTriggerElement"))
      } else if (part === "Value") {
        element.replace(wrap("SelectValueElement"))
      } else if (part === "Icon") {
        element.replace(element.attribute("render") ?? wrap("span"))
      } else if (part === "Group") {
        element.replace(wrap("optgroup"))
      } else if (part === "GroupLabel") {
        element.replace(wrap("legend"))
      } else if (part === "Item") {
        element.mapClasses(mapItemClasses)
        element.replace(wrap("SelectItemElement"))
      } else if (part === "ItemText") {
        element.replace(wrap("span"))
      } else if (part === "ItemIndicator") {
        element.replace(wrap("SelectItemIndicatorElement"))
      } else if (part === "Separator") {
        // Preflight gives <hr> a top border; upstream's separator is a filled box.
        element.mapClasses((classes) => `${classes} border-0`)
        element.replace(wrap("hr"))
      } else {
        // Scroll arrows: the browser's picker scrolls by itself.
        const component = element.component
        element.replace("null")
        ctx.sf
          .getFunctionOrThrow(component)
          .getParameters()[0]
          ?.replaceWithText('_props: ComponentProps<"div">')
      }
    })
    for (const part of ["Trigger", "Value", "Popup", "Positioner"]) {
      if (!names[part]) {
        throw new Error(`[${ctx.name}] ${step}: no ${local}.${part} element`)
      }
    }
    insertHelpers(
      ctx,
      helpers({
        picker,
        defaults,
        content: names.Popup as string,
        value: names.Value as string,
      })
    )
    ctx.needsComponentProps = true
    ctx.needsRender = true
    ctx.honoTypes.add("Child")
    ctx.honoTypes.add("JSX")
    ctx.honoTypes.add("JSXNode")
    for (const value of ["createContext", "useContext", "isValidElement"]) {
      ctx.honoValues.add(value)
    }
    ctx.log.push(`${step}: ${local} on a customizable native select`)
  },
}

/**
 * Upstream defaults of the placement props the content passes to the
 * positioner (`side = "bottom"` in its parameter list), read from the
 * component's props pattern.
 */
function positionerDefaults(
  ctx: Parameters<FamilyRule["transform"]>[0],
  component: string,
  element: { attribute(name: string): string | null }
): Record<string, string> {
  const param = ctx.sf.getFunction(component)?.getParameters()[0]
  const pattern = param?.getNameNode()
  const initializers = new Map<string, string>()
  if (pattern && Node.isObjectBindingPattern(pattern)) {
    for (const binding of pattern.getElements()) {
      const init = binding.getInitializer()
      if (init) initializers.set(binding.getName(), init.getText())
    }
  }
  const defaults: Record<string, string> = {}
  for (const prop of ["side", "align", "sideOffset", "alignOffset"]) {
    const expr = element.attribute(prop)
    const value = expr ? (initializers.get(expr) ?? expr) : undefined
    if (value === undefined) {
      throw new Error(`[${ctx.name}] family:Select: no default for ${prop}`)
    }
    defaults[prop] = value
  }
  return defaults
}
