/**
 * Base UI's Tooltip and PreviewCard (hover cards): a manual native popover
 * anchored to its trigger with CSS anchor positioning. Hover and focus
 * intent (delays, keeping the popup open while it is hovered, Escape) come
 * from the client script `public/shadcn/hover.js` (docs/adr/0025): without
 * it the popup never opens, and a tooltip stays available to assistive
 * technology through the trigger's `aria-describedby`.
 */
import { ANCHORED_POPUP_RESET, insertAnchorHelpers } from "./anchor"
import { mapPopupClasses } from "./dialog"
import type { FamilyRule } from "./types"
import {
  forEachPart,
  helperEntries,
  registerHelpers,
  replacePartTypes,
} from "./util"

const SHARED = `type HoverRootProps = {
  id?: string | undefined
  /** Milliseconds before the popup opens on hover. */
  delay?: number | undefined
  /** Milliseconds before the popup closes after the pointer leaves. */
  closeDelay?: number | undefined
  children?: Child
}

interface HoverContextValue {
  id: string
  anchor: string
  delay: number | undefined
  closeDelay: number | undefined
}

const HoverContext = createContext<HoverContextValue | null>(null)

function useHoverContext(): HoverContextValue {
  const context = useContext(HoverContext)
  if (!context) throw new Error("Tooltip and hover card parts must be rendered inside their root")
  return context
}

/** Delays set by a tooltip provider for the tooltips inside it. */
const HoverDelayContext = createContext<{ delay?: number | undefined; closeDelay?: number | undefined }>({})

function HoverProviderElement({ delay, closeDelay, children }: HoverRootProps) {
  return (
    <HoverDelayContext.Provider value={{ delay, closeDelay }}>{children}</HoverDelayContext.Provider>
  )
}

function HoverRootElement({ id, delay, closeDelay, children }: HoverRootProps) {
  const generated = useId().replaceAll(":", "-")
  const provided = useContext(HoverDelayContext)
  const popupId = id ?? \`hover\${generated}\`
  return (
    <HoverContext.Provider
      value={{
        id: popupId,
        anchor: \`--\${popupId}\`,
        delay: delay ?? provided.delay ?? HOVER_DEFAULTS.delay,
        closeDelay: closeDelay ?? provided.closeDelay ?? HOVER_DEFAULTS.closeDelay,
      }}
    >
      {children}
    </HoverContext.Provider>
  )
}

/** Hover state for the script: the popup to open and its delays. */
function hoverTriggerAttributes(hover: HoverContextValue, style: string | JSX.CSSProperties | undefined) {
  return {
    "data-hover-popup": hover.id,
    "data-delay": hover.delay === undefined ? undefined : String(hover.delay),
    "data-close-delay": hover.closeDelay === undefined ? undefined : String(hover.closeDelay),
    style: withStyle(style, { "anchor-name": hover.anchor }),
  }
}

function HoverPortalElement({ children }: { children?: Child }) {
  return <>{children}</>
}

/** The arrow sits centered on the popup's edge toward the trigger. */
function HoverArrowElement({ style, ...props }: ComponentProps<"div">) {
  const placement = useContext(AnchorPlacementContext)
  const block = placement.side === "top" || placement.side === "bottom"
  return (
    <div
      aria-hidden="true"
      data-side={placement.side}
      data-align={placement.align}
      style={withStyle(style, {
        position: "absolute",
        ...(block ? { left: "0", right: "0", "margin-inline": "auto" } : {}),
      })}
      {...props}
    />
  )
}`

interface HoverFamilyOptions {
  module: string
  exportName: string
  prefix: string
  /** Base UI's default delays, in milliseconds. */
  delay: number
  closeDelay: number
  /** Default trigger element of the Base UI part. */
  triggerTag: "button" | "a"
  tooltip: boolean
  notes: readonly string[]
}

