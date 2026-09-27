import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/lib/site"

export function MainNav({
  pathname,
  class: className,
}: {
  pathname: string
  class?: string
}) {
  return (
    <nav class={cn("items-center gap-0", className)}>
      {siteConfig.navItems.map((item) => (
        <Button
          variant="ghost"
          size="sm"
          class="px-2.5 data-[active=true]:text-primary"
          render={
            <a
              href={item.href}
              data-active={String(
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(
                      item.href.replace(/\/installation$/, "")
                    )
              )}
            />
          }
        >
          {item.label}
        </Button>
      ))}
    </nav>
  )
}
