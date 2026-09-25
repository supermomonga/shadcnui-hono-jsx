/**
 * Base UI's Popover on the native `popover` attribute: the trigger toggles it
 * with Invoker Commands (`command="toggle-popover"`), the browser handles
 * light dismiss, Escape and focus order, and CSS anchor positioning places it
 * next to the trigger, so no JavaScript ships. Anchor positioning needs
 * Chrome 125, Firefox 147 or Safari 26; elsewhere the popover opens centered.
 */
import { ANCHORED_POPUP_RESET, insertAnchorHelpers } from "./anchor"
import { mapPopupClasses } from "./dialog"
import type { FamilyRule } from "./types"
import { forEachPart, insertHelpers, replacePartTypes } from "./util"

const SHARED_HELPERS = `type PopoverRootProps = { id?: string | undefined; children?: Child }

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
  Popup: `function PopoverPopupElement({ style, ...props }: ComponentProps<"div">) {
  const { id, anchor, titleId, descriptionId } = usePopoverContext()
  const placement = useContext(AnchorPlacementContext)
  return (
    <div
      id={id}
      popover="auto"
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-side={placement.side}
      data-align={placement.align}
      style={withStyle(style, anchorPlacementStyle(anchor, placement))}
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
      Positioner: "AnchorPositionerProps",
      Popup: 'ComponentProps<"div">',
      Title: 'ComponentProps<"h2">',
      Description: 'ComponentProps<"p">',
      Close: 'ComponentProps<"button", RenderProp>',
    })
    const used = new Set<string>()
    forEachPart(ctx, local, (element) => {
      used.add(element.part)
      if (!(element.part in PART_HELPERS) && element.part !== "Positioner") {
        throw new Error(
          `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
        )
      }
      if (element.part === "Popup") {
        element.mapClasses(mapPopupClasses, [ANCHORED_POPUP_RESET])
      }
      const tag =
        element.part === "Positioner"
          ? "AnchorPositioner"
          : `Popover${element.part}Element`
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
    insertAnchorHelpers(ctx)
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
