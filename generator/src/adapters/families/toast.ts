/**
 * Base UI's Toast: the server renders the viewport (a live region), the
 * toasts of the enclosing \`<Toaster>\` (\`toasts\` or a per-response
 * \`createToastManager()\`) and, per toast type, a template of the toast
 * markup. The client script \`public/shadcn/toast.js\` (docs/adr/0025) exports
 * \`toast\` with Base UI's \`add\`/\`close\`/\`update\`/\`promise\`, copies the
 * templates, stacks, times out, expands and swipes toasts like Base UI.
 */
import { Node, SyntaxKind } from "ts-morph"
import type { FamilyRule } from "./types"
import {
  forEachPart,
  helperEntries,
  registerHelpers,
  replacePartTypes,
} from "./util"

const HELPERS = `/** A toast, as \`toast.add()\` takes it (Base UI's options). */
interface ToastObject {
  id: string
  title?: Child
  description?: Child
  type?: string | undefined
  /** Milliseconds before it closes; 0 keeps it open. */
  timeout?: number | undefined
  priority?: "low" | "high" | undefined
  actionProps?: ComponentProps<"button"> | undefined
}

type ToastOptions = Partial<ToastObject>

/** Toasts rendered on the server, for one response (Base UI's toast manager shape). */
interface ToastManager {
  readonly toasts: readonly ToastObject[]
  add(options: ToastOptions): string
  close(id: string): void
  update(id: string, options: ToastOptions): void
}

/**
 * A toast manager for one response: toasts added to it render with
 * \`<Toaster toastManager={manager}>\` (for example flash messages after a form
 * post). In the browser, use \`toast\` from \`/shadcn/toast.js\`.
 */
function createServerToastManager(): ToastManager {
  const toasts: ToastObject[] = []
  let count = 0
  return {
    get toasts() {
      return toasts
    },
    add(options) {
      const id = options.id ?? \`toast-\${++count}\`
      toasts.unshift({ ...options, id })
      return id
    },
    close(id) {
      const index = toasts.findIndex((toast) => toast.id === id)
      if (index !== -1) toasts.splice(index, 1)
    },
    update(id, options) {
      const toast = toasts.find((item) => item.id === id)
      if (toast) Object.assign(toast, options, { id })
    },
  }
}

/**
 * The module-level manager is shared by every request on the server, so it
 * holds no toasts: add them in the browser with \`toast\` from
 * \`/shadcn/toast.js\`, or per response with \`createToastManager()\` or
 * \`<Toaster toasts>\`.
 */
function createModuleToastManager(): ToastManager {
  const unavailable = () => {
    throw new Error(
      'toast.add() runs in the browser, with toast from /shadcn/toast.js. On the server, pass toasts to <Toaster toasts={...}> or use createToastManager().'
    )
  }
  return { toasts: [], add: unavailable, close: unavailable, update: unavailable }
}

type ToastProviderProps = {
  toastManager?: ToastManager | undefined
  /** Toasts to render on the server (newest first). */
  toasts?: readonly ToastOptions[] | undefined
  /** Default milliseconds before a toast closes (Base UI: 5000). */
  timeout?: number | undefined
  /** How many toasts show at once (Base UI: 3). */
  limit?: number | undefined
  children?: Child
}

interface ToastProviderState {
  manager: ToastManager
  timeout: number
  limit: number
}

const ToastProviderContext = createContext<ToastProviderState>({
  manager: createModuleToastManager(),
  timeout: 5000,
  limit: 3,
})

function ToastProviderElement({
  toastManager,
  toasts,
  timeout = 5000,
  limit = 3,
  children,
}: ToastProviderProps) {
  let manager = toastManager ?? createModuleToastManager()
  if (toasts && toasts.length > 0) {
    manager = createServerToastManager()
    for (const toast of [...(toastManager?.toasts ?? []), ...toasts].reverse()) manager.add(toast)
  }
  return (
    <ToastProviderContext.Provider value={{ manager, timeout, limit }}>{children}</ToastProviderContext.Provider>
  )
}

/** Base UI's \`useToastManager()\`: the toasts of the enclosing \`<Toaster>\`. */
function useServerToastManager(): ToastManager {
  return useContext(ToastProviderContext).manager
}

function ToastPortalElement({ children }: { children?: Child }) {
  return <>{children}</>
}

/** Toast types with an icon; the script copies the matching template for \`toast.add()\`. */
const TOAST_TEMPLATE_TYPES = ["", "success", "info", "warning", "error", "loading"]

/**
 * The live region toasts render in. Its children also render once per toast
 * type into templates, which the client script \`/shadcn/toast.js\` copies.
 */
function ToastViewportElement({ children, ...props }: ComponentProps<"div">) {
  const provider = useContext(ToastProviderContext)
  return (
    <div
      tabindex={-1}
      role="region"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions text"
      aria-label="Notifications"
      data-toast-viewport=""
      data-timeout={provider.timeout}
      data-limit={provider.limit}
      {...props}
    >
      {children}
      {TOAST_TEMPLATE_TYPES.map((type) => (
        <ToastProviderContext.Provider
          value={{ ...provider, manager: toastTemplateManager(type) }}
        >
          <template data-toast-template={type}>{children}</template>
        </ToastProviderContext.Provider>
      ))}
    </div>
  )
}

/** One sample toast of \`type\` with every part, for a template. */
function toastTemplateManager(type: string): ToastManager {
  const manager = createServerToastManager()
  manager.add({
    id: "",
    title: " ",
    description: " ",
    type: type || undefined,
    actionProps: { children: " " },
  })
  return manager
}

interface ToastRootState {
  toast: ToastObject
  index: number
  titleId: string
  descriptionId: string
}

const ToastRootContext = createContext<ToastRootState | null>(null)

type ToastRootProps = ComponentProps<"div"> & { toast: ToastObject }

function ToastRootElement({ toast, style, ...props }: ToastRootProps) {
  const { manager, limit } = useContext(ToastProviderContext)
  const index = Math.max(manager.toasts.indexOf(toast), 0)
  const id = useId().replaceAll(":", "-")
  const titleId = \`toast\${id}-title\`
  const descriptionId = \`toast\${id}-description\`
  return (
    <ToastRootContext.Provider value={{ toast, index, titleId, descriptionId }}>
      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: the role is dialog or alertdialog, like Base UI */}
      <div
        role={toast.priority === "high" ? "alertdialog" : "dialog"}
        tabindex={0}
        aria-modal="false"
        aria-labelledby={present(toast.title) ? titleId : undefined}
        aria-describedby={present(toast.description) ? descriptionId : undefined}
        data-type={toast.type}
        data-limited={index >= limit ? "" : undefined}
        inert={index >= limit || undefined}
        data-toast={toast.id}
        data-toast-timeout={toast.timeout}
        style={withToastStyle(style, {
          "--toast-swipe-movement-x": "0px",
          "--toast-swipe-movement-y": "0px",
          "--toast-index": String(index),
          "--toast-offset-y": "0px",
        })}
        {...props}
      />
    </ToastRootContext.Provider>
  )
}

function useToastRootContext(): ToastRootState {
  const context = useContext(ToastRootContext)
  if (!context) throw new Error("Toast parts must be rendered inside <Toast>")
  return context
}

function ToastContentElement(props: ComponentProps<"div">) {
  const { index } = useToastRootContext()
  return <div data-behind={index > 0 ? "" : undefined} data-toast-part="content" {...props} />
}

/** The toast's title (or the children); renders nothing without one. */
function ToastTitleElement({ children, ...props }: ComponentProps<"h2">) {
  const { toast, titleId } = useToastRootContext()
  const title = children ?? toast.title
  if (!present(title)) return null
  return (
    <h2 id={titleId} data-type={toast.type} data-toast-part="title" {...props}>
      {title}
    </h2>
  )
}

function ToastDescriptionElement({ children, ...props }: ComponentProps<"p">) {
  const { toast, descriptionId } = useToastRootContext()
  const description = children ?? toast.description
  if (!present(description)) return null
  return (
    <p id={descriptionId} data-type={toast.type} data-toast-part="description" {...props}>
      {description}
    </p>
  )
}

/** The toast's action button (\`actionProps\`); renders nothing without one. */
function ToastActionElement({
  type = "button",
  render,
  ...props
}: ComponentProps<"button", RenderProp>) {
  const { toast } = useToastRootContext()
  if (!present(toast.actionProps?.children as Child)) return null
  return renderElement(
    <button type={type} data-type={toast.type} data-toast-part="action" {...props} {...toast.actionProps} />,
    render
  )
}

function ToastCloseElement({
  type = "button",
  render,
  ...props
}: ComponentProps<"button", RenderProp>) {
  const { toast } = useToastRootContext()
  return renderElement(
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: Base UI hides the close button from assistive technology (Escape closes a focused toast)
    <button type={type} aria-hidden="true" data-type={toast.type} data-toast-part="close" {...props} />,
    render
  )
}

/** Base UI omits empty titles, descriptions and actions. */
function present(content: Child): boolean {
  return content !== null && content !== undefined && content !== false && content !== ""
}

/** Adds \`extra\` declarations to a string or object \`style\` prop (the prop wins). */
function withToastStyle(
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
  Provider: "ToastProviderProps",
  Portal: "{ children?: Child }",
  Viewport: 'ComponentProps<"div">',
  Root: "ToastRootProps",
  Content: 'ComponentProps<"div">',
  Title: 'ComponentProps<"h2">',
  Description: 'ComponentProps<"p">',
  Action: 'ComponentProps<"button", RenderProp>',
  Close: 'ComponentProps<"button", RenderProp>',
}

/** Non-JSX uses of the primitive: \`Local.createToastManager()\` and friends. */
const REFERENCES: Readonly<Record<string, string>> = {
  createToastManager: "createServerToastManager",
  useToastManager: "useServerToastManager",
}

export const toastFamily: FamilyRule = {
  module: "@base-ui/react/toast",
  exportName: "Toast",
  kind: "script",
  behaviors: ["toast"],
  domParity: "native-structure",
  renderableParts: ["Action", "Close"],
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/toast",
  notes: [
    'Toasts are added in the browser with `toast` from the client script (`import { toast } from "/shadcn/toast.js"`, then `toast.add({ title, description, type, actionProps })`), or declaratively with `data-toast-trigger` buttons (`data-toast-title`, `data-toast-description`, `data-toast-type`). The script copies the toast markup from templates that `<Toaster>` renders, so edit the components as usual.',
    'On the server, pass toasts to `<Toaster toasts={[{ title: "Saved" }]} />` (for example flash messages after a form post) or use a per-response `createToastManager()` with `<Toaster toastManager={manager}>`; they show without JavaScript, and the script times them out. The exported `toast` is shared by every request on the server, so its `add()` throws there. Action `onClick` and other function props, and `useToastManager()` state updates, work only through `/shadcn/toast.js`.',
  ],
  transform(ctx, local) {
    const step = "family:Toast"
    replacePartTypes(ctx, step, local, PART_TYPES)
    forEachPart(ctx, local, (element) => {
      if (!(element.part in PART_TYPES)) {
        throw new Error(
          `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
        )
      }
      const tag = `Toast${element.part}Element`
      const attrs = element.attributes().join(" ")
      element.replace(
        element.children
          ? `<${tag} ${attrs}>${element.children}</${tag}>`
          : `<${tag} ${attrs} />`
      )
    })
    for (const access of ctx.sf
      .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
      .reverse()) {
      if (access.getExpression().getText() !== local) continue
      const name = access.getName()
      const replacement = REFERENCES[name]
      if (!replacement) {
        throw new Error(
          `[${ctx.name}] ${step}: unsupported use of ${access.getText()}`
        )
      }
      const call = access.getParent()
      // The module-level default manager cannot hold per-request toasts.
      const moduleLevel =
        name === "createToastManager" &&
        Node.isCallExpression(call) &&
        call.getFirstAncestorByKind(SyntaxKind.Block) === undefined
      access.replaceWithText(
        moduleLevel ? "createModuleToastManager" : replacement
      )
    }
    registerHelpers(ctx, HELPER_ENTRIES)
    ctx.needsComponentProps = true
    ctx.needsRender = true
    ctx.log.push(`${step}: ${local} with toast templates for the toast script`)
  },
}
