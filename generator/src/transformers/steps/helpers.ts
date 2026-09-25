import type { TransformStep } from "../context"

export const COMPONENT_PROPS_HELPER = `/** Props of the intrinsic element \`T\`, following Hono JSX conventions (\`class\`, no \`render\`/\`asChild\`). */
type ComponentProps<T extends keyof JSX.IntrinsicElements> =
  JSX.IntrinsicElements[T] & {
    class?: string | undefined
    className?: never
    render?: never
    asChild?: never
  }`

/**
 * Inserts the file-local \`ComponentProps\` helper. It is an intersection (not an
 * \`Omit\`) because Hono's attribute types carry a string index signature.
 */
export const helpers: TransformStep = {
  name: "helpers",
  run(ctx) {
    if (!ctx.needsComponentProps) return
    ctx.honoTypes.add("JSX")
    const imports = ctx.sf.getImportDeclarations()
    const last = imports[imports.length - 1]
    const index = last ? last.getChildIndex() + 1 : 0
    ctx.sf.insertStatements(index, COMPONENT_PROPS_HELPER)
    ctx.log.push("helpers: ComponentProps")
  },
}
