/**
 * Toast: `ToastList` returns an array of toasts, which React renders but a
 * Hono JSX component cannot return; the step wraps it in a fragment and
 * fails when upstream changes that return.
 */
import { SyntaxKind } from "ts-morph"
import { TransformError, type TransformStep } from "../../transformers/context"
import type { ComponentAdapter } from "./types"

const wrapList: TransformStep = {
  name: "toast:list-fragment",
  run(ctx) {
    const list = ctx.sf.getFunction("ToastList")
    const returns = list?.getDescendantsOfKind(SyntaxKind.ReturnStatement) ?? []
    const [statement] = returns
    const expression = statement?.getExpression()
    if (
      returns.length !== 1 ||
      !expression?.isKind(SyntaxKind.CallExpression) ||
      !expression.getExpression().getText().endsWith(".map")
    ) {
      throw new TransformError(
        ctx,
        this.name,
        "ToastList no longer returns toasts.map(...); update this adapter"
      )
    }
    expression.replaceWithText(`<>{${expression.getText()}}</>`)
    ctx.log.push(`${this.name}: ToastList returns a fragment`)
  },
}

export const toastAdapter: ComponentAdapter = {
  kind: "script",
  resolves: [],
  notes: [],
  steps: [{ after: "remove-directives", step: wrapList }],
}
