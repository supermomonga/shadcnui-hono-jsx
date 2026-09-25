/**
 * Base UI's Menu on a native popover: the trigger opens it with Invoker
 * Commands (so it opens without JavaScript) and CSS anchor positioning places
 * it, like Popover. The client script `public/shadcn/menu.js` (docs/adr/0025)
 * adds the menu pattern: focus handling, arrow keys, typeahead, checkbox and
 * radio items, submenus and closing after a choice. Base UI's roles and state
 * attributes are rendered, so upstream classes apply unchanged.
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

const SHARED_HELPERS = `type MenuRootProps = {
  id?: string | undefined
  /** Wrap focus from the last item to the first with the arrow keys. */
  loopFocus?: boolean | undefined
  children?: Child
}

type MenuItemProps = ComponentProps<"div", RenderProp> & {
  disabled?: boolean | undefined
  /** Close the menu when the item is chosen. */
  closeOnClick?: boolean | undefined
}

type MenuCheckboxItemProps = MenuItemProps & {
  checked?: boolean | undefined
  defaultChecked?: boolean | undefined
}

type MenuRadioGroupProps = ComponentProps<"div"> & {
  value?: string | undefined
  defaultValue?: string | undefined
}

type MenuRadioItemProps = MenuItemProps & { value: string }

interface MenuContextValue {
  id: string
  anchor: string
  triggerId: string
  /** Whether a trigger element labels the popup (not for context menus). */
  labelled: boolean
  loopFocus: boolean
}

/**
 * A context shared by every generated file (the same key gives the same
 * context), so parts rendered by sibling files connect: a menubar in
 * menubar.tsx and the menus of dropdown-menu.tsx inside it.
 */
