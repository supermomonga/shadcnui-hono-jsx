/**
 * Base UI's Combobox: the input (inside shadcn's InputGroup) and a native
 * popover listbox placed with CSS anchor positioning. The server renders the
 * items for \`items\` through the \`ComboboxList\` render function, the
 * selection and the form value; the client script \`public/shadcn/combobox.js\`
 * (docs/adr/0025) adds opening, filtering, highlighting with
 * \`aria-activedescendant\`, selection and chips, following Base UI.
 */

import { SyntaxKind } from "ts-morph"
import { ANCHORED_POPUP_RESET, insertAnchorHelpers } from "./anchor"
import { mapPopupClasses } from "./dialog"
import type { FamilyRule } from "./types"
import {
  forEachPart,
  helperEntries,
  registerHelpers,
  replacePartTypes,
} from "./util"

const HELPERS = `/** Renders list content for each item (\`ComboboxList\`, \`ComboboxCollection\`). */
type ComboboxItemRenderer = {
  bivarianceHack(item: unknown, index: number): Child
}["bivarianceHack"]

/** Renders the selected value(s) (\`ComboboxValue\`). */
type ComboboxValueRenderer = {
  bivarianceHack(value: unknown): Child
}["bivarianceHack"]

/** Converts an item to a string (\`itemToStringLabel\`, \`itemToStringValue\`). */
type ComboboxItemToString = {
  bivarianceHack(item: unknown): string
}["bivarianceHack"]

type ComboboxRootProps = {
  id?: string | undefined
  /** The items passed to \`ComboboxList\` render functions: values, or groups with \`items\`. */
  items?: readonly unknown[] | undefined
  value?: unknown
  defaultValue?: unknown
  /** Select several values, shown as chips. */
  multiple?: boolean | undefined
  name?: string | undefined
  form?: string | undefined
  disabled?: boolean | undefined
  required?: boolean | undefined
  /** Highlight the first match while typing. */
  autoHighlight?: boolean | undefined
  itemToStringLabel?: ComboboxItemToString | undefined
  itemToStringValue?: ComboboxItemToString | undefined
  children?: Child
}

interface ComboboxState {
  id: string
  anchor: string
  items: readonly unknown[]
  /** Whether \`items\` were given: only then the script filters them. */
  filtering: boolean
  selected: readonly unknown[]
  multiple: boolean
  disabled: boolean
  label: (item: unknown) => string
  value: (item: unknown) => string
  /** Items claim their index in render order (option ids). */
  rendered: number
}

const ComboboxContext = createContext<ComboboxState | null>(null)

function useComboboxContext(): ComboboxState {
  const context = useContext(ComboboxContext)
  if (!context) throw new Error("Combobox parts must be rendered inside <Combobox>")
  return context
}

/** Whether the item rendered inside is selected (for its indicator). */
const ComboboxItemContext = createContext(false)

/** The items of the enclosing group, for \`ComboboxCollection\`. */
const ComboboxGroupContext = createContext<{ labelId: string; items: readonly unknown[] | undefined } | null>(null)

/** The anchor passed to \`ComboboxContent\` (chips), instead of the input. */
const ComboboxAnchorContext = createContext<string | null>(null)

/** Base UI's label of an item: \`itemToStringLabel\`, an object's \`label\` or \`value\`, or the string. */
function comboboxLabel(item: unknown, convert?: ComboboxItemToString): string {
  if (convert && item != null) return convert(item) ?? ""
  if (item && typeof item === "object") {
    if ("label" in item && item.label != null) return String(item.label)
    if ("value" in item) return String(item.value)
  }
  return comboboxString(item)
}

/** Base UI's form value of an item: \`itemToStringValue\`, a \`{ label, value }\` object's value, or the string. */
function comboboxValue(item: unknown, convert?: ComboboxItemToString): string {
  if (convert && item != null) return convert(item) ?? ""
  if (item && typeof item === "object" && "value" in item && "label" in item) {
    return comboboxString(item.value)
  }
  return comboboxString(item)
}

function comboboxString(value: unknown): string {
  if (value == null) return ""
  return typeof value === "string" ? value : JSON.stringify(value)
}

/** Groups (\`{ items }\`) are flattened to their items. */
function comboboxLeaves(items: readonly unknown[]): unknown[] {
  return items.flatMap((item) =>
    item && typeof item === "object" && "items" in item && Array.isArray(item.items) ? item.items : [item]
  )
}

const COMBOBOX_HIDDEN_INPUT =
  "clip-path:inset(50%);overflow:hidden;white-space:nowrap;border:0;padding:0;width:1px;height:1px;margin:-1px;position:absolute"

/**
 * Holds the combobox state for its parts and renders the form value; the
 * client script \`/shadcn/combobox.js\` finds the parts by \`data-combobox\`.
 */
function ComboboxRootElement({
  id,
  items,
  value,
  defaultValue,
  multiple = false,
  name,
  form,
  disabled = false,
  required,
  autoHighlight = false,
  itemToStringLabel,
  itemToStringValue,
  children,
}: ComboboxRootProps) {
  const generated = useId().replaceAll(":", "-")
  const comboboxId = id ?? \`combobox\${generated}\`
  const initial = value === undefined ? defaultValue : value
  const selected: readonly unknown[] = multiple
    ? Array.isArray(initial)
      ? initial
      : []
    : initial == null
      ? []
      : [initial]
  const state: ComboboxState = {
    id: comboboxId,
    anchor: \`--\${comboboxId}\`,
    items: items ?? [],
    filtering: items !== undefined,
    selected,
    multiple,
    disabled,
    label: (item) => comboboxLabel(item, itemToStringLabel),
    value: (item) => comboboxValue(item, itemToStringValue),
    rendered: 0,
  }
  const values = selected.map(state.value)
  return (
    <ComboboxContext.Provider value={state}>
      {children}
      {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: Base UI's form input, out of the tab order and hidden from assistive technology */}
      <input
        tabindex={-1}
        aria-hidden="true"
        name={multiple ? undefined : name}
        form={form}
        value={multiple ? "" : (values[0] ?? "")}
        required={required}
        disabled={disabled || undefined}
        data-combobox-field={comboboxId}
        data-name={multiple ? name : undefined}
        data-values={multiple ? JSON.stringify(values) : undefined}
        data-multiple={multiple ? "" : undefined}
        data-auto-highlight={autoHighlight ? "" : undefined}
        data-filter={items ? "" : undefined}
        style={COMBOBOX_HIDDEN_INPUT}
      />
      {multiple && name
        ? values.map((item) => <input type="hidden" name={name} form={form} value={item} data-combobox-field={comboboxId} />)
        : null}
    </ComboboxContext.Provider>
  )
}

type ComboboxValueProps = {
  children?: Child | ComboboxValueRenderer
  placeholder?: Child
}

/**
 * The selected value: a render function's result (chips, with a template the
 * script copies for new chips) or the selected label.
 */
function ComboboxValueElement({ children, placeholder }: ComboboxValueProps) {
  const state = useComboboxContext()
  if (typeof children === "function") {
    const [sample] = comboboxLeaves(state.items)
    return (
      <span
        data-combobox-value={state.id}
        data-initial={state.multiple ? JSON.stringify(state.selected.map(state.value)) : undefined}
        style="display:contents"
      >
        {children(state.multiple ? state.selected : (state.selected[0] ?? null))}
        {state.multiple && sample !== undefined ? (
          <template data-label={state.label(sample)}>{children([sample])}</template>
        ) : null}
      </span>
    )
  }
  const label = state.selected.map(state.label).join(", ")
  return (
    <span
      data-combobox-value={state.id}
      data-placeholder={typeof placeholder === "string" ? placeholder : undefined}
      style="display:contents"
    >
      {children ?? (label || placeholder)}
    </span>
  )
}

function ComboboxTriggerElement({
  type = "button",
  render,
  ...props
}: ComponentProps<"button", RenderProp>) {
  const state = useComboboxContext()
  return renderElement(
    <button
      type={type}
      aria-expanded="false"
      aria-haspopup="listbox"
      disabled={state.disabled || undefined}
      data-combobox={state.id}
      data-combobox-trigger=""
      data-placeholder={state.selected.length === 0 ? "" : undefined}
      {...props}
    />,
    render
  )
}

/** Shown only while there is a value; the script keeps it in a template otherwise. */
function ComboboxClearElement({
  type = "button",
  render,
  ...props
}: ComponentProps<"button", RenderProp>) {
  const state = useComboboxContext()
  const button = renderElement(
    <button
      type={type}
      tabindex={-1}
      aria-label="Clear selection"
      disabled={state.disabled || undefined}
      data-combobox={state.id}
      data-combobox-clear=""
      {...props}
    />,
    render
  )
  return state.selected.length > 0 ? button : <template data-combobox-clear={state.id}>{button}</template>
}

function ComboboxInputElement({
  render,
  style,
  ...props
}: ComponentProps<"input", RenderProp>) {
  const state = useComboboxContext()
  return renderElement(
    <input
      id={\`\${state.id}-input\`}
      autocomplete="off"
      spellcheck={false}
      autocorrect="off"
      autocapitalize="none"
      role="combobox"
      aria-expanded="false"
      aria-haspopup="listbox"
      aria-autocomplete="list"
      value={state.multiple ? "" : state.selected.map(state.label).join("")}
      disabled={state.disabled || undefined}
      data-combobox={state.id}
      data-combobox-input=""
      style={withStyle(style, { "anchor-name": state.anchor })}
      {...props}
    />,
    render
  )
}

function ComboboxPortalElement({ children }: { children?: Child }) {
  return <>{children}</>
}

/** A CSS anchor shared by \`ComboboxChips\` (\`ref\`) and \`ComboboxContent\` (\`anchor\`). */
interface ComboboxAnchor {
  readonly name: string
}

function createComboboxAnchor(): ComboboxAnchor {
  return { name: \`--combobox-anchor\${useId().replaceAll(":", "-")}\` }
}

type ComboboxPositionerProps = AnchorPositionerProps & {
  anchor?: ComboboxAnchor | null | undefined
}

function ComboboxPositionerElement({ anchor, ...props }: ComboboxPositionerProps) {
  return (
    <ComboboxAnchorContext.Provider value={anchor?.name ?? null}>
      <AnchorPositioner {...props} />
    </ComboboxAnchorContext.Provider>
  )
}

function ComboboxPopupElement({ style, ...props }: ComponentProps<"div">) {
  const state = useComboboxContext()
  const placement = useContext(AnchorPlacementContext)
  const anchor = useContext(ComboboxAnchorContext) ?? state.anchor
  return (
    <div
      id={\`\${state.id}-popup\`}
      popover="manual"
      role="presentation"
      data-side={placement.side}
      data-align={placement.align}
      data-combobox={state.id}
      data-combobox-popup=""
      style={withStyle(style, anchorPlacementStyle(anchor, placement))}
      {...props}
    />
  )
}

type ComboboxListProps = ComponentProps<"div"> & {
  children?: Child | ComboboxItemRenderer
}

function ComboboxListElement({ children, ...props }: ComboboxListProps) {
  const state = useComboboxContext()
  return (
    <div
      id={\`\${state.id}-list\`}
      role="listbox"
      tabindex={-1}
      aria-multiselectable={state.multiple ? "true" : undefined}
      {...props}
    >
      {typeof children === "function" ? state.items.map((item, index) => children(item, index)) : children}
    </div>
  )
}

type ComboboxItemProps = ComponentProps<"div", RenderProp> & {
  value?: unknown
  disabled?: boolean | undefined
}

function ComboboxItemElement({ value, disabled, render, ...props }: ComboboxItemProps) {
  const state = useComboboxContext()
  const index = state.rendered++
  const itemValue = state.value(value)
  const selected = state.selected.some((item) => state.value(item) === itemValue)
  return (
    <ComboboxItemContext.Provider value={selected}>
      {renderElement(
        <div
          id={\`\${state.id}-option-\${index}\`}
          role="option"
          aria-selected={selected ? "true" : "false"}
          aria-disabled={disabled ? "true" : undefined}
          data-selected={selected ? "" : undefined}
          data-disabled={disabled ? "" : undefined}
          data-value={itemValue}
          data-label={state.label(value)}
          {...props}
        />,
        render
      )}
    </ComboboxItemContext.Provider>
  )
}

/** Rendered hidden unless its item is selected; the script toggles it. */
function ComboboxItemIndicatorElement({ render, ...props }: ComponentProps<"span", RenderProp>) {
  const selected = useContext(ComboboxItemContext)
  return renderElement(
    <span
      aria-hidden="true"
      hidden={!selected}
      data-selected={selected ? "" : undefined}
      data-combobox-indicator=""
      {...props}
    />,
    render
  )
}

type ComboboxGroupProps = ComponentProps<"div"> & {
  /** The group's items, for \`ComboboxCollection\`. */
  items?: readonly unknown[] | undefined
}

function ComboboxGroupElement({ items, ...props }: ComboboxGroupProps) {
  const labelId = \`\${useComboboxContext().id}-group\${useId().replaceAll(":", "-")}\`
  return (
    <ComboboxGroupContext.Provider value={{ labelId, items }}>
      <div role="group" aria-labelledby={labelId} {...props} />
    </ComboboxGroupContext.Provider>
  )
}

function ComboboxGroupLabelElement(props: ComponentProps<"div">) {
  return <div id={useContext(ComboboxGroupContext)?.labelId} {...props} />
}

function ComboboxCollectionElement({ children }: { children?: Child | ComboboxItemRenderer }) {
  const state = useComboboxContext()
  const items = useContext(ComboboxGroupContext)?.items ?? state.items
  return <>{typeof children === "function" ? items.map((item, index) => children(item, index)) : children}</>
}

/** Its content shows while no item matches; the script copies it from the template. */
function ComboboxEmptyElement({ children, ...props }: ComponentProps<"div">) {
  const state = useComboboxContext()
  const empty = state.filtering && state.items.length === 0
  return (
    <div role="status" aria-live="polite" aria-atomic="true" data-combobox-empty="" {...props}>
      <template>{children}</template>
      {empty ? children : null}
    </div>
  )
}

function ComboboxSeparatorElement(props: ComponentProps<"div">) {
  return <div role="separator" aria-orientation="horizontal" {...props} />
}

type ComboboxChipsProps = ComponentProps<"div"> & {
  /** From \`useComboboxAnchor()\`: places \`ComboboxContent\` under the chips. */
  ref?: ComboboxAnchor | null | undefined
}

function ComboboxChipsElement({ ref, style, ...props }: ComboboxChipsProps) {
  const state = useComboboxContext()
  return (
    <div
      role="toolbar"
      data-combobox={state.id}
      data-combobox-chips=""
      style={ref ? withStyle(style, { "anchor-name": ref.name }) : style}
      {...props}
    />
  )
}

function ComboboxChipElement(props: ComponentProps<"div">) {
  return <div tabindex={-1} data-combobox-chip="" {...props} />
}

function ComboboxChipRemoveElement({
  type = "button",
  render,
  ...props
}: ComponentProps<"button", RenderProp>) {
  return renderElement(
    <button type={type} tabindex={-1} aria-label="Remove" data-combobox-chip-remove="" {...props} />,
    render
  )
}`

