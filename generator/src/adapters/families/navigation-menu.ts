/**
 * Base UI's NavigationMenu: triggers and links render on the server, each
 * item's content waits hidden in its item, and the positioner is a manual
 * native popover placed with CSS anchor positioning under the open item's
 * trigger. The client script \`public/shadcn/navigation-menu.js\`
 * (docs/adr/0025) opens items on hover, click and the keyboard, moves the open
 * item's content into the shared viewport and sets Base UI's state
 * attributes, so upstream classes apply unchanged.
 */
import { SyntaxKind } from "ts-morph"
import { insertAnchorHelpers } from "./anchor"
import type { FamilyRule } from "./types"
import {
  forEachPart,
  helperEntries,
  registerHelpers,
  replacePartTypes,
} from "./util"

const HELPERS = `type NavigationMenuRootProps = ComponentProps<"nav"> & {
  /** Milliseconds before a hovered trigger opens its content. */
  delay?: number | undefined
  /** Milliseconds before the content closes after the pointer leaves. */
  closeDelay?: number | undefined
  orientation?: "horizontal" | "vertical" | undefined
}

interface NavigationMenuState {
  id: string
  orientation: "horizontal" | "vertical"
  /** Items claim their index in render order. */
  items: number
}

const NavigationMenuContext = createContext<NavigationMenuState | null>(null)

function useNavigationMenuContext(): NavigationMenuState {
  const context = useContext(NavigationMenuContext)
  if (!context) throw new Error("NavigationMenu parts must be rendered inside <NavigationMenu>")
  return context
}

/** The index of the enclosing item: its trigger is the anchor while it is open. */
const NavigationMenuItemContext = createContext<number | null>(null)

/**
 * The root of a navigation menu; the client script \`/shadcn/navigation-menu.js\`
 * finds the parts by \`data-navigation-menu\` and moves the open item's content
 * into the shared viewport, like Base UI.
 */
function NavigationMenuRootElement({
  id,
  delay = 50,
  closeDelay = 50,
  orientation = "horizontal",
  ...props
}: NavigationMenuRootProps) {
  const generated = useId().replaceAll(":", "-")
  const menuId = id ?? \`navigation-menu\${generated}\`
  return (
    <NavigationMenuContext.Provider value={{ id: menuId, orientation, items: 0 }}>
      <nav
        id={menuId}
        data-navigation-menu={menuId}
        data-orientation={orientation}
        data-delay={delay}
        data-close-delay={closeDelay}
        {...props}
      />
    </NavigationMenuContext.Provider>
  )
}

function NavigationMenuListElement(props: ComponentProps<"ul">) {
  return <ul {...props} />
}

type NavigationMenuItemProps = ComponentProps<"li"> & {
  /** Identifies the item (Base UI's \`value\`); unused on the server. */
  value?: string | undefined
}

function NavigationMenuItemElement({ value, ...props }: NavigationMenuItemProps) {
  const state = useNavigationMenuContext()
  const index = state.items++
  return (
    <NavigationMenuItemContext.Provider value={index}>
      <li data-navigation-menu-item={value ?? String(index)} {...props} />
    </NavigationMenuItemContext.Provider>
  )
}

function navigationMenuAnchor(state: NavigationMenuState, index: number | null): string {
  return \`--\${state.id}-\${index ?? "root"}\`
}

function NavigationMenuTriggerElement({
  type = "button",
  render,
  style,
  ...props
}: ComponentProps<"button", RenderProp>) {
  const state = useNavigationMenuContext()
  const index = useContext(NavigationMenuItemContext)
  return renderElement(
    <button
      type={type}
      aria-expanded="false"
      data-navigation-menu-trigger=""
      style={withStyle(style, { "anchor-name": navigationMenuAnchor(state, index) })}
      {...props}
    />,
    render
  )
}

/** Hidden in its item; the script shows it inside the viewport while its item is open. */
function NavigationMenuContentElement(props: ComponentProps<"div">) {
  return <div hidden data-navigation-menu-content="" {...props} />
}

function NavigationMenuPortalElement({ children }: { children?: Child }) {
  return <>{children}</>
}

type NavigationMenuPositionerProps = ComponentProps<"div"> & {
  side?: AnchorSide | undefined
  align?: AnchorAlign | undefined
  sideOffset?: number | undefined
  alignOffset?: number | undefined
}

/** A manual native popover anchored (CSS anchor positioning) to the open item's trigger. */
function NavigationMenuPositionerElement({
  side = "bottom",
  align = "center",
  sideOffset = 0,
  alignOffset = 0,
  style,
  children,
  ...props
}: NavigationMenuPositionerProps) {
  const state = useNavigationMenuContext()
  const placement = { side, align, sideOffset, alignOffset }
  return (
    <AnchorPlacementContext.Provider value={placement}>
      <div
        id={\`\${state.id}-positioner\`}
        popover="manual"
        role="presentation"
        data-side={side}
        data-align={align}
        data-navigation-menu-positioner=""
        style={withStyle(style, {
          ...anchorPlacementStyle(navigationMenuAnchor(state, null), placement),
          inset: "auto",
          overflow: "visible",
          background: "transparent",
          color: "inherit",
        })}
        {...props}
      >
        {children}
      </div>
    </AnchorPlacementContext.Provider>
  )
}

function NavigationMenuPopupElement({ style, ...props }: ComponentProps<"nav">) {
  const state = useNavigationMenuContext()
  const placement = useContext(AnchorPlacementContext)
  return (
    <nav
      id={\`\${state.id}-popup\`}
      tabindex={-1}
      data-side={placement.side}
      data-align={placement.align}
      style={withStyle(style, { "--popup-width": "auto", "--popup-height": "auto" })}
      {...props}
    />
  )
}

function NavigationMenuViewportElement(props: ComponentProps<"div">) {
  return <div data-navigation-menu-viewport="" {...props} />
}

type NavigationMenuLinkProps = ComponentProps<"a", RenderProp> & {
  /** The link to the current page. */
  active?: boolean | undefined
  /** Close the menu when the link is clicked. */
  closeOnClick?: boolean | undefined
}

function NavigationMenuLinkElement({ active, closeOnClick, render, ...props }: NavigationMenuLinkProps) {
  return renderElement(
    <a
      aria-current={active ? "page" : undefined}
      data-active={active ? "" : undefined}
      data-close-on-click={closeOnClick ? "" : undefined}
      {...props}
    />,
    render
  )
}

function NavigationMenuIconElement(props: ComponentProps<"span">) {
  return <span aria-hidden="true" {...props} />
}`

