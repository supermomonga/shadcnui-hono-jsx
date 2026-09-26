/**
 * Sidebar: upstream keeps the open state, the mobile sheet and the keyboard
 * shortcut in React state and effects, and uses the `use-mobile` hook. On
 * the server the state comes from `open`/`defaultOpen`; the client script
 * `public/shadcn/sidebar.js` (docs/adr/0025) toggles it (triggers, the rail,
 * Ctrl/Cmd+B), stores it in the upstream cookie and, below the upstream
 * mobile breakpoint, moves the content into the mobile sheet. Every rewrite
 * checks the upstream code it replaces and fails when it changes.
 */
import { createHash } from "node:crypto"
import { type FunctionDeclaration, Node, SyntaxKind } from "ts-morph"
import {
  type TransformContext,
  TransformError,
  type TransformStep,
} from "../../transformers/context"
import type { ComponentAdapter } from "./types"

const STEP = "sidebar:server"

/** sha256 of SidebarProvider's statements before its return (whitespace collapsed). */
const PROVIDER_LOGIC_SHA256 =
  "f7c83a25ec88da173e18086dff250d4856d93bb586766bca83ab7cea4620dbd5"

const SERVER_STATE = `// On the server the state comes from the props (read the cookie named by
// SIDEBAR_COOKIE_NAME for defaultOpen); /shadcn/sidebar.js toggles it.
const open = openProp ?? defaultOpen
const state = open ? "expanded" : "collapsed"
const contextValue: SidebarContextProps = {
  state,
  open,
  setOpen: sidebarInBrowser,
  isMobile: false,
  openMobile: false,
  setOpenMobile: sidebarInBrowser,
  toggleSidebar: sidebarInBrowser,
}`

const IN_BROWSER = `/** Opening and closing happen in the browser, with /shadcn/sidebar.js. */
function sidebarInBrowser(): never {
  throw new Error(
    "The sidebar opens and closes in the browser with /shadcn/sidebar.js; on the server, set open or defaultOpen on SidebarProvider."
  )
}`

const STYLE_HELPER = `/** Adds the sidebar variables to a string or object \`style\` prop (the prop wins). */
function sidebarStyle(
  style: string | JSX.CSSProperties | undefined,
  variables: Record<string, string>
): string | JSX.CSSProperties {
  if (typeof style === "string") {
    return [...Object.entries(variables).map(([key, value]) => \`\${key}:\${value}\`), style].join(";")
  }
  return { ...variables, ...style }
}`

const normalize = (text: string) => text.replace(/\s+/g, " ").trim()

/** Removes the parentheses around a returned JSX expression. */
const unwrap = (text: string) =>
  text.replace(/^\(\s*/, "").replace(/\s*\)$/, "")

function fail(ctx: TransformContext, message: string): never {
  throw new TransformError(
    ctx,
    STEP,
    `${message}; upstream changed, update the sidebar adapter and /shadcn/sidebar.js`
  )
}

function fn(ctx: TransformContext, name: string): FunctionDeclaration {
  return ctx.sf.getFunction(name) ?? fail(ctx, `no ${name}`)
}

/** Removes the statement of `owner` whose text is `text` (whitespace-insensitive). */
function removeStatement(
  ctx: TransformContext,
  owner: FunctionDeclaration,
  text: string
): void {
  const statement = owner
    .getStatements()
    .find((s) => normalize(s.getText()) === text)
  if (!statement) fail(ctx, `${owner.getName()} has no \`${text}\``)
  statement.remove()
}

/** Removes the only JSX attribute `name` of `owner`, which must contain `expected`. */
function removeAttribute(
  ctx: TransformContext,
  owner: FunctionDeclaration,
  name: string,
  expected: string
): void {
  const attributes = owner
    .getDescendantsOfKind(SyntaxKind.JsxAttribute)
    .filter((a) => a.getNameNode().getText() === name)
  const [attribute] = attributes
  if (attributes.length !== 1 || !attribute?.getText().includes(expected)) {
    fail(ctx, `${owner.getName()}'s ${name} changed`)
  }
  attribute.remove()
}

/** Renames an unused destructured prop so it is dropped, not rendered. */
function ignoreBinding(
  ctx: TransformContext,
  owner: FunctionDeclaration,
  text: string,
  replacement: string
): void {
  const element = owner
    .getParameters()[0]
    ?.getDescendantsOfKind(SyntaxKind.BindingElement)
    .find((e) => e.getText() === text)
  if (!element) fail(ctx, `${owner.getName()} no longer destructures ${text}`)
  element.replaceWithText(replacement)
}