const HELPER_ENTRIES = helperEntries(HELPERS)

const PART_TYPES: Readonly<Record<string, string>> = {
  Root: "ComboboxRootProps",
  Value: "ComboboxValueProps",
  Trigger: 'ComponentProps<"button", RenderProp>',
  Clear: 'ComponentProps<"button", RenderProp>',
  Input: 'ComponentProps<"input", RenderProp>',
  Portal: "{ children?: Child }",
  Positioner: "ComboboxPositionerProps",
  Popup: 'ComponentProps<"div">',
  List: "ComboboxListProps",
  Item: "ComboboxItemProps",
  ItemIndicator: 'ComponentProps<"span", RenderProp>',
  Group: "ComboboxGroupProps",
  GroupLabel: 'ComponentProps<"div">',
  Collection: "{ children?: Child | ComboboxItemRenderer }",
  Empty: 'ComponentProps<"div">',
  Separator: 'ComponentProps<"div">',
  Chips: "ComboboxChipsProps",
  Chip: 'ComponentProps<"div">',
  ChipRemove: 'ComponentProps<"button", RenderProp>',
}

const tagOf = (part: string) => `Combobox${part}Element`

export const comboboxFamily: FamilyRule = {
  module: "@base-ui/react",
  exportName: "Combobox",
  kind: "script",
  behaviors: ["combobox"],
  domParity: "native-structure",
  renderableParts: [
    "Trigger",
    "Clear",
    "Input",
    "Item",
    "ItemIndicator",
    "ChipRemove",
  ],
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/combobox",
  notes: [
    'Opening, filtering, keyboard highlighting and selection need the client script `/shadcn/combobox.js` (`<script type="module" src="/shadcn/combobox.js">`); without it the input shows the initial selection and the form submits the initial value. The list is a native popover placed with CSS anchor positioning.',
    "Items come from `items` and the `ComboboxList` render function (or static children); values are compared by their string form (`itemToStringValue`, a `{ label, value }` object's value, or the string). Filtering follows Base UI's default (contains, ignoring case, accents and punctuation); `filter`, `limit`, `filteredItems` and `inline` are not supported. New chips of a multiple combobox are copied from the `ComboboxValue` render function's output for the first item, with its label replaced. Controlled state (`open`, `onValueChange`, `inputValue`) is not supported.",
  ],
  transform(ctx, local) {
    const step = "family:Combobox"
    replacePartTypes(ctx, step, local, PART_TYPES)
    forEachPart(ctx, local, (element) => {
      if (!(element.part in PART_TYPES)) {
        throw new Error(
          `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
        )
      }
      if (element.part === "Popup") {
        element.mapClasses(mapPopupClasses, [ANCHORED_POPUP_RESET])
      }
      const tag = tagOf(element.part)
      const attrs = element.attributes().join(" ")
      element.replace(
        element.children
          ? `<${tag} ${attrs}>${element.children}</${tag}>`
          : `<${tag} ${attrs} />`
      )
    })
    // `const Combobox = ComboboxPrimitive.Root` and similar aliases.
    for (const access of ctx.sf
      .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
      .reverse()) {
      if (access.getExpression().getText() !== local) continue
      if (access.getParent()?.isKind(SyntaxKind.PropertyAccessExpression))
        continue
      const part = access.getName()
      if (!(part in PART_TYPES)) {
        throw new Error(`[${ctx.name}] ${step}: unknown part ${local}.${part}`)
      }
      access.replaceWithText(tagOf(part))
    }
    registerHelpers(ctx, HELPER_ENTRIES)
    insertAnchorHelpers(ctx)
    ctx.needsComponentProps = true
    ctx.needsRender = true
    ctx.log.push(
      `${step}: ${local} on a native popover with the combobox script`
    )
  },
}
