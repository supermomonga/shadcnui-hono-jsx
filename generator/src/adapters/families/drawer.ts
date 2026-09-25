/**
 * Base UI's Drawer on the native \`<dialog>\`, like Dialog and Sheet
 * (docs/adr/0017): Invoker Commands open and close it without JavaScript, the
 * overlay classes style its \`::backdrop\` and the popup slides in and out with
 * \`@starting-style\` and discrete \`display\`/\`overlay\` transitions. The
 * viewport renders nothing. The client script \`public/shadcn/drawer.js\`
 * (docs/adr/0025) adds swiping to close, driving Base UI's swipe variables.
 */
import { Node, SyntaxKind } from "ts-morph"
import {
  mapBackdropClasses,
  mapPopupClasses,
  mapPopupStateClasses,
  POPUP_RESET,
} from "./dialog"
import type { FamilyRule } from "./types"
import {
  forEachPart,
  helperEntries,
  partClasses,
  registerHelpers,
  replacePartTypes,
} from "./util"

const HELPERS = `type DrawerSwipeDirection = "up" | "down" | "left" | "right"

type DrawerRootProps = {
  id?: string | undefined
  /** Base UI's \`modal\`; the drawer always opens as a modal dialog. */
  modal?: boolean | "trap-focus" | undefined
  /** The direction a swipe closes the drawer in, and the edge it slides from. */
  swipeDirection?: DrawerSwipeDirection | undefined
  /** Base UI's snap points; not supported (the drawer opens fully). */
  snapPoints?: readonly (number | string)[] | undefined
  children?: Child
}

interface DrawerContextValue {
  id: string
  titleId: string
  descriptionId: string
  swipeDirection: DrawerSwipeDirection
}

const DrawerRootContext = createContext<DrawerContextValue | null>(null)

function useDrawerRootContext(): DrawerContextValue {
  const context = useContext(DrawerRootContext)
  if (!context) throw new Error("Drawer parts must be rendered inside <Drawer>")
  return context
}

/**
 * Connects the trigger, the native \\\`<dialog>\\\`, its title and description.
 * Opening and closing use Invoker Commands; the client script
 * \\\`/shadcn/drawer.js\\\` adds swiping to close.
 */
function DrawerRootElement({ id, swipeDirection = "down", children }: DrawerRootProps) {
  const generated = useId()
  const dialogId = id ?? \`drawer\${generated.replaceAll(":", "-")}\`
  return (
    <DrawerRootContext.Provider
      value={{
        id: dialogId,
        titleId: \`\${dialogId}-title\`,
        descriptionId: \`\${dialogId}-description\`,
        swipeDirection,
      }}
    >
      {children}
    </DrawerRootContext.Provider>
  )
}

function DrawerTriggerElement({
  type = "button",
  render,
  ...props
}: ComponentProps<"button", RenderProp>) {
  const { id } = useDrawerRootContext()
  return renderElement(
    <button type={type} command="show-modal" commandfor={id} aria-haspopup="dialog" {...props} />,
    render
  )
}

/** The native dialog renders in the top layer, so no portal or viewport is needed. */
function DrawerPortalElement({ children }: { children?: Child }) {
  return <>{children}</>
}

/** Base UI's swipe state, reset by the script after a swipe. */
const DRAWER_SWIPE_STYLE: Record<string, string> = {
  "--drawer-swipe-movement-x": "0px",
  "--drawer-swipe-movement-y": "0px",
  "--drawer-swipe-progress": "0",
  "--nested-drawers": "0",
  "--drawer-snap-point-offset": "0px",
  "--drawer-swipe-strength": "1",
}

function DrawerPopupElement({ style, ...props }: ComponentProps<"dialog">) {
  const { id, titleId, descriptionId, swipeDirection } = useDrawerRootContext()
  return (
    <dialog
      id={id}
      closedby="any"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-swipe-direction={swipeDirection}
      data-drawer=""
      style={withDrawerStyle(style, DRAWER_SWIPE_STYLE)}
      {...props}
    />
  )
}

function DrawerTitleElement(props: ComponentProps<"h2">) {
  return <h2 id={useContext(DrawerRootContext)?.titleId} {...props} />
}

function DrawerDescriptionElement(props: ComponentProps<"p">) {
  return <p id={useContext(DrawerRootContext)?.descriptionId} {...props} />
}

function DrawerCloseElement({
  type = "button",
  render,
  ...props
}: ComponentProps<"button", RenderProp>) {
  const { id } = useDrawerRootContext()
  return renderElement(<button type={type} command="close" commandfor={id} {...props} />, render)
}

function DrawerContentElement(props: ComponentProps<"div">) {
  return <div data-drawer-content="" {...props} />
}

/** Adds \`extra\` declarations to a string or object \`style\` prop (the prop wins). */
function withDrawerStyle(
  style: string | JSX.CSSProperties | undefined,
  extra: Record<string, string>
): string | JSX.CSSProperties {
  if (typeof style === "string") {
    const css = Object.entries(extra).map(([key, value]) => \`\${key}:\${value}\`)
    return [...css, style].join(";")
  }
  return { ...extra, ...style }
}`

