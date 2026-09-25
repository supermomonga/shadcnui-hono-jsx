/**
 * Base UI's Dialog and AlertDialog on the native `<dialog>` element with
 * Invoker Commands (`command`/`commandfor`): opening, closing, focus handling,
 * Escape and the modal backdrop come from the browser, so no JavaScript ships.
 * Requires Baseline 2025 browsers (Chrome 135, Firefox 144, Safari 26.2).
 *
 * The parts are rewritten in place, so every component built on them (Dialog,
 * AlertDialog, Sheet) keeps its upstream structure, props and classes.
 */
import type { FamilyRule } from "./types"
import {
  forEachPart,
  insertHelpers,
  partClasses,
  replacePartTypes,
  splitVariants,
} from "./util"

/**
 * Base UI marks open/closed state with `data-open`/`data-closed` and
 * transitions with `data-starting-style`/`data-ending-style`; the native
 * dialog uses the `open` attribute (`open:`/`not-open:`) and
 * `@starting-style` (`starting:`). Closed and ending styles both apply once
 * `open` is removed, while the popup stays rendered for its exit transition.
 */
function mapStateVariants(token: string): string[] {
  const parts = splitVariants(token)
  const utility = parts.pop() as string
  const variants = parts.map((v) => STATE_VARIANTS[v] ?? v)
  return [...variants, utility]
}

const STATE_VARIANTS: Readonly<Record<string, string>> = {
  "data-open": "open",
  "data-closed": "not-open",
  "data-starting-style": "starting",
  "data-ending-style": "not-open",
}

/**
 * Keeps a closing popup rendered and in the top layer until its exit
 * animation ends: `display` and `overlay` transition discretely over the
 * popup's transition duration. Tailwind's `transition` already lists both;
 * otherwise they are the only transitioned properties. `overlay` is
 * Chromium-only, so elsewhere the popup animates out of the top layer.
 */
function exitTransition(tokens: readonly string[]): string[] {
  const transitions = tokens.filter((t) => /^transition(-|$)/.test(t))
  if (transitions.length === 0) {
    return ["transition-[display,overlay]", "transition-discrete"]
  }
  if (transitions.every((t) => t === "transition")) {
    return ["transition-discrete"]
  }
  throw new Error(
    `dialog popup: cannot keep display/overlay transitions alongside ${transitions.join(" ")}`
  )
}

/**
 * Popup classes for the `<dialog>`: `not-open:hidden` restores hiding that
 * `grid`/`flex` would override, and the exit transition delays it.
 */
export function mapPopupClasses(classes: string): string {
  const tokens = classes.split(/\s+/).filter(Boolean)
  return [
    ...tokens.map((t) => mapStateVariants(t).join(":")),
    "not-open:hidden",
    ...exitTransition(tokens),
  ].join(" ")
}

const OVERLAY_POSITIONING = /^(fixed|absolute|inset-.*|isolate|z-.*)$/

/** Overlay (Base UI Backdrop) classes applied to the dialog's `::backdrop`. */
export function mapBackdropClasses(classes: string): string {
  const tokens = classes.split(/\s+/).filter(Boolean)
  const mapped: string[] = []
  for (const token of tokens) {
    const parts = mapStateVariants(token)
    const utility = parts.pop() as string
    if (parts.length === 0 && OVERLAY_POSITIONING.test(utility)) continue
    mapped.push([...parts, "backdrop", utility].join(":"))
  }
  return mapped.join(" ")
}

/**
 * Undoes the user-agent `dialog:modal` box (insets, fit-content size, size
 * limits, scrolling) so the popup lays out like Base UI's `div`; upstream
 * classes that set the same properties win in `cn`.
 */
export const POPUP_RESET =
  "inset-auto h-auto max-h-none w-auto max-w-none overflow-visible"

interface NativeDialogOptions {
  module: string
  exportName: string
  /** Prefix of the file-local helper names. */
  prefix: string
  role: "dialog" | "alertdialog"
  /** `any`: Escape and outside clicks close; `closerequest`: Escape only. */
  closedby: "any" | "closerequest"
  dismissNote: string
}

const PARTS = [
  "Root",
  "Trigger",
  "Portal",
  "Backdrop",
  "Popup",
  "Title",
  "Description",
  "Close",
]