function helpers(o: HoverFamilyOptions): string {
  const P = o.prefix
  const trigger =
    o.triggerTag === "button"
      ? `function ${P}TriggerElement({
  type = "button",
  render,
  style,
  ...props
}: ComponentProps<"button", RenderProp>) {
  const hover = useHoverContext()
  return renderElement(
    <button
      type={type}
      ${o.tooltip ? "aria-describedby={hover.id}\n      " : ""}{...hoverTriggerAttributes(hover, style)}
      {...props}
    />,
    render
  )
}`
      : `function ${P}TriggerElement({ render, style, ...props }: ComponentProps<"a", RenderProp>) {
  const hover = useHoverContext()
  return renderElement(<a {...hoverTriggerAttributes(hover, style)} {...props} />, render)
}`
  return `/** Base UI's default delays for this component, in milliseconds. */
const HOVER_DEFAULTS = { delay: ${o.delay}, closeDelay: ${o.closeDelay} }

${trigger}

function ${P}PopupElement({ style, ...props }: ComponentProps<"div">) {
  const hover = useHoverContext()
  const placement = useContext(AnchorPlacementContext)
  return (
    <div
      id={hover.id}
      popover="manual"
      ${o.tooltip ? 'role="tooltip"\n      ' : ""}data-side={placement.side}
      data-align={placement.align}
      style={withStyle(style, anchorPlacementStyle(hover.anchor, placement))}
      {...props}
    />
  )
}`
}

function createHoverFamily(o: HoverFamilyOptions): FamilyRule {
  const step = `family:${o.exportName}`
  const tags: Readonly<Record<string, string>> = {
    Provider: "HoverProviderElement",
    Root: "HoverRootElement",
    Trigger: `${o.prefix}TriggerElement`,
    Portal: "HoverPortalElement",
    Positioner: "AnchorPositioner",
    Popup: `${o.prefix}PopupElement`,
    Arrow: "HoverArrowElement",
  }
  return {
    module: o.module,
    exportName: o.exportName,
    kind: "script",
    behaviors: ["hover"],
    domParity: "native-structure",
    renderableParts: ["Trigger"],
    reference: `https://github.com/mui/base-ui/tree/master/packages/react/src/${o.module.split("/").pop()}`,
    notes: o.notes,
    transform(ctx, local) {
      replacePartTypes(ctx, step, local, {
        Provider: "HoverRootProps",
        Root: "HoverRootProps",
        Trigger:
          o.triggerTag === "button"
            ? 'ComponentProps<"button", RenderProp>'
            : 'ComponentProps<"a", RenderProp>',
        Portal: "{ children?: Child }",
        Positioner: "AnchorPositionerProps",
        Popup: 'ComponentProps<"div">',
        Arrow: 'ComponentProps<"div">',
      })
      forEachPart(ctx, local, (element) => {
        const tag = tags[element.part]
        if (!tag) {
          throw new Error(
            `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
          )
        }
        if (element.part === "Popup") {
          element.mapClasses(mapPopupClasses, [ANCHORED_POPUP_RESET])
        }
        const attrs = element.attributes().join(" ")
        element.replace(
          element.children
            ? `<${tag} ${attrs}>${element.children}</${tag}>`
            : `<${tag} ${attrs} />`
        )
      })
      registerHelpers(ctx, helperEntries(`${SHARED}\n\n${helpers(o)}`))
      insertAnchorHelpers(ctx)
      ctx.needsComponentProps = true
      ctx.needsRender = true
      ctx.log.push(
        `${step}: ${local} on a manual popover with the hover script`
      )
    },
  }
}

export const tooltipFamily = createHoverFamily({
  module: "@base-ui/react/tooltip",
  exportName: "Tooltip",
  prefix: "Tooltip",
  delay: 600,
  closeDelay: 0,
  triggerTag: "button",
  tooltip: true,
  notes: [
    'Opening on hover or keyboard focus needs the client script `/shadcn/hover.js` (`<script type="module" src="/shadcn/hover.js">`); without it the tooltip does not open, but the trigger\'s `aria-describedby` still exposes its text. The popup is a native popover placed with CSS anchor positioning.',
    'Unlike Base UI, the popup has `role="tooltip"` and describes the trigger. Controlled state (`open`, `onOpenChange`) is not supported.',
  ],
})

export const previewCardFamily = createHoverFamily({
  module: "@base-ui/react/preview-card",
  exportName: "PreviewCard",
  prefix: "PreviewCard",
  delay: 600,
  closeDelay: 300,
  triggerTag: "a",
  tooltip: false,
  notes: [
    'Opening on hover or keyboard focus needs the client script `/shadcn/hover.js` (`<script type="module" src="/shadcn/hover.js">`); without it the card does not open and the trigger works as a plain link. The card is a native popover placed with CSS anchor positioning.',
    "Controlled state (`open`, `onOpenChange`) is not supported.",
  ],
})
