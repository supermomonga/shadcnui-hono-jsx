import { Node, SyntaxKind } from "ts-morph"
import { TransformError, type TransformStep } from "../context"

/** Props without a Hono JSX equivalent (Radix Slot semantics). */
export const DROPPED_PROPS = ["asChild"] as const

/** Whether `id` reads a variable (rather than naming a property or attribute). */
function isReference(id: Node): boolean {
  const parent = id.getParent()
  if (!parent || Node.isBindingElement(parent)) return false
  if (Node.isJsxAttribute(parent) && parent.getNameNode() === id) return false
  if (Node.isPropertyAssignment(parent) && parent.getNameNode() === id)
    return false
  if (Node.isPropertyAccessExpression(parent) && parent.getNameNode() === id)
    return false
  return true
}

/** Removes destructured props that have no Hono JSX equivalent once they are unused. */
export const dropProps: TransformStep = {
  name: "drop-props",
  run(ctx) {
    const dropped = new Set<string>(DROPPED_PROPS)
    const patterns = ctx.sf
      .getDescendantsOfKind(SyntaxKind.ObjectBindingPattern)
      .filter((p) => Node.isParameterDeclaration(p.getParent()))
    for (const pattern of patterns.reverse()) {
      const fn = pattern.getParentOrThrow().getParentOrThrow()
      const elements = pattern.getElements()
      const removed = elements.filter(
        (e) =>
          !e.getDotDotDotToken() &&
          dropped.has(e.getPropertyNameNode()?.getText() ?? e.getName())
      )
      if (removed.length === 0) continue
      for (const element of removed) {
        const local = element.getName()
        // A dropped prop is always undefined: `render ? a : b` is just `b`.
        const conditionals = fn
          .getDescendantsOfKind(SyntaxKind.ConditionalExpression)
          .filter((c) => c.getCondition().getText() === local)
        for (const conditional of conditionals.reverse()) {
          const whenFalse = conditional.getWhenFalse().getText()
          conditional.replaceWithText(whenFalse)
          ctx.log.push(`drop-props: ${local} ? … : ${whenFalse}`)
        }
        const used = fn
          .getDescendantsOfKind(SyntaxKind.Identifier)
          .some((id) => id.getText() === local && isReference(id))
        if (used) {
          throw new TransformError(
            ctx,
            "drop-props",
            `"${local}" is still used after translation`
          )
        }
        ctx.log.push(`drop-props: ${local}`)
      }
      const kept = elements
        .filter((e) => !removed.includes(e))
        .map((e) => e.getText())
      pattern.replaceWithText(`{ ${kept.join(", ")} }`)
    }
  },
}
