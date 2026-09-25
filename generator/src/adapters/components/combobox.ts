/**
 * Combobox: `useComboboxAnchor()` returns a React ref that shadcn passes to
 * `ComboboxChips` (`ref`) and `ComboboxContent` (`anchor`) so the list opens
 * under the chips. On the server it returns a CSS anchor name instead
 * (`createComboboxAnchor` of the Combobox family). The step fails when
 * upstream changes the hook.
 */
import { TransformError, type TransformStep } from "../../transformers/context"
import type { ComponentAdapter } from "./types"

const UPSTREAM_BODY = "{return React.useRef<HTMLDivElement | null>(null)}"

const anchorHook: TransformStep = {
  name: "combobox:anchor-hook",
  run(ctx) {
    const hook = ctx.sf.getFunction("useComboboxAnchor")
    const body = hook?.getBody()
    if (!hook || body?.getText().replace(/\s*\n\s*/g, "") !== UPSTREAM_BODY) {
      throw new TransformError(
        ctx,
        this.name,
        "useComboboxAnchor changed upstream; update the Combobox family's createComboboxAnchor and this adapter"
      )
    }
    hook.setBodyText("return createComboboxAnchor()")
    ctx.log.push(`${this.name}: useComboboxAnchor -> CSS anchor name`)
  },
}

export const comboboxAdapter: ComponentAdapter = {
  kind: "script",
  resolves: ["react-hook:useRef", "react-runtime-api:React.useRef"],
  notes: [
    "`useComboboxAnchor()` returns a CSS anchor name for `ComboboxChips` (`ref`) and `ComboboxContent` (`anchor`) instead of a React ref.",
  ],
  steps: [{ after: "remove-directives", step: anchorHook }],
}
