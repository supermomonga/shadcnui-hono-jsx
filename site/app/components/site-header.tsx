import { Plus } from "lucide"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { siteConfig } from "@/lib/site"
import { GitHubIcon, Icon } from "./icon"
import { MainNav } from "./main-nav"
import { MobileNav } from "./mobile-nav"
import { ModeSwitcher } from "./mode-switcher"

export function SiteHeader({ pathname }: { pathname: string }) {
  return (
    <header class="sticky top-0 z-50 w-full bg-background">
      <div class="container-wrapper px-6 group-has-data-[slot=designer]/layout:max-w-none 3xl:fixed:px-0">
        <div class="flex h-(--header-height) items-center **:data-[slot=separator]:h-4! **:data-[slot=separator]:self-center 3xl:fixed:container">
          <MobileNav class="flex lg:hidden" />
          <a
            href="/"
            class="mr-4 hidden items-center gap-2 lg:flex"
            aria-label={siteConfig.name}
          >
            <Logo class="size-5" />
          </a>
          <MainNav pathname={pathname} class="hidden lg:flex" />
          <div class="ml-auto flex items-center gap-2 md:flex-1 md:justify-end">
            <Separator orientation="vertical" class="ml-2 hidden lg:block" />
            <Button
              size="sm"
              variant="ghost"
              class="h-8 shadow-none"
              render={
                <a
                  href={siteConfig.links.github}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <GitHubIcon class="size-4" />
              <span class="sr-only">GitHub</span>
            </Button>
            <Separator orientation="vertical" />
            <ModeSwitcher />
            <div class="flex items-center gap-2 group-has-data-[slot=designer]/layout:hidden">
              <Separator orientation="vertical" />
              <Button
                size="sm"
                class="h-[31px] rounded-lg"
                render={<a href="/create" />}
              >
                <Icon icon={Plus} />
                New
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

/** shadcn/ui's mark with Hono's flame. */
export function Logo({ class: className }: { class?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      class={className}
      aria-hidden="true"
    >
      <rect width="256" height="256" fill="none" />
      <line
        x1="208"
        y1="128"
        x2="128"
        y2="208"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="32"
      />
      <line
        x1="192"
        y1="40"
        x2="40"
        y2="192"
        fill="none"
        stroke="#ff5b11"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="32"
      />
    </svg>
  )
}
