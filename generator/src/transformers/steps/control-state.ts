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

/**
 * Selectors for Base UI controls' roles in arbitrary variants (for example
 * Field's `[&>[role=checkbox],[role=radio]]:mt-px`). The roots of the
 * generated controls wrap a native input and carry no role, so the selectors
 * match their `data-slot` instead.
 */
export const CONTROL_ROLE_SELECTORS: Readonly<Record<string, string>> = {
  "[role=checkbox]": "[data-slot=checkbox]",
  "[role=radio]": "[data-slot=radio-group-item]",
}

function rewriteVariant(variant: string): string {
  const state = CONTROL_STATE_VARIANTS[variant]
  if (state) return state
  if (!variant.includes("[role=")) return variant
  let rewritten = variant
  for (const [role, slot] of Object.entries(CONTROL_ROLE_SELECTORS)) {
    rewritten = rewritten.replaceAll(role, slot)
  }
  return rewritten
}

/** Whether a variant refers to Base UI control state or roles. */
export function isControlStateVariant(variant: string): boolean {
  return rewriteVariant(variant) !== variant
}

export function rewriteControlState(classes: string): string {
  return classes
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const parts = splitVariants(token)
      const utility = parts.pop() as string
      return [...parts.map(rewriteVariant), utility].join(":")
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
