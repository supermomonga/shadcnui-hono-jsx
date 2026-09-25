/**
 * Base UI's Popover on the native `popover` attribute: the trigger toggles it
 * with Invoker Commands (`command="toggle-popover"`), the browser handles
 * light dismiss, Escape and focus order, and CSS anchor positioning places it
 * next to the trigger, so no JavaScript ships. Anchor positioning needs
 * Chrome 125, Firefox 147 or Safari 26; elsewhere the popover opens centered.
 */
import { mapPopupClasses } from "./dialog"
import type { FamilyRule } from "./types"
import { forEachPart, insertHelpers, replacePartTypes } from "./util"

/**
 * Without anchor positioning the popover keeps the user-agent centering
 * (`margin: auto`); with it, margins only carry the offsets.
 */
export const POPOVER_RESET = "m-auto supports-[position-area:bottom]:m-0"

const SHARED_HELPERS = `type PopoverRootProps = { id?: string | undefined; children?: Child }

type PopoverSide = "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end"
type PopoverAlign = "start" | "center" | "end"

type PopoverPositionerProps = {
  side?: PopoverSide | undefined
  align?: PopoverAlign | undefined
  sideOffset?: number | undefined
  alignOffset?: number | undefined
  class?: string | undefined
  children?: Child
}

interface PopoverContextValue {
  id: string
  anchor: string
  titleId: string
  descriptionId: string
}

const PopoverContext = createContext<PopoverContextValue | null>(null)

function usePopoverContext(): PopoverContextValue {
  const context = useContext(PopoverContext)
  if (!context) throw new Error("Popover parts must be rendered inside a popover")
  return context
}

interface PopoverPlacement {
  side: PopoverSide
  align: PopoverAlign
  sideOffset: number
  alignOffset: number
}

const PopoverPlacementContext = createContext<PopoverPlacement>({
  side: "bottom",
  align: "center",
  sideOffset: 0,
  alignOffset: 0,
})

/** Inline styles that anchor the popover to its trigger like Base UI's Positioner. */
function popoverPlacementStyle(anchor: string, p: PopoverPlacement): Record<string, string> {
  const block = p.side === "top" || p.side === "bottom"
  const logical = p.side === "inline-start" || p.side === "inline-end"
  const span = block
    ? { start: "span-x-end", center: "", end: "span-x-start" }[p.align]
    : logical
      ? { start: "span-block-end", center: "", end: "span-block-start" }[p.align]
      : { start: "span-y-end", center: "", end: "span-y-start" }[p.align]
  const toward = {
    top: "margin-bottom",
    bottom: "margin-top",
    left: "margin-right",
    right: "margin-left",
    "inline-start": "margin-inline-end",
    "inline-end": "margin-inline-start",
  }[p.side]
  const across = block
    ? p.align === "end" ? "margin-inline-end" : "margin-inline-start"
    : p.align === "end" ? "margin-block-end" : "margin-block-start"
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
    "position-anchor": anchor,
    "position-area": [p.side, span].filter(Boolean).join(" "),
    "position-try-fallbacks": block ? "flip-block" : "flip-inline",
    [toward]: \`\${p.sideOffset}px\`,
    ...(p.alignOffset === 0 ? {} : { [across]: \`\${p.alignOffset}px\` }),
    "--transform-origin": origin,
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
}`

