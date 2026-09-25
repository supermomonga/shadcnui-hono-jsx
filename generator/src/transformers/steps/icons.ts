import { Node, SyntaxKind } from "ts-morph"
import { type LucideIcon, resolveLucideIcon } from "../../icons/lucide"
import { LICENSE_NOTICE_PATH } from "../../licenses"
import { TransformError, type TransformStep } from "../context"

/** `IconPlaceholder` props that select an icon per library; only `lucide` is used. */
const LIBRARY_PROPS = new Set([
  "lucide",
  "tabler",
  "hugeicons",
  "phosphor",
  "remixicon",
])

/** Attributes lucide-react renders before the user's props (defaultAttributes). */
const SVG_DEFAULTS = [
  ["xmlns", '"http://www.w3.org/2000/svg"'],
  ["width", '"24"'],
  ["height", '"24"'],
  ["viewBox", '"0 0 24 24"'],
  ["fill", '"none"'],
  ["stroke", '"currentColor"'],
  ["stroke-width", '"2"'],
  ["stroke-linecap", '"round"'],
  ["stroke-linejoin", '"round"'],
] as const

export const HAS_A11Y_PROP_HELPER = `/** Like lucide-react, icons are hidden from assistive technology unless labelled. */
function hasA11yProp(props: object): boolean {
  return Object.keys(props).some(
    (key) => key.startsWith("aria-") || key === "role" || key === "title"
  )
}`

function renderNode(node: LucideIcon["node"]): string {
  return node
    .map(([tag, attributes]) => {
      const attrs = Object.entries(attributes)
        .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
        .join(" ")
      return `<${tag} ${attrs} />`
    })
    .join("\n")
}

/** A local component that renders the same SVG as lucide-react's icon. */
export function renderIconComponent(
  componentName: string,
  icon: LucideIcon
): string {
  const classes = [
    "lucide",
    `lucide-${icon.name}`,
    ...icon.aliases.map((a) => `lucide-${a}`),
  ]
  return `/** Lucide \`${icon.name}\` icon, inlined (ISC License, see ${LICENSE_NOTICE_PATH}). */
function ${componentName}({
  class: className,
  children,
  ...props
}: ComponentProps<"svg">) {
  return (
    <svg
      ${SVG_DEFAULTS.map(([name, value]) => `${name}=${value}`).join("\n      ")}
      class={cn(${JSON.stringify(classes.join(" "))}, className)}
      aria-hidden={children || hasA11yProp(props) ? undefined : "true"}
      {...props}
    >
      ${renderNode(icon.node)}
      {children}
    </svg>
  )
}`
}

/**
 * Upstream renders icons through `IconPlaceholder`, which the shadcn CLI turns
 * into the configured icon library (lucide-react by default). Each placeholder
 * becomes a file-local component that inlines the Lucide SVG.
 */
export const icons: TransformStep = {
  name: "icons",
  run(ctx) {
    const elements = [
      ...ctx.sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
      ...ctx.sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ].filter((e) => e.getTagNameNode().getText() === "IconPlaceholder")
    if (elements.length === 0) return

    const declared = new Set([
      ...ctx.sf.getFunctions().map((f) => f.getName()),
      ...ctx.sf.getVariableDeclarations().map((v) => v.getName()),
    ])
    const used = new Map<string, LucideIcon>()
    const sorted = elements.sort((a, b) => b.getStart() - a.getStart())
    for (const element of sorted) {
      if (!Node.isJsxSelfClosingElement(element)) {
        throw new TransformError(
          ctx,
          "icons",
          "IconPlaceholder with children is not supported"
        )
      }
      const pieces: string[] = []
      let name: string | undefined
      for (const attr of element.getAttributes()) {
        if (Node.isJsxSpreadAttribute(attr)) {
          pieces.push(attr.getText())
          continue
        }
        const attrName = attr.getNameNode().getText()
        const initializer = attr.getInitializer()
        if (attrName === "lucide" && Node.isStringLiteral(initializer)) {
          name = initializer.getLiteralValue()
        }
        if (LIBRARY_PROPS.has(attrName)) continue
        // `cn-*` markers (e.g. cn-rtl-flip) may have left an empty class.
        if (attrName === "className" && Node.isStringLiteral(initializer)) {
          if (initializer.getLiteralValue().trim() === "") continue
        }
        pieces.push(attr.getText())
      }
      const icon = name ? resolveLucideIcon(name) : null
      if (!name || !icon) {
        throw new TransformError(
          ctx,
          "icons",
          `unresolved Lucide icon ${name ?? "(none)"}`
        )
      }
      if (declared.has(name)) {
        throw new TransformError(
          ctx,
          "icons",
          `${name} collides with an existing declaration`
        )
      }
      used.set(name, icon)
      element.replaceWithText(`<${name} ${pieces.join(" ")} />`)
    }

    const exportDecl = ctx.sf.getExportDeclarations().at(-1)
    const index = exportDecl
      ? exportDecl.getChildIndex()
      : ctx.sf.getStatements().length
    const declarations = [
      HAS_A11Y_PROP_HELPER,
      ...[...used]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([n, i]) => renderIconComponent(n, i)),
    ]
    ctx.sf.insertStatements(index, declarations.join("\n\n"))
    ctx.needsComponentProps = true
    for (const [n, i] of used) {
      ctx.icons.add(i.name)
      ctx.log.push(`icons: ${n} -> lucide ${i.name}`)
    }
  },
}