function sharedContext<T>(key: string, fallback: T): Context<T> {
  const registry = globalThis as unknown as Record<symbol, Context<T> | undefined>
  const symbol = Symbol.for(\`shadcnui-hono-jsx:\${key}\`)
  registry[symbol] ??= createContext(fallback)
  return registry[symbol]
}

const MenuContext = sharedContext<MenuContextValue | null>("menu", null)

/** Set by a menubar: its menu triggers are menuitems, and the first one is tabbable. */
const MenubarContext = sharedContext<{ claimed: boolean } | null>("menubar", null)

function useMenuContext(): MenuContextValue {
  const context = useContext(MenuContext)
  if (!context) throw new Error("Menu parts must be rendered inside a menu")
  return context
}

function menuContextValue(id: string, loopFocus: boolean, labelled = true): MenuContextValue {
  return { id, anchor: \`--\${id}\`, triggerId: \`\${id}-trigger\`, labelled, loopFocus }
}

/** Labels groups (and radio groups) by their label element. */
const MenuGroupContext = sharedContext<{ labelId: string; value?: string | undefined } | null>(
  "menu-group",
  null
)

/** Attributes every item renders, like Base UI's. */
function menuItemAttributes(role: string, disabled: boolean | undefined, closeOnClick: boolean | undefined) {
  return {
    role,
    // Focusable without the script too, so the keyboard can reach the items.
    tabindex: 0,
    "aria-disabled": disabled ? "true" : undefined,
    "data-disabled": disabled ? "" : undefined,
    "data-close-on-click": closeOnClick === undefined ? undefined : String(closeOnClick),
  }
}

/** Checked state attributes of checkbox and radio items. */
function menuCheckedAttributes(checked: boolean) {
  return {
    "aria-checked": checked ? "true" : "false",
    "data-checked": checked ? "" : undefined,
    "data-unchecked": checked ? undefined : "",
  }
}`

/** File-local implementation of each part, inserted only when the file uses it. */
const PART_HELPERS: Readonly<Record<string, string>> = {
  Root: `/** Connects the trigger (the anchor) and the native popover of a menu. */
function MenuRootElement({ id, loopFocus = true, children }: MenuRootProps) {
  const generated = useId().replaceAll(":", "-")
  return (
    <MenuContext.Provider
      value={menuContextValue(id ?? \`menu\${generated}\`, loopFocus, LABELLED_BY_TRIGGER)}
    >
      {children}
    </MenuContext.Provider>
  )
}`,
  SubmenuRoot: `/** A nested menu, opened from its submenu trigger by the script. */
function MenuSubmenuRootElement({ loopFocus, children }: MenuRootProps) {
  const parent = useMenuContext()
  const generated = useId().replaceAll(":", "-")
  return (
    <MenuContext.Provider
      value={menuContextValue(\`\${parent.id}-sub\${generated}\`, loopFocus ?? parent.loopFocus)}
    >
      {children}
    </MenuContext.Provider>
  )
}`,
  Trigger: `function MenuTriggerElement({
  type = "button",
  render,
  style,
  ...props
}: ComponentProps<"button", RenderProp>) {
  const menu = useMenuContext()
  // In a menubar the triggers are menuitems with a roving tab stop, like Base UI.
  const menubar = useContext(MenubarContext)
  const first = menubar !== null && !menubar.claimed
  if (menubar) menubar.claimed = true
  return renderElement(
    <button
      type={type}
      id={menu.triggerId}
      command="toggle-popover"
      commandfor={menu.id}
      role={menubar ? "menuitem" : undefined}
      tabindex={menubar ? (first ? 0 : -1) : undefined}
      aria-haspopup="menu"
      aria-expanded="false"
      style={withStyle(style, { "anchor-name": menu.anchor })}
      {...props}
    />,
    render
  )
}`,
  SubmenuTrigger: `function MenuSubmenuTriggerElement({
  disabled,
  style,
  ...props
}: MenuItemProps) {
  const menu = useMenuContext()
  return (
    <div
      role="menuitem"
      tabindex={0}
      aria-disabled={disabled ? "true" : undefined}
      data-disabled={disabled ? "" : undefined}
      id={menu.triggerId}
      aria-haspopup="menu"
      aria-expanded="false"
      aria-controls={menu.id}
      style={withStyle(style, { "anchor-name": menu.anchor })}
      {...props}
    />
  )
}`,
  Portal: `/** The native popover renders in the top layer, so no portal is needed. */
function MenuPortalElement({ children }: { children?: Child }) {
  return <>{children}</>
}`,
  Popup: `function MenuPopupElement({ style, ...props }: ComponentProps<"div">) {
  const menu = useMenuContext()
  const placement = useContext(AnchorPlacementContext)
  return (
    <div
      id={menu.id}
      popover="auto"
      role="menu"
      tabindex={-1}
      aria-labelledby={menu.labelled ? menu.triggerId : undefined}
      data-side={placement.side}
      data-align={placement.align}
      data-loop-focus={menu.loopFocus ? undefined : "false"}
      style={withStyle(style, anchorPlacementStyle(menu.anchor, placement))}
      {...props}
    />
  )
}`,
  Group: `function MenuGroupElement(props: ComponentProps<"div">) {
  const labelId = \`menu-group\${useId().replaceAll(":", "-")}\`
  return (
    <MenuGroupContext.Provider value={{ labelId }}>
      <div role="group" aria-labelledby={labelId} {...props} />
    </MenuGroupContext.Provider>
  )
}`,
  GroupLabel: `function MenuGroupLabelElement(props: ComponentProps<"div">) {
  return <div id={useContext(MenuGroupContext)?.labelId} aria-hidden="true" {...props} />
}`,
  Item: `function MenuItemElement({ disabled, closeOnClick, render, ...props }: MenuItemProps) {
  return renderElement(
    <div {...menuItemAttributes("menuitem", disabled, closeOnClick)} {...props} />,
    render
  )
}`,
  CheckboxItem: `function MenuCheckboxItemElement({
  checked,
  defaultChecked = false,
  disabled,
  closeOnClick,
  render,
  ...props
}: MenuCheckboxItemProps) {
  return renderElement(
    <div
      {...menuItemAttributes("menuitemcheckbox", disabled, closeOnClick)}
      {...menuCheckedAttributes(checked ?? defaultChecked)}
      {...props}
    />,
    render
  )
}`,
  RadioGroup: `function MenuRadioGroupElement({ value, defaultValue, ...props }: MenuRadioGroupProps) {
  const labelId = \`menu-group\${useId().replaceAll(":", "-")}\`
  return (
    <MenuGroupContext.Provider value={{ labelId, value: value ?? defaultValue }}>
      <div role="group" aria-labelledby={labelId} {...props} />
    </MenuGroupContext.Provider>
  )
}`,
  RadioItem: `function MenuRadioItemElement({
  value,
  disabled,
  closeOnClick,
  render,
  ...props
}: MenuRadioItemProps) {
  const group = useContext(MenuGroupContext)
  return renderElement(
    <div
      {...menuItemAttributes("menuitemradio", disabled, closeOnClick)}
      {...menuCheckedAttributes(group?.value === value)}
      data-value={value}
      {...props}
    />,
    render
  )
}`,
  CheckboxItemIndicator: `/** Shown while the item is checked (Base UI mounts it only then). */
function MenuItemIndicatorElement(props: ComponentProps<"span">) {
  return <span aria-hidden="true" class="in-[[aria-checked=false]]:hidden" {...props} />
}`,
  Separator: `function MenuSeparatorElement(props: ComponentProps<"div">) {
  return (
    <div role="separator" aria-orientation="horizontal" data-orientation="horizontal" {...props} />
  )
}`,
}

/** Parts rendered by another part's helper. */
const ALIASES: Readonly<Record<string, string>> = {
  RadioItemIndicator: "CheckboxItemIndicator",
  Positioner: "Positioner",
}

const TYPES: Readonly<Record<string, string>> = {
  Root: "MenuRootProps",
  SubmenuRoot: "MenuRootProps",
  Trigger: 'ComponentProps<"button", RenderProp>',
  SubmenuTrigger: "MenuItemProps",
  Portal: "{ children?: Child }",
  Positioner: "AnchorPositionerProps",
  Popup: 'ComponentProps<"div">',
  Group: 'ComponentProps<"div">',
  GroupLabel: 'ComponentProps<"div">',
  Item: "MenuItemProps",
  CheckboxItem: "MenuCheckboxItemProps",
  CheckboxItemIndicator: 'ComponentProps<"span">',
  RadioGroup: "MenuRadioGroupProps",
  RadioItem: "MenuRadioItemProps",
  RadioItemIndicator: 'ComponentProps<"span">',
  Separator: 'ComponentProps<"div">',
}

/**
 * A context menu opens at the pointer on a right click (the script moves an
 * invisible anchor there), so its trigger is an area, not a button, and no
 * trigger labels the popup.
 */
const CONTEXT_TRIGGER = `/** The area that opens the menu on a right click, with the anchor the script moves to the pointer. */
function MenuTriggerElement({ children, ...props }: ComponentProps<"div">) {
  const menu = useMenuContext()
  return (
    <div data-context-menu={menu.id} {...props}>
      {children}
      <span
        aria-hidden="true"
        data-context-menu-anchor=""
        style={\`position:fixed;inset:0 auto auto 0;width:0;height:0;anchor-name:\${menu.anchor}\`}
      />
    </div>
  )
}`

interface MenuFamilyOptions {
  module: string
  exportName: string
  context: boolean
  notes: readonly string[]
}

function createMenuFamily(o: MenuFamilyOptions): FamilyRule {
  const step = `family:${o.exportName}`
  const partHelpers: Record<string, string> = {
    ...PART_HELPERS,
    ...(o.context ? { Trigger: CONTEXT_TRIGGER } : {}),
  }
  const types: Record<string, string> = {
    ...TYPES,
    ...(o.context ? { Trigger: 'ComponentProps<"div">' } : {}),
  }
  return {
    module: o.module,
    exportName: o.exportName,
    kind: "script",
    behaviors: ["menu"],
    domParity: "native-structure",
    renderableParts: o.context
      ? ["Item", "CheckboxItem", "RadioItem"]
      : ["Trigger", "Item", "CheckboxItem", "RadioItem"],
    reference: `https://github.com/mui/base-ui/tree/master/packages/react/src/${o.module.split("/").pop()}`,
    notes: o.notes,
    transform(ctx, local) {
      replacePartTypes(ctx, step, local, types)
      forEachPart(ctx, local, (element) => {
        const part = ALIASES[element.part] ?? element.part
        if (!(part in partHelpers) && part !== "Positioner") {
          throw new Error(
            `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
          )
        }
        if (part === "Popup") {
          element.mapClasses(mapPopupClasses, [ANCHORED_POPUP_RESET])
        }
        const tag =
          part === "Positioner"
            ? "AnchorPositioner"
            : part === "CheckboxItemIndicator"
              ? "MenuItemIndicatorElement"
              : `Menu${part}Element`
        const attrs = element.attributes().join(" ")
        element.replace(
          element.children
            ? `<${tag} ${attrs}>${element.children}</${tag}>`
            : `<${tag} ${attrs} />`
        )
      })
      const labelled = `/** Whether the root's trigger labels its popup (a button, not a context menu area). */
const LABELLED_BY_TRIGGER = ${!o.context}`
      registerHelpers(
        ctx,
        helperEntries(
          [SHARED_HELPERS, labelled, ...Object.values(partHelpers)].join("\n\n")
        )
      )
      insertAnchorHelpers(ctx)
      ctx.needsComponentProps = true
      ctx.needsRender = true
      ctx.log.push(`${step}: ${local} on a native popover with the menu script`)
    },
  }
}

const ITEM_NOTES =
  'Items have no `onClick` on the server: use `render` for links (`render={<a href="/settings" />}`) or form buttons. Controlled state (`open`, `onOpenChange`, `checked`/`onCheckedChange`, `value`/`onValueChange`), `modal` (page scroll is not locked) and `openOnHover` on the root are not supported.'

export const menuFamily = createMenuFamily({
  module: "@base-ui/react/menu",
  exportName: "Menu",
  context: false,
  notes: [
    'The menu is a native popover placed with CSS anchor positioning, so it opens without JavaScript (placement needs Chrome 135, Firefox 147 or Safari 26.2). The client script `/shadcn/menu.js` (`<script type="module" src="/shadcn/menu.js">`) adds the menu behavior: focus handling, arrow keys, typeahead, checkbox and radio items, submenus and closing after a choice.',
    ITEM_NOTES,
  ],
})

export const contextMenuFamily = createMenuFamily({
  module: "@base-ui/react/context-menu",
  exportName: "ContextMenu",
  context: true,
  notes: [
    'A right click on the trigger area opens the menu at the pointer; this needs the client script `/shadcn/menu.js` (`<script type="module" src="/shadcn/menu.js">`), without which the browser\'s own context menu appears. The menu is a native popover placed with CSS anchor positioning, and the script adds the menu behavior (focus, arrow keys, typeahead, checkbox and radio items, submenus). Long presses on touch screens do not open it.',
    ITEM_NOTES,
  ],
})

const MENUBAR_HELPERS = `type MenubarRootProps = ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical" | undefined
  /** Wrap focus from the last menu to the first with the arrow keys. */
  loopFocus?: boolean | undefined
}

/** A bar of menus: their triggers are menuitems, moved between with the arrow keys. */
function MenubarRootElement({ orientation = "horizontal", loopFocus, ...props }: MenubarRootProps) {
  return (
    <MenubarContext.Provider value={{ claimed: false }}>
      <div
        role="menubar"
        aria-orientation={orientation}
        data-orientation={orientation}
        data-loop-focus={loopFocus === false ? "false" : undefined}
        {...props}
      />
    </MenubarContext.Provider>
  )
}`

export const menubarFamily: FamilyRule = {
  module: "@base-ui/react/menubar",
  exportName: "Menubar",
  kind: "script",
  behaviors: ["menu"],
  domParity: "native-structure",
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/menubar",
  notes: [
    'Moving between menus with the arrow keys and switching menus by hovering while one is open need the client script `/shadcn/menu.js` (`<script type="module" src="/shadcn/menu.js">`); without it each menu still opens with its trigger. `modal` is not supported.',
  ],
  transform(ctx, local) {
    const step = "family:Menubar"
    replacePartTypes(ctx, step, local, { "": "MenubarRootProps" })
    forEachPart(ctx, local, (element) => {
      if (element.part !== "") {
        throw new Error(
          `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
        )
      }
      const attrs = element.attributes().join(" ")
      element.replace(
        element.children
          ? `<MenubarRootElement ${attrs}>${element.children}</MenubarRootElement>`
          : `<MenubarRootElement ${attrs} />`
      )
    })
    registerHelpers(
      ctx,
      helperEntries([SHARED_HELPERS, MENUBAR_HELPERS].join("\n\n"))
    )
    ctx.needsComponentProps = true
    ctx.log.push(`${step}: ${local} as a menubar`)
  },
}
