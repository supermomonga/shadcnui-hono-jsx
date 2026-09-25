/**
 * Base UI's Tabs rendered on the server with the ARIA tabs pattern (tablist,
 * tabs with `aria-selected`, labelled panels) and Base UI's state attributes
 * (`data-active`), so upstream classes apply unchanged. Switching tabs needs
 * the optional client script `public/shadcn/tabs.js` (docs/adr/0025);
 * without it, the selected panel is shown.
 */
import type { FamilyRule } from "./types"
import { forEachPart, insertHelpers, replacePartTypes } from "./util"

const HELPERS = `type TabsValue = string | number

type TabsRootProps = ComponentProps<"div"> & {
  /** Value of the tab that is selected on load (the first enabled tab by default). */
  defaultValue?: TabsValue | undefined
  value?: TabsValue | undefined
  orientation?: "horizontal" | "vertical" | undefined
}

type TabsListProps = ComponentProps<"div"> & {
  /** Select tabs as the arrow keys focus them (otherwise Enter or Space selects). */
  activateOnFocus?: boolean | undefined
  /** Wrap focus from the last tab to the first with the arrow keys. */
  loopFocus?: boolean | undefined
}

type TabsTabProps = ComponentProps<"button"> & {
  value: TabsValue
  disabled?: boolean | undefined
}

type TabsPanelProps = ComponentProps<"div"> & { value: TabsValue }

interface TabsState {
  id: string
  /** Set by the first enabled tab when no value is given. */
  value: TabsValue | undefined
  orientation: "horizontal" | "vertical"
}

const TabsContext = createContext<TabsState | null>(null)

function useTabsContext(): TabsState {
  const context = useContext(TabsContext)
  if (!context) throw new Error("Tabs parts must be rendered inside <Tabs>")
  return context
}

/** Id of a tab or panel for a value (ids cannot contain spaces). */
function tabsId(state: TabsState, part: "tab" | "panel", value: TabsValue): string {
  return \`\${state.id}-\${part}-\${String(value).replace(/[^\\w-]/g, "_")}\`
}

function TabsRootElement({
  value,
  defaultValue,
  orientation = "horizontal",
  ...props
}: TabsRootProps) {
  const id = useId().replaceAll(":", "-")
  return (
    <TabsContext.Provider
      value={{ id: \`tabs\${id}\`, value: value ?? defaultValue, orientation }}
    >
      <div data-orientation={orientation} {...props} />
    </TabsContext.Provider>
  )
}

function TabsListElement({ activateOnFocus, loopFocus, ...props }: TabsListProps) {
  const { orientation } = useTabsContext()
  return (
    <div
      role="tablist"
      aria-orientation={orientation === "vertical" ? "vertical" : undefined}
      data-orientation={orientation}
      data-activate-on-focus={activateOnFocus ? "" : undefined}
      data-loop-focus={loopFocus === false ? "false" : undefined}
      {...props}
    />
  )
}

function TabsTabElement({ value, disabled, ...props }: TabsTabProps) {
  const state = useTabsContext()
  if (state.value === undefined && !disabled) state.value = value
  const active = state.value === value
  return (
    <button
      type="button"
      role="tab"
      id={tabsId(state, "tab", value)}
      aria-controls={tabsId(state, "panel", value)}
      aria-selected={active ? "true" : "false"}
      aria-disabled={disabled ? "true" : undefined}
      tabindex={active ? 0 : -1}
      data-active={active ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-orientation={state.orientation}
      {...props}
    />
  )
}

function TabsPanelElement({ value, ...props }: TabsPanelProps) {
  const state = useTabsContext()
  return (
    <div
      role="tabpanel"
      id={tabsId(state, "panel", value)}
      aria-labelledby={tabsId(state, "tab", value)}
      tabindex={0}
      hidden={state.value !== value || undefined}
      data-orientation={state.orientation}
      {...props}
    />
  )
}`

const PARTS = ["Root", "List", "Tab", "Panel"]

export const tabsFamily: FamilyRule = {
  module: "@base-ui/react/tabs",
  exportName: "Tabs",
  kind: "script",
  behaviors: ["tabs"],
  domParity: "native-structure",
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/tabs",
  notes: [
    'Switching tabs needs the client script `/shadcn/tabs.js` (`<script type="module" src="/shadcn/tabs.js">`); without it the selected panel is shown. Pointer, Enter, Space, arrow keys, Home and End work like Base UI.',
    "Inactive panels are rendered with `hidden` (Base UI does not render them). Controlled state (`onValueChange`) and `render` are not supported; `value`/`defaultValue` set the selected tab.",
  ],
  transform(ctx, local) {
    const step = "family:Tabs"
    replacePartTypes(ctx, step, local, {
      Root: "TabsRootProps",
      List: "TabsListProps",
      Tab: "TabsTabProps",
      Panel: "TabsPanelProps",
    })
    forEachPart(ctx, local, (element) => {
      if (!PARTS.includes(element.part)) {
        throw new Error(
          `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
        )
      }
      const tag = `Tabs${element.part}Element`
      const attrs = element.attributes().join(" ")
      element.replace(
        element.children
          ? `<${tag} ${attrs}>${element.children}</${tag}>`
          : `<${tag} ${attrs} />`
      )
    })
    insertHelpers(ctx, HELPERS)
    ctx.needsComponentProps = true
    for (const value of ["createContext", "useContext", "useId"]) {
      ctx.honoValues.add(value)
    }
    ctx.log.push(`${step}: ${local} with the tabs client script`)
  },
}
