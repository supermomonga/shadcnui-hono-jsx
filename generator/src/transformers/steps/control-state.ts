import { mapFileClasses, splitVariants } from "../../adapters/families/util"
import type { TransformStep } from "../context"

/**
 * Variants other components use to react to Base UI controls' state
 * attributes. The generated controls are native inputs without those
 * attributes, so the variants read `:checked` instead.
 */
export const CONTROL_STATE_VARIANTS: Readonly<Record<string, string>> = {
  "has-data-checked": "has-checked",
  "has-data-unchecked": "not-has-checked",
}

export function rewriteControlState(classes: string): string {
  return classes
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const parts = splitVariants(token)
      const utility = parts.pop() as string
      return [
        ...parts.map((v) => CONTROL_STATE_VARIANTS[v] ?? v),
        utility,
      ].join(":")
    })
    .join(" ")
}

export const controlState: TransformStep = {
  name: "control-state",
  run(ctx) {
    if (ctx.facts.controlStateVariants.length === 0) return
    mapFileClasses(ctx, rewriteControlState)
    ctx.log.push(`control-state: ${ctx.facts.controlStateVariants.join(", ")}`)
  },
}
