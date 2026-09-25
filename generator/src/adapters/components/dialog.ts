/**
 * Dialog on the native `<dialog>` element with Invoker Commands
 * (`command`/`commandfor`): opening, closing, focus handling, Escape and the
 * modal backdrop come from the browser, so no JavaScript ships. Requires
 * Baseline 2025 browsers (Chrome 135, Firefox 144, Safari 26.2).
 *
 * Structure and behavior are owned here; design stays upstream: every class
 * string and the close buttons (their Button props and children) are read
 * from the upstream source, and the build fails if that source no longer has
 * the expected shape.
 */
import { type JsxElement, Node, type SourceFile, SyntaxKind } from "ts-morph"
import {
  type TransformContext,
  TransformError,
  type TransformStep,
} from "../../transformers/context"
import type { ComponentAdapter } from "."

/** Splits `a:b:[c:d]` into variants and utility, ignoring `:` inside brackets. */
export function splitVariants(token: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ""
  for (const char of token) {
    if (char === "[" || char === "(") depth++
    if (char === "]" || char === ")") depth--
    if (char === ":" && depth === 0) {
      parts.push(current)
      current = ""
    } else {
      current += char
    }
  }
  parts.push(current)
  return parts
}

/**
 * Base UI marks open/closed state with `data-open`/`data-closed`; the native
 * dialog uses the `open` attribute (Tailwind `open:`). Closing is immediate
 * (the element becomes `display: none`), so exit animations are dropped.
 */
function mapStateVariants(token: string): string[] | null {
  const parts = splitVariants(token)
  const utility = parts.pop() as string
  if (parts.includes("data-closed")) return null
  return [...parts.map((v) => (v === "data-open" ? "open" : v)), utility]
}

/** Popup classes for the `<dialog>`; `not-open:hidden` restores hiding that `grid`/`flex` would override. */
export function mapPopupClasses(classes: string): string {
  const tokens = classes.split(/\s+/).filter(Boolean)
  const mapped = tokens.map(mapStateVariants).filter((t) => t !== null)
  return [...mapped.map((t) => t.join(":")), "not-open:hidden"].join(" ")
}

const OVERLAY_POSITIONING = /^(fixed|absolute|inset-.*|isolate|z-.*)$/

/** Overlay (Base UI Backdrop) classes applied to the dialog's `::backdrop`. */
export function mapBackdropClasses(classes: string): string {
  const tokens = classes.split(/\s+/).filter(Boolean)
  const mapped: string[] = []
  for (const token of tokens) {
    const parts = mapStateVariants(token)
    if (!parts) continue
    const utility = parts.pop() as string
    if (parts.length === 0 && OVERLAY_POSITIONING.test(utility)) continue
    mapped.push([...parts, "backdrop", utility].join(":"))
  }
  return mapped.join(" ")
}

function fail(ctx: TransformContext, message: string): never {
  throw new TransformError(ctx, "dialog-adapter", message)
}

/** The first string passed to `cn(...)` inside the named upstream function. */
function classesOf(ctx: TransformContext, sf: SourceFile, fn: string): string {
  const call = sf
    .getFunction(fn)
    ?.getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((c) => c.getExpression().getText() === "cn")
  const [first] = call?.getArguments() ?? []
  if (!first || !Node.isStringLiteral(first))
    fail(ctx, `no cn("...") classes in ${fn}`)
  return first.getLiteralValue()
}

/**
 * `<DialogPrimitive.Close render={<Button …/>} …>children</…>` in `fn`
 * becomes `<Button …/…>` with the close command. Returns the JSX text.
 */
function closeButtonOf(
  ctx: TransformContext,
  sf: SourceFile,
  fn: string
): string {
  const element = sf
    .getFunction(fn)
    ?.getDescendantsOfKind(SyntaxKind.JsxElement)
    .find(
      (e) =>
        e.getOpeningElement().getTagNameNode().getText() ===
        "DialogPrimitive.Close"
    )
  if (!element) fail(ctx, `no <DialogPrimitive.Close> in ${fn}`)
  const opening = (element as JsxElement).getOpeningElement()
  const outer: string[] = []
  let renderAttributes: string[] | undefined
  for (const attr of opening.getAttributes()) {
    if (
      Node.isJsxAttribute(attr) &&
      attr.getNameNode().getText() === "render"
    ) {
      const value = attr.getInitializer()
      const target = Node.isJsxExpression(value)
        ? value.getExpression()
        : undefined
      if (!target || !Node.isJsxSelfClosingElement(target)) {
        fail(ctx, `${fn}: close render prop must be a self-closing element`)
      }
      if (target.getTagNameNode().getText() !== "Button") {
        fail(ctx, `${fn}: close render prop must render <Button>`)
      }
      renderAttributes = target.getAttributes().map((a) => a.getText())
    } else {
      outer.push(attr.getText())
    }
  }
  if (!renderAttributes) fail(ctx, `${fn}: close button has no render prop`)
  const children = (element as JsxElement)
    .getJsxChildren()
    .map((c) => c.getText())
    .join("")
  const attributes = [
    ...renderAttributes,
    ...outer,
    'command="close"',
    "commandfor={id}",
  ]
  return `<Button ${attributes.join(" ")}>${children}</Button>`
}