function removeHookImport(ctx: TransformContext): void {
  const hook = ctx.sf
    .getImportDeclarations()
    .find((d) => /\/hooks\/use-mobile$/.test(d.getModuleSpecifierValue()))
  if (!hook) fail(ctx, "no use-mobile import")
  hook.remove()
}

function serverProvider(ctx: TransformContext): void {
  const provider = fn(ctx, "SidebarProvider")
  const logic = provider.getStatements().slice(0, -1)
  const hash = createHash("sha256")
    .update(normalize(logic.map((s) => s.getText()).join("\n")))
    .digest("hex")
  if (hash !== PROVIDER_LOGIC_SHA256) {
    fail(ctx, "SidebarProvider's state logic changed")
  }
  // Comments between the statements go too (they count as statements here).
  const withComments = provider.getStatementsWithComments()
  provider.removeStatements([0, withComments.length - 2])
  provider.insertStatements(0, SERVER_STATE)
  ignoreBinding(
    ctx,
    provider,
    "onOpenChange: setOpenProp",
    "onOpenChange: _onOpenChange"
  )
  // The script reads the upstream cookie and shortcut from the wrapper.
  const wrapper = provider
    .getDescendantsOfKind(SyntaxKind.JsxOpeningElement)
    .find((e) => e.getText().includes('data-slot="sidebar-wrapper"'))
  if (!wrapper) fail(ctx, "no sidebar-wrapper element")
  wrapper.addAttributes([
    { name: "data-sidebar-cookie", initializer: "{SIDEBAR_COOKIE_NAME}" },
    {
      name: "data-sidebar-cookie-max-age",
      initializer: "{SIDEBAR_COOKIE_MAX_AGE}",
    },
    {
      name: "data-sidebar-shortcut",
      initializer: "{SIDEBAR_KEYBOARD_SHORTCUT}",
    },
  ])
  // Hono's \`style\` may be a string, which an object spread would drop.
  const style = provider
    .getDescendantsOfKind(SyntaxKind.JsxAttribute)
    .find((a) => a.getNameNode().getText() === "style")
  const variables =
    '{ "--sidebar-width": SIDEBAR_WIDTH, "--sidebar-width-icon": SIDEBAR_WIDTH_ICON }'
  if (
    !style ||
    normalize(style.getInitializer()?.getText() ?? "") !==
      normalize(
        `{ ${variables.slice(0, -2)}, ...style, } as React.CSSProperties }`
      )
  ) {
    fail(ctx, "SidebarProvider's style changed")
  }
  style.setInitializer(`{sidebarStyle(style, ${variables})}`)
  ctx.sf.insertStatements(provider.getChildIndex(), [IN_BROWSER, STYLE_HELPER])
  ctx.honoTypes.add("JSX")
}

/** The desktop sidebar renders as upstream, followed by the (empty) mobile sheet. */
function desktopAndMobile(ctx: TransformContext): void {
  const sidebar = fn(ctx, "Sidebar")
  const context = sidebar
    .getVariableStatements()
    .find((s) => s.getText().includes("useSidebar()"))
  if (
    !context ||
    normalize(context.getText()) !==
      "const { isMobile, state, openMobile, setOpenMobile } = useSidebar()"
  ) {
    fail(ctx, "Sidebar's useSidebar() changed")
  }
  context.replaceWithText("const { state } = useSidebar()")

  const mobile = sidebar
    .getStatements()
    .find(
      (s) => Node.isIfStatement(s) && s.getExpression().getText() === "isMobile"
    )
  const returned = mobile
    ?.getFirstDescendantByKind(SyntaxKind.ReturnStatement)
    ?.getExpression()
  if (!mobile || !returned) fail(ctx, "no mobile branch")
  const opening =
    "<Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>"
  const content =
    '<div className="flex h-full w-full flex-col">{children}</div>'
  let sheet = unwrap(returned.getText())
  if (!sheet.includes(opening) || !sheet.includes(content)) {
    fail(ctx, "Sidebar's mobile sheet changed")
  }
  sheet = sheet
    .replace(opening, "<Sheet>")
    .replace(
      content,
      '<div data-sidebar-mobile="" className="flex h-full w-full flex-col" />'
    )
  mobile.remove()

  const last = sidebar.getStatements().at(-1)
  const desktop = Node.isReturnStatement(last)
    ? last.getExpression()
    : undefined
  const element = desktop?.getFirstDescendantByKind(
    SyntaxKind.JsxOpeningElement
  )
  if (!desktop || !element?.getText().includes('data-slot="sidebar"')) {
    fail(ctx, "Sidebar's desktop markup changed")
  }
  element.addAttribute({
    name: "data-sidebar-collapsible",
    initializer: "{collapsible}",
  })
  desktop.replaceWithText(
    `(\n<>\n${unwrap(desktop.getText())}\n${sheet}\n</>\n)`
  )
}

