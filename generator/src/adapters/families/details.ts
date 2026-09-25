/**
 * Base UI's Accordion and Collapsible on the native `<details>`/`<summary>`
 * disclosure: toggling, keyboard activation, the expanded state for assistive
 * technology and find-in-page come from the browser, so no JavaScript ships.
 * Accordion items share a `name` (exclusive `<details>`, Baseline 2024) unless
 * `multiple` is set.
 *
 * `<details>` needs `<summary>` as its first child, so the structure differs
 * from Base UI's (`native-structure`): the item is the `<details>`, the
 * trigger is the `<summary>` and the header element is dropped.
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

/** Hides the disclosure marker; `list-none` for `display: list-item`, the pseudo-element for Safari. */
export const SUMMARY_RESET = "list-none [&::-webkit-details-marker]:hidden"

/** The open item is the `<summary>`'s parent `<details open>`. */
const TRIGGER_OPEN = "[[open]>&]"

/**
 * Maps the trigger's expanded state (`aria-expanded`, `data-panel-open`,
 * including `group-*` forms) to its parent `<details open>`.
 */
export function mapDisclosureClasses(classes: string): string {
  return classes
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const parts = splitVariants(token)
      const utility = parts.pop() as string
      const variants = parts.map((variant) => {
        const group = variant.match(
          /^group-(?:aria-expanded|data-panel-open)(\/.+)?$/
        )
        if (group) return `group-${TRIGGER_OPEN}${group[1] ?? ""}`
        if (variant === "aria-expanded" || variant === "data-panel-open") {
          return TRIGGER_OPEN
        }
        return variant
      })
      return [...variants, utility].join(":")
    })
    .join(" ")
}

/** Item state variants on the `<details>` element itself. */
export function mapItemClasses(classes: string): string {
  return classes
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const parts = splitVariants(token)
      const utility = parts.pop() as string
      const variants = parts.map((v) =>
        v === "data-open" ? "open" : v === "data-closed" ? "not-open" : v
      )
      return [...variants, utility].join(":")
    })
    .join(" ")
}

const TRANSITION_STATES = new Set([
  "data-open",
  "data-closed",
  "data-starting-style",
  "data-ending-style",
])

/**
 * Panel classes: a closed `<details>` hides its content, and open/close
 * animations (which measure the panel with JavaScript in Base UI) are dropped.
 */
export function mapPanelClasses(classes: string): string {
  return classes
    .split(/\s+/)
    .filter(Boolean)
    .filter(
      (token) => !splitVariants(token).some((v) => TRANSITION_STATES.has(v))
    )
    .join(" ")
}

function unknownPart(ctx: TransformContext, step: string, part: string): never {
  throw new Error(`[${ctx.name}] ${step}: unknown part ${part}`)
}

