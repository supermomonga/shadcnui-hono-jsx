import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import * as React from "react"

/**
 * A lite alternative to shadcn/ui's Tabs for multi-page apps that needs no
 * JavaScript: the triggers are links in a navigation landmark, each to its
 * tab's page, and the server renders only the current page's content. The
 * trigger whose value matches the root's is the current page (aria-current,
 * and data-active, which upstream's classes style); a disabled trigger has no
 * href. Use the tabs port to switch panels within one page.
 *
 * `lite:<key>` class tokens are upstream's Tabs classes in each style
 * (tabsClasses in generator/src/lite.ts).
 */
type TabsLiteValue = string | number

const TabsLiteContext = React.createContext<{
  value?: TabsLiteValue | undefined
  orientation: "horizontal" | "vertical"
}>({ orientation: "horizontal" })

function TabsLite({
  className,
  value,
  orientation = "horizontal",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** The `value` of the trigger whose page is the current one. */
  value?: TabsLiteValue | undefined
  orientation?: "horizontal" | "vertical" | undefined
}) {
  return (
    <div
      data-slot="tabs-lite"
      data-orientation={orientation}
      className={cn("lite:root", className)}
      {...props}
    >
      <TabsLiteContext.Provider value={{ value, orientation }}>
        {children}
      </TabsLiteContext.Provider>
    </div>
  )
}

const tabsLiteListVariants = cva("lite:list", {
  variants: {
    variant: {
      default: "lite:list-default",
      line: "lite:list-line",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function TabsLiteList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"nav"> & VariantProps<typeof tabsLiteListVariants>) {
  const { orientation } = React.useContext(TabsLiteContext)
  return (
    <nav
      data-slot="tabs-lite-list"
      data-variant={variant}
      data-orientation={orientation}
      className={cn(tabsLiteListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsLiteTrigger({
  className,
  value,
  href,
  disabled = false,
  ...props
}: React.ComponentProps<"a"> & {
  value: TabsLiteValue
  /** Renders the trigger without its href, as a link that is unavailable. */
  disabled?: boolean | undefined
}) {
  const context = React.useContext(TabsLiteContext)
  const active = context.value === value
  return (
    <a
      data-slot="tabs-lite-trigger"
      data-orientation={context.orientation}
      data-active={active ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      role={disabled ? "link" : undefined}
      aria-current={active ? "page" : undefined}
      aria-disabled={disabled ? "true" : undefined}
      href={disabled ? undefined : href}
      className={cn("lite:trigger", className)}
      {...props}
    />
  )
}

function TabsLiteContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tabs-lite-content"
      className={cn("lite:content", className)}
      {...props}
    />
  )
}

export {
  TabsLite,
  TabsLiteContent,
  TabsLiteList,
  TabsLiteTrigger,
  tabsLiteListVariants,
}
