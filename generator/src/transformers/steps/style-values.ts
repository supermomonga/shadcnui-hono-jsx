import { Node, SyntaxKind } from "ts-morph"
import type { TransformStep } from "../context"

/** Unwraps `(expr)`, `expr as T` and `expr satisfies T`. */
function unwrap(node: Node): Node {
  let current = node
  while (
    Node.isParenthesizedExpression(current) ||
    Node.isAsExpression(current) ||
    Node.isSatisfiesExpression(current)
  ) {
    current = current.getExpression()
  }
  return current
}

/**
 * React renders numeric CSS custom properties verbatim, but Hono JSX appends
 * `px` to every numeric style value that is not a known unitless property
 * (`{ "--ratio": 1.5 }` becomes `--ratio:1.5px`). Custom property values in
 * `style` objects are therefore converted to strings.
 */
export const styleValues: TransformStep = {
  name: "style-values",
  run(ctx) {
    const attributes = ctx.sf
      .getDescendantsOfKind(SyntaxKind.JsxAttribute)
      .filter((a) => a.getNameNode().getText() === "style")
    for (const attribute of attributes.reverse()) {
      const initializer = attribute.getInitializer()
      if (!initializer || !Node.isJsxExpression(initializer)) continue
      const expression = initializer.getExpression()
      if (!expression) continue
      const object = unwrap(expression)
      if (!Node.isObjectLiteralExpression(object)) continue
      for (const property of object.getProperties().reverse()) {
        if (!Node.isPropertyAssignment(property)) continue
        const name = property.getNameNode()
        const key = Node.isStringLiteral(name)
          ? name.getLiteralValue()
          : name.getText()
        if (!key.startsWith("--")) continue
        const value = property.getInitializerOrThrow()
        if (
          Node.isStringLiteral(value) ||
          Node.isNoSubstitutionTemplateLiteral(value)
        )
          continue
        if (Node.isTemplateExpression(value)) continue
        const text = value.getText()
        property.setInitializer(`String(${text})`)
        ctx.log.push(`style-values: ${key}: String(${text})`)
      }
    }
  },
}