function helpers(o: NativeDialogOptions, root: string): string {
  const P = o.prefix
  const role = o.role === "dialog" ? "" : ` role="${o.role}"`
  return `type ${P}RootProps = { id?: string | undefined; children?: Child }

interface ${P}ContextValue {
  id: string
  titleId: string
  descriptionId: string
}

const ${P}Context = createContext<${P}ContextValue | null>(null)

function use${P}Context(): ${P}ContextValue {
  const context = useContext(${P}Context)
  if (!context) throw new Error("${root} parts must be rendered inside <${root}>")
  return context
}

/**
 * Connects the trigger, the native \`<dialog>\`, its title and description.
 * Opening and closing use Invoker Commands, so no JavaScript is shipped.
 */
function ${P}RootElement({ id, children }: ${P}RootProps) {
  const generated = useId()
  const dialogId = id ?? \`dialog\${generated.replaceAll(":", "-")}\`
  return (
    <${P}Context.Provider
      value={{
        id: dialogId,
        titleId: \`\${dialogId}-title\`,
        descriptionId: \`\${dialogId}-description\`,
      }}
    >
      {children}
    </${P}Context.Provider>
  )
}

function ${P}TriggerElement({
  type = "button",
  render,
  ...props
}: ComponentProps<"button", RenderProp>) {
  const { id } = use${P}Context()
  return renderElement(
    <button
      type={type}
      command="show-modal"
      commandfor={id}
      aria-haspopup="dialog"
      {...props}
    />,
    render
  )
}

/** The native dialog renders in the top layer, so no portal is needed. */
function ${P}PortalElement({ children }: { children?: Child }) {
  return <>{children}</>
}

function ${P}PopupElement(props: ComponentProps<"dialog">) {
  const { id, titleId, descriptionId } = use${P}Context()
  return (
    <dialog
      id={id}${role}
      closedby="${o.closedby}"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      {...props}
    />
  )
}

function ${P}TitleElement(props: ComponentProps<"h2">) {
  return <h2 id={useContext(${P}Context)?.titleId} {...props} />
}

function ${P}DescriptionElement(props: ComponentProps<"p">) {
  return <p id={useContext(${P}Context)?.descriptionId} {...props} />
}

function ${P}CloseElement({
  type = "button",
  render,
  ...props
}: ComponentProps<"button", RenderProp>) {
  const { id } = use${P}Context()
  return renderElement(
    <button type={type} command="close" commandfor={id} {...props} />,
    render
  )
}`
}

function nativeDialogFamily(o: NativeDialogOptions): FamilyRule {
  const step = `family:${o.exportName}`
  return {
    module: o.module,
    exportName: o.exportName,
    kind: "native",
    domParity: "native-structure",
    renderableParts: ["Trigger", "Close"],
    reference: `https://github.com/mui/base-ui/tree/master/packages/react/src/${o.module.split("/").pop()}`,
    notes: [
      "Built on the native `<dialog>` with Invoker Commands (`command`/`commandfor`): no JavaScript, but requires Baseline 2025 browsers (Chrome 135, Firefox 144, Safari 26.2).",
      'Controlled state (`open`, `defaultOpen`, `onOpenChange`) is not supported, and the trigger does not reflect the open state (`aria-expanded`). Triggers and close buttons support `render`, e.g. `render={<Button variant="outline" />}`.',
      `The overlay is the dialog's \`::backdrop\` (the overlay component renders nothing); closing animates out, but only Chromium keeps the popup and backdrop in the top layer meanwhile (elsewhere the backdrop disappears at once); ${o.dismissNote}`,
      "Focus handling is the browser's: after the last control, Tab moves to the browser UI before wrapping (page content stays inert), where Base UI keeps focus inside the popup.",
    ],
    transform(ctx, local) {
      const backdrop = partClasses(ctx, local, "Backdrop")
        .map(mapBackdropClasses)
        .join(" ")
      replacePartTypes(ctx, step, local, {
        Root: `${o.prefix}RootProps`,
        Trigger: 'ComponentProps<"button", RenderProp>',
        Portal: "{ children?: Child }",
        Backdrop: 'ComponentProps<"div">',
        Popup: 'ComponentProps<"dialog">',
        Title: 'ComponentProps<"h2">',
        Description: 'ComponentProps<"p">',
        Close: 'ComponentProps<"button", RenderProp>',
      })
      let root: string | undefined
      forEachPart(ctx, local, (element) => {
        if (!PARTS.includes(element.part)) {
          throw new Error(
            `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
          )
        }
        if (element.part === "Root") root = element.component
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
        if (element.part === "Popup") {
          element.mapClasses(
            mapPopupClasses,
            [POPUP_RESET, backdrop].filter(Boolean)
          )
        }
        const tag = `${o.prefix}${element.part}Element`
        const attrs = element.attributes().join(" ")
        element.replace(
          element.children
            ? `<${tag} ${attrs}>${element.children}</${tag}>`
            : `<${tag} ${attrs} />`
        )
      })
      if (!root) {
        throw new Error(`[${ctx.name}] ${step}: no ${local}.Root component`)
      }
      insertHelpers(ctx, helpers(o, root))
      ctx.needsComponentProps = true
      ctx.needsRender = true
      ctx.honoTypes.add("Child")
      for (const value of ["createContext", "useContext", "useId"]) {
        ctx.honoValues.add(value)
      }
      ctx.log.push(`${step}: ${local} on the native <dialog>`)
    },
  }
}

export const dialogFamily = nativeDialogFamily({
  module: "@base-ui/react/dialog",
  exportName: "Dialog",
  prefix: "Dialog",
  role: "dialog",
  closedby: "any",
  dismissNote:
    "outside clicks close the dialog only where `closedby` is supported.",
})

export const alertDialogFamily = nativeDialogFamily({
  module: "@base-ui/react/alert-dialog",
  exportName: "AlertDialog",
  prefix: "AlertDialog",
  role: "alertdialog",
  closedby: "closerequest",
  dismissNote: "like Base UI, outside clicks do not close it.",
})
