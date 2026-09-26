import { Node, SyntaxKind } from "ts-morph"
import {
  ICON_HELPER_MARKER,
  ICON_LIBRARIES,
  ICON_MARKER,
  type IconLibrary,
  type IconNames,
} from "../../../../cli/src/icons"
import { INLINED_LIBRARIES } from "../../icons/libraries"
import { type LucideIcon, resolveLucideIcon } from "../../icons/lucide"
import { LICENSE_NOTICE_PATH } from "../../licenses"
import { TransformError, type TransformStep } from "../context"

/** `IconPlaceholder` props that select an icon per library. */
const LIBRARY_PROPS: ReadonlySet<string> = new Set(ICON_LIBRARIES)

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
 * becomes a file-local component that inlines the Lucide SVG, marked with its
 * names in every library so that the CLI can swap in another one
 * (docs/adr/0031). Placeholders with the same Lucide icon but another icon
 * elsewhere get numbered components.
 */
export const icons: TransformStep = {
  name: "icons",
  run(ctx) {
    const elements = [
      ...ctx.sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
      ...ctx.sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ]
      .filter((e) => e.getTagNameNode().getText() === "IconPlaceholder")
      .sort((a, b) => a.getStart() - b.getStart())
    if (elements.length === 0) return

    const declared = new Set([
      ...ctx.sf.getFunctions().map((f) => f.getName()),
      ...ctx.sf.getVariableDeclarations().map((v) => v.getName()),
    ])
    const used = new Map<string, { icon: LucideIcon; names: IconNames }>()
    const replacements: { element: Node; text: string }[] = []
    for (const element of elements) {
      if (!Node.isJsxSelfClosingElement(element)) {
        throw new TransformError(
          ctx,
          "icons",
          "IconPlaceholder with children is not supported"
        )
      }
      const pieces: string[] = []
      const names: Partial<Record<IconLibrary, string>> = {}
      for (const attr of element.getAttributes()) {
        if (Node.isJsxSpreadAttribute(attr)) {
          pieces.push(attr.getText())
          continue
        }
        const attrName = attr.getNameNode().getText()
        const initializer = attr.getInitializer()
        if (LIBRARY_PROPS.has(attrName)) {
          if (Node.isStringLiteral(initializer)) {
            names[attrName as IconLibrary] = initializer.getLiteralValue()
          }
          continue
        }
        // `cn-*` markers (e.g. cn-rtl-flip) may have left an empty class.
        if (attrName === "className" && Node.isStringLiteral(initializer)) {
          if (initializer.getLiteralValue().trim() === "") continue
        }
        pieces.push(attr.getText())
      }
      const icon = names.lucide ? resolveLucideIcon(names.lucide) : null
      if (!names.lucide || !icon) {
        throw new TransformError(
          ctx,
          "icons",
          `unresolved Lucide icon ${names.lucide ?? "(none)"}`
        )
      }
      for (const library of INLINED_LIBRARIES) {
        const name = names[library.library]
        if (!name || !library.resolve(name)) {
          throw new TransformError(
            ctx,
            "icons",
            `unresolved ${library.library} icon ${name ?? "(none)"} for ${names.lucide}`
          )
        }
      }
      const complete = names as IconNames
      const key = JSON.stringify(complete)
      let local = names.lucide
      for (let n = 2; ; n++) {
        const entry = used.get(local)
        if (!entry || JSON.stringify(entry.names) === key) break
        local = `${names.lucide.replace(/Icon$/, "")}${n}Icon`
      }
      if (declared.has(local)) {
        throw new TransformError(
          ctx,
          "icons",
          `${local} collides with an existing declaration`
        )
      }
      used.set(local, { icon, names: complete })
      replacements.push({ element, text: `<${local} ${pieces.join(" ")} />` })
    }
    for (const { element, text } of replacements.reverse()) {
      element.replaceWithText(text)
    }

    const exportDecl = ctx.sf.getExportDeclarations().at(-1)
    const index = exportDecl
      ? exportDecl.getChildIndex()
      : ctx.sf.getStatements().length
    const declarations = [
      `${ICON_HELPER_MARKER}\n${HAS_A11Y_PROP_HELPER}`,
      ...[...used]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
          ([local, { icon, names }]) =>
            `${ICON_MARKER}${JSON.stringify(names)}\n${renderIconComponent(local, icon)}`
        ),
    ]
    ctx.sf.insertStatements(index, declarations.join("\n\n"))
    ctx.needsComponentProps = true
    for (const [local, { icon }] of used) {
      ctx.icons.add(icon.name)
      ctx.log.push(`icons: ${local} -> lucide ${icon.name}`)
    }
  },
}
