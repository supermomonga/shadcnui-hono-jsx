import { Node, SyntaxKind } from "ts-morph"
import type { TransformStep } from "../context"

/**
 * Hono JSX renders `class`; passing both `class` and `className` would emit two
 * attributes. Components therefore accept `class` (bound to the upstream local
 * name `className`, so the body is unchanged) and render `class`.
 */
export const classAttr: TransformStep = {
  name: "class-attr",
  run(ctx) {
    const bindings = ctx.sf.getDescendantsOfKind(SyntaxKind.BindingElement)
    for (const binding of bindings.reverse()) {
      if (!Node.isObjectBindingPattern(binding.getParent())) continue
      if (!binding.getFirstAncestorByKind(SyntaxKind.Parameter)) continue
      const property = binding.getPropertyNameNode()
      if (property) {
        if (property.getText() === "className")
          property.replaceWithText("class")
      } else if (binding.getNameNode().getText() === "className") {
        binding.replaceWithText(`class: ${binding.getText()}`)
      } else {
        continue
      }
      ctx.log.push("class-attr: parameter className -> class")
    }

    const attributes = ctx.sf.getDescendantsOfKind(SyntaxKind.JsxAttribute)
    for (const attribute of attributes.reverse()) {
      if (attribute.getNameNode().getText() !== "className") continue
      attribute.getNameNode().replaceWithText("class")
      ctx.log.push("class-attr: className= -> class=")
    }
  },
}