function scriptedButtons(ctx: TransformContext): void {
  const trigger = fn(ctx, "SidebarTrigger")
  removeAttribute(ctx, trigger, "onClick", "toggleSidebar()")
  removeStatement(ctx, trigger, "const { toggleSidebar } = useSidebar()")
  ignoreBinding(ctx, trigger, "onClick", "onClick: _onClick")

  const rail = fn(ctx, "SidebarRail")
  removeAttribute(ctx, rail, "onClick", "toggleSidebar")
  removeStatement(ctx, rail, "const { toggleSidebar } = useSidebar()")
}

/** Base UI renders a true state as a present attribute and omits false. */
function booleanState(ctx: TransformContext): void {
  const actives = ctx.sf
    .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
    .filter((p) => p.getName() === "active")
  if (
    actives.length !== 2 ||
    actives.some((p) => p.getInitializer()?.getText() !== "isActive")
  ) {
    fail(ctx, "the menu buttons' active state changed")
  }
  for (const active of actives) {
    active.setInitializer('isActive ? "" : undefined')
  }
}

/** Collapsed-sidebar tooltips: the script shows them only while collapsed. */
function markTooltips(ctx: TransformContext): void {
  const button = fn(ctx, "SidebarMenuButton")
  const contents = button
    .getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    .filter((e) => e.getTagNameNode().getText() === "TooltipContent")
  const [content] = contents
  if (contents.length !== 1 || !content) {
    fail(ctx, "SidebarMenuButton's tooltip changed")
  }
  content.addAttribute({ name: "data-sidebar-tooltip", initializer: '""' })
}

/** `const [width] = React.useState(init)` never changes: compute it once. */
function skeletonWidth(ctx: TransformContext): void {
  const skeleton = fn(ctx, "SidebarMenuSkeleton")
  const declaration = skeleton
    .getVariableDeclarations()
    .find((d) => d.getNameNode().getText() === "[width]")
  const call = declaration?.getInitializer()
  if (
    !declaration ||
    !Node.isCallExpression(call) ||
    call.getExpression().getText() !== "React.useState"
  ) {
    fail(ctx, "SidebarMenuSkeleton's width changed")
  }
  const [init] = call.getArguments()
  declaration.replaceWithText(`width = (${init?.getText()})()`)
}

function checkClean(ctx: TransformContext): void {
  const text = ctx.sf.getFullText()
  for (const leftover of [
    "useIsMobile",
    "React.useState",
    "React.useEffect",
    "window.",
    "document.",
  ]) {
    if (text.includes(leftover)) fail(ctx, `${leftover} is still used`)
  }
}

const serverSidebar: TransformStep = {
  name: STEP,
  run(ctx) {
    removeHookImport(ctx)
    serverProvider(ctx)
    desktopAndMobile(ctx)
    scriptedButtons(ctx)
    booleanState(ctx)
    markTooltips(ctx)
    skeletonWidth(ctx)
    checkClean(ctx)
    ctx.log.push(`${STEP}: state from props, behavior from /shadcn/sidebar.js`)
  },
}

export const sidebarAdapter: ComponentAdapter = {
  kind: "script",
  behaviors: ["sidebar"],
  domParity: "native-structure",
  resolves: [
    "event-handler:onClick",
    "event-handler:onOpenChange",
    "react-hook:useEffect",
    "react-hook:useIsMobile",
    "react-hook:useState",
    "react-runtime-api:React.useEffect",
    "react-runtime-api:React.useState",
    "registry-dependency:use-mobile",
    "registry-import:@/registry/<style>/hooks/use-mobile",
  ],
  notes: [
    'Toggling (the trigger, the rail and Ctrl/Cmd+B), remembering the state in the `sidebar_state` cookie and the mobile sheet need the client script `/shadcn/sidebar.js` (`<script type="module" src="/shadcn/sidebar.js">`); without it the sidebar shows in its initial state on wide screens and not at all on narrow ones.',
    "On the server the state comes from `open` or `defaultOpen` (read the cookie to restore it); `onOpenChange` is not supported, and `useSidebar()` only reports that state (its setters throw on the server). The mobile sheet is rendered once, empty: the script moves the sidebar's content into it while it is open.",
  ],
  steps: [{ after: "remove-directives", step: serverSidebar }],
}