function template(ctx: TransformContext, sf: SourceFile): string {
  const style = sf
    .getImportDeclarations()
    .map((d) => d.getModuleSpecifierValue())
    .find((m) => m.startsWith("@/registry/"))
  if (!style) fail(ctx, "no registry import of Button")
  const iconImport = sf
    .getImportDeclarations()
    .find((d) => d.getModuleSpecifierValue().includes("icon-placeholder"))
    ?.getText()
  if (!iconImport) fail(ctx, "no IconPlaceholder import")

  const backdrop = mapBackdropClasses(classesOf(ctx, sf, "DialogOverlay"))
  const popup = mapPopupClasses(classesOf(ctx, sf, "DialogContent"))
  const q = JSON.stringify
  return `import { cn } from "cn"
import { createContext, useContext, useId } from "hono/jsx"
${iconImport}
import { Button } from ${q(style)}

interface DialogContextValue {
  id: string
  titleId: string
  descriptionId: string
}

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialogContext(part: string): DialogContextValue {
  const context = useContext(DialogContext)
  if (!context) throw new Error(\`<\${part}> must be used within <Dialog>\`)
  return context
}

/**
 * Connects the trigger, the native \`<dialog>\`, its title and description.
 * Opening and closing use Invoker Commands, so no JavaScript is shipped.
 */
function Dialog({
  id,
  children,
}: {
  id?: string | undefined
  children?: Child
}) {
  const generated = useId()
  const dialogId = id ?? \`dialog\${generated.replaceAll(":", "-")}\`
  return (
    <DialogContext.Provider
      value={{
        id: dialogId,
        titleId: \`\${dialogId}-title\`,
        descriptionId: \`\${dialogId}-description\`,
      }}
    >
      {children}
    </DialogContext.Provider>
  )
}

function DialogTrigger({
  type = "button",
  render,
  ...props
}: ComponentProps<"button", RenderProp>) {
  const { id } = useDialogContext("DialogTrigger")
  return renderElement(
    <button
      type={type}
      command="show-modal"
      commandfor={id}
      aria-haspopup="dialog"
      data-slot="dialog-trigger"
      {...props}
    />,
    render
  )
}

/** The native dialog renders in the top layer, so no portal is needed. */
function DialogPortal({ children }: { children?: Child }) {
  return <>{children}</>
}

function DialogClose({
  type = "button",
  render,
  ...props
}: ComponentProps<"button", RenderProp>) {
  const { id } = useDialogContext("DialogClose")
  return renderElement(
    <button
      type={type}
      command="close"
      commandfor={id}
      data-slot="dialog-close"
      {...props}
    />,
    render
  )
}

/**
 * The native dialog draws its overlay with \`::backdrop\`, styled by
 * DialogContent, so this renders nothing. Kept for API compatibility.
 */
function DialogOverlay(_props: ComponentProps<"div">) {
  return null
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: ComponentProps<"dialog"> & {
  showCloseButton?: boolean
}) {
  const { id, titleId, descriptionId } = useDialogContext("DialogContent")
  return (
    <dialog
      id={id}
      closedby="any"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-slot="dialog-content"
      className={cn(
        ${q(backdrop)},
        ${q(popup)},
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        ${closeButtonOf(ctx, sf, "DialogContent")}
      )}
    </dialog>
  )
}

function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(${q(classesOf(ctx, sf, "DialogHeader"))}, className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  const id = useContext(DialogContext)?.id
  if (showCloseButton && !id) {
    throw new Error("<DialogFooter showCloseButton> must be used within <Dialog>")
  }
  return (
    <div
      data-slot="dialog-footer"
      className={cn(${q(classesOf(ctx, sf, "DialogFooter"))}, className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        ${closeButtonOf(ctx, sf, "DialogFooter")}
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      id={useContext(DialogContext)?.titleId}
      data-slot="dialog-title"
      className={cn(${q(classesOf(ctx, sf, "DialogTitle"))}, className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      id={useContext(DialogContext)?.descriptionId}
      data-slot="dialog-description"
      className={cn(${q(classesOf(ctx, sf, "DialogDescription"))}, className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
`
}

/** Replaces the upstream source with the native dialog implementation. */
const dialogStep: TransformStep = {
  name: "dialog-adapter",
  run(ctx) {
    const text = template(ctx, ctx.sf)
    ctx.sf.replaceWithText(text)
    ctx.needsComponentProps = true
    ctx.needsRender = true
    ctx.honoTypes.add("Child")
    ctx.log.push("dialog-adapter: native <dialog> with Invoker Commands")
  },
}

export const dialogAdapter: ComponentAdapter = {
  kind: "native",
  resolves: [
    "base-ui-primitive-unmapped:@base-ui/react/dialog#Dialog",
    "render-prop:DialogPrimitive.Close",
  ],
  notes: [
    "Built on the native `<dialog>` with Invoker Commands (`command`/`commandfor`): no JavaScript, but requires Baseline 2025 browsers (Chrome 135, Firefox 144, Safari 26.2).",
    'Controlled state (`open`, `defaultOpen`, `onOpenChange`) is not supported, and the trigger does not reflect the open state (`aria-expanded`). `DialogTrigger` and `DialogClose` support `render`, e.g. `render={<Button variant="outline" />}`.',
    "The overlay is the dialog's `::backdrop` (DialogOverlay renders nothing); closing has no exit animation; outside clicks close the dialog only where `closedby` is supported.",
    "Focus handling is the browser's: after the last control, Tab moves to the browser UI before wrapping (page content stays inert), where Base UI keeps focus inside the popup.",
  ],
  steps: [{ after: "remove-directives", step: dialogStep }],
}