const ACCORDION_HELPERS = `type AccordionRootProps = ComponentProps<"div"> & {
  /** Values of the items that are open on load. */
  defaultValue?: readonly unknown[] | undefined
  /** Lets several items be open at once; otherwise opening one closes the others. */
  multiple?: boolean | undefined
  disabled?: boolean | undefined
}

type AccordionItemProps = ComponentProps<"details"> & {
  value?: unknown
  disabled?: boolean | undefined
}

interface AccordionContextValue {
  name: string | undefined
  openValues: readonly unknown[]
  disabled: boolean
}

const AccordionContext = createContext<AccordionContextValue>({
  name: undefined,
  openValues: [],
  disabled: false,
})

interface AccordionItemContextValue {
  triggerId: string
  panelId: string
  disabled: boolean
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null)

function useAccordionItemContext(): AccordionItemContextValue {
  const context = useContext(AccordionItemContext)
  if (!context) throw new Error("Accordion parts must be rendered inside an accordion item")
  return context
}

/** Items are native \`<details>\` sharing a \`name\` (one open at a time) unless \`multiple\`. */
function AccordionRootElement({
  defaultValue = [],
  multiple = false,
  disabled = false,
  ...props
}: AccordionRootProps) {
  const id = useId().replaceAll(":", "-")
  return (
    <AccordionContext.Provider
      value={{
        name: multiple ? undefined : \`accordion\${id}\`,
        openValues: defaultValue,
        disabled,
      }}
    >
      <div data-orientation="vertical" {...props} />
    </AccordionContext.Provider>
  )
}

function AccordionItemElement({ value, disabled, open, ...props }: AccordionItemProps) {
  const accordion = useContext(AccordionContext)
  const id = useId().replaceAll(":", "-")
  const isDisabled = accordion.disabled || disabled === true
  const isOpen = open ?? (value !== undefined && accordion.openValues.includes(value))
  return (
    <AccordionItemContext.Provider
      value={{
        triggerId: \`accordion\${id}-trigger\`,
        panelId: \`accordion\${id}-panel\`,
        disabled: isDisabled,
      }}
    >
      <details
        name={accordion.name}
        open={isOpen || undefined}
        data-orientation="vertical"
        data-disabled={isDisabled ? "" : undefined}
        {...props}
      />
    </AccordionItemContext.Provider>
  )
}

/** The \`<summary>\` toggles its \`<details>\`; disabled items cannot be focused or clicked. */
function AccordionTriggerElement({ class: className, ...props }: ComponentProps<"summary">) {
  const { triggerId, panelId, disabled } = useAccordionItemContext()
  return (
    <summary
      id={triggerId}
      aria-controls={panelId}
      aria-disabled={disabled ? "true" : undefined}
      tabindex={disabled ? -1 : undefined}
      data-orientation="vertical"
      class={className ? \`${SUMMARY_RESET} \${className}\` : "${SUMMARY_RESET}"}
      {...props}
    />
  )
}

function AccordionPanelElement(props: ComponentProps<"div">) {
  const { triggerId, panelId } = useAccordionItemContext()
  return (
    <div
      id={panelId}
      role="region"
      aria-labelledby={triggerId}
      data-orientation="vertical"
      {...props}
    />
  )
}`

const ACCORDION_PARTS = ["Root", "Item", "Header", "Trigger", "Panel"]

export const accordionFamily: FamilyRule = {
  module: "@base-ui/react/accordion",
  exportName: "Accordion",
  kind: "native",
  domParity: "native-structure",
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/accordion",
  notes: [
    "Built on native `<details>`/`<summary>`: no JavaScript. Items share a `name` so only one is open unless `multiple` is set (Baseline 2024: Chrome 120, Firefox 130, Safari 17.2).",
    "Controlled state (`value`, `onValueChange`) is not supported; `defaultValue` opens items by their `value`. The trigger is the `<summary>` (no `h3` around it; browsers expose the expanded state without `aria-expanded`), and arrow keys do not move between items.",
    "Opening and closing are not animated. Closed panels stay in the page, so find-in-page can reveal them.",
  ],
  transform(ctx, local) {
    const step = "family:Accordion"
    replacePartTypes(ctx, step, local, {
      Root: "AccordionRootProps",
      Item: "AccordionItemProps",
      Header: 'ComponentProps<"h3">',
      Trigger: 'ComponentProps<"summary">',
      Panel: 'ComponentProps<"div">',
    })
    mapFileClasses(ctx, mapDisclosureClasses)
    forEachPart(ctx, local, (element) => {
      if (!ACCORDION_PARTS.includes(element.part)) {
        unknownPart(ctx, step, `${local}.${element.part}`)
      }
      if (element.part === "Header") {
        // <summary> must be the first child of <details>, so no heading wraps it.
        element.replace(element.soleElementChild ?? `<>${element.children}</>`)
        return
      }
      if (element.part === "Item" && element.classes() !== null) {
        element.mapClasses(mapItemClasses)
      }
      if (element.part === "Panel" && element.classes() !== null) {
        element.mapClasses(mapPanelClasses)
      }
      const tag = `Accordion${element.part}Element`
      const attrs = element.attributes().join(" ")
      element.replace(
        element.children
          ? `<${tag} ${attrs}>${element.children}</${tag}>`
          : `<${tag} ${attrs} />`
      )
    })
    insertHelpers(ctx, ACCORDION_HELPERS)
    ctx.needsComponentProps = true
    for (const value of ["createContext", "useContext", "useId"]) {
      ctx.honoValues.add(value)
    }
    ctx.log.push(`${step}: ${local} on native <details>`)
  },
}

