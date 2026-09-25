import { SyntaxKind } from "ts-morph"
import { TransformError, type TransformStep } from "../context"

/** Hooks that only memoize, which is meaningless for a single server render. */
export const MEMO_HOOKS = new Set(["useMemo", "useCallback"])

/**
 * `useMemo(() => value, deps)` becomes `(() => value)()` and
 * `useCallback(fn, deps)` becomes `fn`: a server render runs once, so
 * memoization has no effect.
 */
export const memoHooks: TransformStep = {
  name: "memo-hooks",
  run(ctx) {
    const calls = ctx.sf
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter((call) =>
        MEMO_HOOKS.has(
          call
            .getExpression()
            .getText()
            .replace(/^React\./, "")
        )
      )
    for (const call of calls.reverse()) {
      const hook = call
        .getExpression()
        .getText()
        .replace(/^React\./, "")
      const [fn] = call.getArguments()
      if (!fn)
        throw new TransformError(
          ctx,
          "memo-hooks",
          `${hook} without a function`
        )
      const text = fn.getText()
      call.replaceWithText(hook === "useMemo" ? `(${text})()` : text)
      ctx.log.push(`memo-hooks: ${hook}`)
    }
  },
}
