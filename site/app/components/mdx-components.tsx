import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Callout, Step, Steps } from "./callout"
import { CodeBlock, CodeBlockCommand } from "./code-block"
import { CompatibilityTable, UnsupportedList } from "./compatibility-table"
import { ComponentInstall } from "./component-install"
import { ComponentNotes } from "./component-notes"
import { ComponentPreview } from "./component-preview"
import { ComponentsList } from "./components-list"

function LinkedCard({
  href,
  class: className,
  children,
}: {
  href: string
  class?: string
  children?: unknown
}) {
  return (
    <a
      href={href}
      data-not-typeset=""
      class={cn(
        "flex w-full flex-col items-center rounded-2xl bg-surface p-6 text-surface-foreground transition-colors hover:bg-surface/80 sm:p-10",
        className
      )}
    >
      {children as never}
    </a>
  )
}

function Table(props: Record<string, unknown>) {
  return (
    <div class="typeset-scroll scroll-fade-x scrollbar-none *:[table]:w-full">
      <table {...props} />
    </div>
  )
}

/** Images of upstream's docs are served by ui.shadcn.com. */
function Image({
  src,
  alt,
  width,
  height,
  class: className,
}: {
  src: string
  alt: string
  width?: string
  height?: string
  class?: string
}) {
  return (
    <img
      src={src.startsWith("/") ? `https://ui.shadcn.com${src}` : src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      class={cn("mt-6 rounded-2xl border", className)}
    />
  )
}

function MdxButton({
  class: className,
  ...props
}: Parameters<typeof Button>[0]) {
  return <Button class={cn("not-typeset", className)} {...props} />
}

/** Components MDX pages can use, and the elements they replace. */
export const mdxComponents = {
  table: Table,
  Button: MdxButton,
  Callout,
  CodeBlock,
  CodeBlockCommand,
  CompatibilityTable,
  ComponentInstall,
  ComponentNotes,
  ComponentPreview,
  ComponentsList,
  Image,
  Kbd,
  LinkedCard,
  Step,
  Steps,
  UnsupportedList,
}