function collapsibleHelpers(root: string, trigger: string): string {
  return `type CollapsibleRootProps = ComponentProps<"details"> & {
  defaultOpen?: boolean | undefined
}

/**
 * A native \`<details>\`: \`<${trigger}>\` must be its first child (the
 * \`<summary>\`), and every other child is hidden while it is closed.
 */
function CollapsibleRootElement({
  defaultOpen = false,
  open,
  children,
  ...props
}: CollapsibleRootProps) {
  const [first] = [children]
    .flat(Number.POSITIVE_INFINITY)
    .filter((child) => child !== null && child !== undefined && child !== false && child !== "")
  if (!isValidElement(first) || (first as JSXNode).tag !== ${trigger}) {
    throw new Error("<${trigger}> must be the first child of <${root}>")
  }
  return (
    <details open={(open ?? defaultOpen) || undefined} {...props}>
      {children}
    </details>
  )
}

function CollapsibleTriggerElement({ class: className, ...props }: ComponentProps<"summary">) {
  return (
    <summary
      class={className ? \`${SUMMARY_RESET} \${className}\` : "${SUMMARY_RESET}"}
      {...props}
    />
  )
}`
}

const COLLAPSIBLE_PARTS = ["Root", "Trigger", "Panel"]

export const collapsibleFamily: FamilyRule = {
  module: "@base-ui/react/collapsible",
  exportName: "Collapsible",
  kind: "native",
  domParity: "native-structure",
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/collapsible",
  notes: [
    "Built on native `<details>`/`<summary>`: no JavaScript. `CollapsibleTrigger` must be the first child of `Collapsible` (rendering throws otherwise), and every other child is hidden while closed, not only `CollapsibleContent`.",
    "`CollapsibleTrigger` does not support `render`; style it with `class` (for example `buttonVariants()`). `open`/`defaultOpen` set the initial state; `onOpenChange` and `disabled` are not supported, and state attributes (`data-open`, `data-panel-open`) are not rendered (use `open:` variants).",
  ],
  transform(ctx, local) {
    const step = "family:Collapsible"
    replacePartTypes(ctx, step, local, {
      Root: "CollapsibleRootProps",
      Trigger: 'ComponentProps<"summary">',
      Panel: 'ComponentProps<"div">',
    })
    let root: string | undefined
    let trigger: string | undefined
    forEachPart(ctx, local, (element) => {
      if (!COLLAPSIBLE_PARTS.includes(element.part)) {
        unknownPart(ctx, step, `${local}.${element.part}`)
      }
      if (element.part === "Root") root = element.component
      if (element.part === "Trigger") trigger = element.component
      const tag =
        element.part === "Panel" ? "div" : `Collapsible${element.part}Element`
      const attrs = element.attributes().join(" ")
      element.replace(
        element.children
          ? `<${tag} ${attrs}>${element.children}</${tag}>`
          : `<${tag} ${attrs} />`
      )
    })
    if (!root || !trigger) {
      throw new Error(
        `[${ctx.name}] ${step}: no ${local}.Root or ${local}.Trigger component`
      )
    }
    insertHelpers(ctx, collapsibleHelpers(root, trigger))
    ctx.needsComponentProps = true
    ctx.honoValues.add("isValidElement")
    ctx.honoTypes.add("JSXNode")
    ctx.log.push(`${step}: ${local} on native <details>`)
  },
}