/** File-local implementation of each part, inserted only when the file uses it. */
const PART_HELPERS: Readonly<Record<string, string>> = {
  Root: `/** Connects the trigger (the anchor), the native popover and its title and description. */
function PopoverRootElement({ id, children }: PopoverRootProps) {
  const generated = useId().replaceAll(":", "-")
  const popoverId = id ?? \`popover\${generated}\`
  return (
    <PopoverContext.Provider
      value={{
        id: popoverId,
        anchor: \`--\${popoverId}\`,
        titleId: \`\${popoverId}-title\`,
        descriptionId: \`\${popoverId}-description\`,
      }}
    >
      {children}
    </PopoverContext.Provider>
  )
}`,
  Trigger: `function PopoverTriggerElement({
  type = "button",
  render,
  style,
  ...props
}: ComponentProps<"button", RenderProp>) {
  const { id, anchor } = usePopoverContext()
  return renderElement(
    <button
      type={type}
      command="toggle-popover"
      commandfor={id}
      aria-haspopup="dialog"
      style={withStyle(style, { "anchor-name": anchor })}
      {...props}
    />,
    render
  )
}`,
  Portal: `/** The native popover renders in the top layer, so no portal is needed. */
function PopoverPortalElement({ children }: { children?: Child }) {
  return <>{children}</>
}`,
  Positioner: `/** Placement for the popup; the popover itself is positioned with CSS. */
function PopoverPositionerElement({
  side = "bottom",
  align = "center",
  sideOffset = 0,
  alignOffset = 0,
  children,
}: PopoverPositionerProps) {
  return (
    <PopoverPlacementContext.Provider value={{ side, align, sideOffset, alignOffset }}>
      {children}
    </PopoverPlacementContext.Provider>
  )
}`,
  Popup: `function PopoverPopupElement({ style, ...props }: ComponentProps<"div">) {
  const { id, anchor, titleId, descriptionId } = usePopoverContext()
  const placement = useContext(PopoverPlacementContext)
  return (
    <div
      id={id}
      popover="auto"
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-side={placement.side}
      data-align={placement.align}
      style={withStyle(style, popoverPlacementStyle(anchor, placement))}
      {...props}
    />
  )
}`,
  Title: `function PopoverTitleElement(props: ComponentProps<"h2">) {
  return <h2 id={useContext(PopoverContext)?.titleId} {...props} />
}`,
  Description: `function PopoverDescriptionElement(props: ComponentProps<"p">) {
  return <p id={useContext(PopoverContext)?.descriptionId} {...props} />
}`,
  Close: `function PopoverCloseElement({
  type = "button",
  render,
  ...props
}: ComponentProps<"button", RenderProp>) {
  const { id } = usePopoverContext()
  return renderElement(
    <button type={type} command="hide-popover" commandfor={id} {...props} />,
    render
  )
}`,
}

export const popoverFamily: FamilyRule = {
  module: "@base-ui/react/popover",
  exportName: "Popover",
  kind: "native",
  domParity: "native-structure",
  renderableParts: ["Trigger", "Close"],
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/popover",
  notes: [
    "Built on the native `popover` attribute with Invoker Commands and CSS anchor positioning: no JavaScript, but placement next to the trigger needs Chrome 135, Firefox 147 or Safari 26.2 (elsewhere the popover opens centered). Outside clicks and Escape close it.",
    "Controlled state (`open`, `defaultOpen`, `onOpenChange`) and `openOnHover` are not supported. `side`, `align`, `sideOffset` and `alignOffset` place the popover; on collision it flips to the opposite side, but `data-side` keeps the requested side. Focus is not moved into the popover, and the positioner's classes are not rendered.",
  ],
  transform(ctx, local) {
    const step = "family:Popover"
    replacePartTypes(ctx, step, local, {
      Root: "PopoverRootProps",
      Trigger: 'ComponentProps<"button", RenderProp>',
      Portal: "{ children?: Child }",
      Positioner: "PopoverPositionerProps",
      Popup: 'ComponentProps<"div">',
      Title: 'ComponentProps<"h2">',
      Description: 'ComponentProps<"p">',
      Close: 'ComponentProps<"button", RenderProp>',
    })
    const used = new Set<string>()
    forEachPart(ctx, local, (element) => {
      used.add(element.part)
      if (!(element.part in PART_HELPERS)) {
        throw new Error(
          `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
        )
      }
      if (element.part === "Popup") {
        element.mapClasses(mapPopupClasses, [POPOVER_RESET])
      }
      const tag = `Popover${element.part}Element`
      const attrs = element.attributes().join(" ")
      element.replace(
        element.children
          ? `<${tag} ${attrs}>${element.children}</${tag}>`
          : `<${tag} ${attrs} />`
      )
    })
    const parts = Object.entries(PART_HELPERS)
      .filter(([part]) => used.has(part))
      .map(([, text]) => text)
    insertHelpers(ctx, [SHARED_HELPERS, ...parts].join("\n\n"))
    ctx.needsComponentProps = true
    ctx.needsRender = true
    ctx.honoTypes.add("Child")
    ctx.honoTypes.add("JSX")
    for (const value of ["createContext", "useContext", "useId"]) {
      ctx.honoValues.add(value)
    }
    ctx.log.push(`${step}: ${local} on the native popover`)
  },
}
