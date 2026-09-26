import { cn } from "cn"
import { raw } from "hono/html"
import { Check, Copy, Terminal } from "lucide"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PACKAGE_MANAGERS, type PackageManager } from "@/lib/commands"
import { Icon } from "./icon"

/** Copies `value`, or the text of the active panel of the nearest tabs (see app/client.ts). */
export function CopyButton({
  value,
  class: className,
}: {
  value?: string
  class?: string
}) {
  return (
    <Button
      data-slot="copy-button"
      data-copy={value ?? ""}
      size="icon"
      variant="ghost"
      class={cn(
        "group/copy absolute top-3 right-2 z-10 size-7 bg-code hover:opacity-100 focus-visible:opacity-100",
        className
      )}
    >
      <span class="sr-only">Copy</span>
      <Icon icon={Copy} class="group-data-copied/copy:hidden" />
      <Icon icon={Check} class="hidden group-data-copied/copy:block" />
    </Button>
  )
}

/** A code block highlighted at build time (see lib/mdx/rehype-code.ts). */
export function CodeBlock({
  html,
  raw: source,
  title,
  language,
  class: className,
}: {
  html: string
  raw: string
  title?: string
  language?: string
  class?: string
}) {
  return (
    <figure
      data-code-figure=""
      data-not-typeset=""
      data-language={language}
      class={className}
    >
      {title && (
        <figcaption
          data-code-title=""
          class="flex items-center gap-2 text-code-foreground"
        >
          {title}
        </figcaption>
      )}
      <CopyButton value={source} class={title ? "top-1.5" : undefined} />
      {raw(html)}
    </figure>
  )
}

/** An npm command with a tab per package manager; the choice is remembered. */
export function CodeBlockCommand(commands: Record<PackageManager, string>) {
  return (
    <figure data-code-figure="" data-not-typeset="" data-command="">
      <div class="overflow-x-auto">
        <Tabs defaultValue="pnpm" class="gap-0" data-pm-tabs="">
          <div class="flex items-center gap-2 border-b border-border/50 px-3 py-1">
            <div class="flex size-4 items-center justify-center rounded-[1px] bg-foreground opacity-70">
              <Icon icon={Terminal} class="size-3 text-code" />
            </div>
            <TabsList class="rounded-none bg-transparent p-0">
              {PACKAGE_MANAGERS.map((pm) => (
                <TabsTrigger
                  value={pm}
                  data-pm={pm}
                  class="h-7 border border-transparent pt-0.5 shadow-none! data-active:border-input data-active:bg-background!"
                >
                  {pm}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div class="no-scrollbar overflow-x-auto">
            {PACKAGE_MANAGERS.map((pm) => (
              <TabsContent value={pm} class="mt-0 px-4 py-3.5">
                <pre>
                  <code
                    class="relative font-mono text-sm leading-none"
                    data-language="bash"
                  >
                    {commands[pm]}
                  </code>
                </pre>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
      <CopyButton class="top-2" />
    </figure>
  )
}
