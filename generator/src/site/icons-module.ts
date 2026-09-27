/**
 * `site/generated/icons.tsx`: the icons the site's examples import from
 * `@/components/icons`, where upstream imports `lucide-react`,
 * `@tabler/icons-react` or `@hugeicons/react`. Each renders what the React
 * package renders, like the icons inlined into components (docs/adr/0031).
 */
import { INLINED_LIBRARIES } from "../icons/libraries"
import { resolveLucideIcon } from "../icons/lucide"
import {
  HAS_A11Y_PROP_HELPER,
  renderIconComponent,
} from "../transformers/steps/icons"
import type { IconSource } from "./translate"

const COMPONENT_PROPS = `/** Props of an intrinsic element, with \`class\` as Hono JSX renders it. */
type ComponentProps<T extends keyof JSX.IntrinsicElements | "svg"> = (T extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[T]
  : Record<string, unknown>) & {
  class?: string | undefined
  children?: Child
}`

const HUGEICONS_ICON = `/** An icon of \`@hugeicons/core-free-icons\` (its \`IconSvgObject\`). */
type HugeiconsNode = readonly (readonly [
  tag: string,
  attributes: { readonly [key: string]: string | number },
])[]

/** \`HugeiconsIcon\` of \`@hugeicons/react\` for \`@hugeicons/core-free-icons\` data. */
export function HugeiconsIcon({
  icon,
  strokeWidth = 2,
  class: className = "",
  ...props
}: { icon: HugeiconsNode; strokeWidth?: number } & ComponentProps<"svg">) {
  const nodes = [...icon].sort(([, a], [, b]) =>
    b.opacity !== undefined ? 1 : a.opacity !== undefined ? -1 : 0
  )
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      color="currentColor"
      class={className}
      stroke-width={String(strokeWidth)}
      stroke="currentColor"
      {...props}
    >
      {nodes.map(([tag, attributes]) => {
        const Tag = tag as "path"
        return (
          <Tag
            {...attributes}
            stroke-width={String(strokeWidth)}
            stroke="currentColor"
          />
        )
      })}
    </svg>
  )
}`

/** Exports the function of a rendered icon component. */
const exported = (source: string) =>
  source.replace(/^function /m, "export function ")

export interface IconUse {
  name: string
  source: IconSource
}

export function buildIconsModule(
  uses: readonly IconUse[],
  header: string
): string {
  const unique = new Map<string, IconSource>()
  for (const use of uses) {
    const known = unique.get(use.name)
    if (known && known !== use.source) {
      throw new Error(
        `${use.name} is imported from both ${known} and ${use.source}`
      )
    }
    unique.set(use.name, use.source)
  }
  const tabler = INLINED_LIBRARIES.find(
    (library) => library.library === "tabler"
  )
  const components: string[] = []
  let needsA11y = false
  for (const [name, source] of [...unique].sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    if (source === "hugeicons") {
      if (name !== "HugeiconsIcon")
        throw new Error(`unknown @hugeicons/react export ${name}`)
      components.push(HUGEICONS_ICON)
    } else if (source === "lucide") {
      const icon = resolveLucideIcon(name)
      if (!icon) throw new Error(`unknown Lucide icon ${name}`)
      components.push(exported(renderIconComponent(name, icon)))
      needsA11y = true
    } else {
      const icon = tabler?.resolve(name)
      if (!tabler || !icon) throw new Error(`unknown Tabler icon ${name}`)
      components.push(
        exported(tabler.render(icon).replace(/__COMPONENT__/g, name))
      )
    }
  }
  return [
    header,
    'import { cn } from "cn"',
    'import type { Child, JSX } from "hono/jsx"',
    "",
    COMPONENT_PROPS,
    ...(needsA11y ? [HAS_A11Y_PROP_HELPER] : []),
    ...components,
  ].join("\n\n")
}