const HELPER_ENTRIES = helperEntries(HELPERS)

const PART_TYPES: Readonly<Record<string, string>> = {
  Root: "DrawerRootProps",
  Trigger: 'ComponentProps<"button", RenderProp>',
  Portal: "{ children?: Child }",
  Close: 'ComponentProps<"button", RenderProp>',
  Backdrop: 'ComponentProps<"div">',
  Viewport: 'ComponentProps<"div">',
  Popup: 'ComponentProps<"dialog">',
  Content: 'ComponentProps<"div">',
  Title: 'ComponentProps<"h2">',
  Description: 'ComponentProps<"p">',
}

export const drawerFamily: FamilyRule = {
  module: "@base-ui/react/drawer",
  exportName: "Drawer",
  kind: "script",
  behaviors: ["drawer"],
  domParity: "native-structure",
  renderableParts: ["Trigger", "Close"],
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/drawer",
  notes: [
    "Built on the native `<dialog>` with Invoker Commands (`command`/`commandfor`), like Dialog: opening, closing, Escape and outside clicks need no JavaScript (Baseline 2025 browsers). The overlay is the dialog's `::backdrop` (the overlay component renders nothing), and the viewport renders nothing.",
    'Swiping to close needs the client script `/shadcn/drawer.js` (`<script type="module" src="/shadcn/drawer.js">`). Snap points, nested drawer stacking, swipe areas and `modal={false}` are not supported (the drawer always opens as a modal dialog). Controlled state (`open`, `defaultOpen`, `onOpenChange`) is not supported.',
  ],
  transform(ctx, local) {
    const step = "family:Drawer"
    const backdrop = partClasses(ctx, local, "Backdrop")
      .map(mapBackdropClasses)
      .join(" ")
    replacePartTypes(ctx, step, local, PART_TYPES)
    // The popup's classes span several \`cn\` strings; the first gets the exit
    // transition below, the others only their state variants.
    for (const tag of ctx.sf.getDescendantsOfKind(
      SyntaxKind.JsxOpeningElement
    )) {
      if (tag.getTagNameNode().getText() !== `${local}.Popup`) continue
      for (const attribute of tag.getAttributes()) {
        if (!Node.isJsxAttribute(attribute)) continue
        if (attribute.getNameNode().getText() !== "className") continue
        const call = attribute
          .getInitializer()
          ?.getFirstDescendantByKind(SyntaxKind.CallExpression)
        const [, ...rest] = call?.getArguments() ?? []
        for (const arg of rest) {
          if (Node.isStringLiteral(arg)) {
            arg.setLiteralValue(mapPopupStateClasses(arg.getLiteralValue()))
          }
        }
      }
    }
    forEachPart(ctx, local, (element) => {
      if (!(element.part in PART_TYPES)) {
        throw new Error(
          `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
        )
      }
      if (element.part === "Backdrop") {
        // Drawn by the popup's ::backdrop; the component renders nothing.
        const component = element.component
        element.replace("null")
        ctx.sf
          .getFunctionOrThrow(component)
          .getParameters()[0]
          ?.replaceWithText('_props: ComponentProps<"div">')
        return
      }
      if (element.part === "Viewport") {
        element.replace(element.soleElementChild ?? `<>${element.children}</>`)
        return
      }
      if (element.part === "Popup") {
        element.mapClasses(
          mapPopupClasses,
          [POPUP_RESET, backdrop].filter(Boolean)
        )
      }
      const tag = `Drawer${element.part}Element`
      const attrs = element.attributes().join(" ")
      element.replace(
        element.children
          ? `<${tag} ${attrs}>${element.children}</${tag}>`
          : `<${tag} ${attrs} />`
      )
    })
    registerHelpers(ctx, HELPER_ENTRIES)
    ctx.needsComponentProps = true
    ctx.needsRender = true
    ctx.log.push(`${step}: ${local} on the native <dialog>`)
  },
}