const HELPER_ENTRIES = helperEntries(HELPERS)

const PART_TYPES: Readonly<Record<string, string>> = {
  Root: "NavigationMenuRootProps",
  List: 'ComponentProps<"ul">',
  Item: "NavigationMenuItemProps",
  Trigger: 'ComponentProps<"button", RenderProp>',
  Content: 'ComponentProps<"div">',
  Portal: "{ children?: Child }",
  Positioner: "NavigationMenuPositionerProps",
  Popup: 'ComponentProps<"nav">',
  Viewport: 'ComponentProps<"div">',
  Link: "NavigationMenuLinkProps",
  Icon: 'ComponentProps<"span">',
}

const tagOf = (part: string) => `NavigationMenu${part}Element`

export const navigationMenuFamily: FamilyRule = {
  module: "@base-ui/react/navigation-menu",
  exportName: "NavigationMenu",
  kind: "script",
  behaviors: ["navigation-menu"],
  domParity: "native-structure",
  renderableParts: ["Trigger", "Link"],
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/navigation-menu",
  notes: [
    'Opening items on hover, click and the keyboard needs the client script `/shadcn/navigation-menu.js` (`<script type="module" src="/shadcn/navigation-menu.js">`); without it only the top-level links work. The content shows in a native popover placed with CSS anchor positioning under the open item\'s trigger.',
    "Controlled state (`value`, `defaultValue`, `onValueChange`) is not supported. Switching items does not animate the popup's size.",
  ],
  transform(ctx, local) {
    const step = "family:NavigationMenu"
    replacePartTypes(ctx, step, local, PART_TYPES)
    forEachPart(ctx, local, (element) => {
      if (!(element.part in PART_TYPES)) {
        throw new Error(
          `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
        )
      }
      const tag = tagOf(element.part)
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
      throw new Error(
        `[${ctx.name}] ${step}: unsupported use of ${access.getText()}`
      )
    }
    registerHelpers(ctx, HELPER_ENTRIES)
    insertAnchorHelpers(ctx)
    ctx.needsComponentProps = true
    ctx.needsRender = true
    ctx.log.push(
      `${step}: ${local} on a native popover with the navigation menu script`
    )
  },
}
