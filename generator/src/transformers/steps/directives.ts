import { Node } from "ts-morph"
import type { TransformStep } from "../context"

/** Removes leading `"use client"` / `"use server"` directives; Hono JSX has no RSC boundary. */
export const removeDirectives: TransformStep = {
  name: "remove-directives",
  run(ctx) {
    for (const statement of ctx.sf.getStatements()) {
      if (!Node.isExpressionStatement(statement)) break
      const expression = statement.getExpression()
      if (!Node.isStringLiteral(expression)) break
      ctx.log.push(`remove directive "${expression.getLiteralValue()}"`)
      statement.remove()
    }
  },
}
