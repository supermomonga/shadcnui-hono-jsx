import { SyntaxKind } from "ts-morph"
import type { TransformStep } from "../context"
import {
  RENDER_HELPER,
  RENDER_HELPER_TYPES,
  RENDER_HELPER_VALUES,
} from "../render-helper"

export const COMPONENT_PROPS_HELPER = `/** Props of the intrinsic element \`T\`, following Hono JSX conventions (\`class\`, no \`render\`/\`asChild\`). */
type ComponentProps<T extends keyof JSX.IntrinsicElements, Render = never> =
  JSX.IntrinsicElements[T] & {
    class?: string | undefined
    className?: never
    render?: Render
    asChild?: never
  }`

/**
 * Variant for files that also need \`ComponentProps<"svg">\`: the \`JSX\` namespace
 * exported by \`hono/jsx\` only declares HTML elements, so SVG elements use
 * Hono's generic \`JSX.HTMLAttributes\`.
 */
export const COMPONENT_PROPS_HELPER_WITH_SVG = `/** Props of the intrinsic element \`T\`, following Hono JSX conventions (\`class\`, no \`render\`/\`asChild\`). */
type ComponentProps<
  T extends keyof JSX.IntrinsicElements | "svg",
  Render = never,
> = (T extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[T]
  : JSX.HTMLAttributes) & {
  class?: string | undefined
  className?: never
  render?: Render
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
    const needsSvg = ctx.sf
      .getDescendantsOfKind(SyntaxKind.TypeReference)
      .some(
        (ref) => ref.getText().replace(/\s/g, "") === 'ComponentProps<"svg">'
      )
    const helpers = [
      needsSvg ? COMPONENT_PROPS_HELPER_WITH_SVG : COMPONENT_PROPS_HELPER,
    ]
    if (ctx.needsRender) {
      helpers.push(RENDER_HELPER)
      for (const name of RENDER_HELPER_TYPES) ctx.honoTypes.add(name)
      for (const name of RENDER_HELPER_VALUES) ctx.honoValues.add(name)
    }
    // The trailing newline keeps a blank line before helpers inserted earlier.
    ctx.sf.insertStatements(index, `${helpers.join("\n\n")}\n`)
    ctx.log.push("helpers: ComponentProps")
  },
}
