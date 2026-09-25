import { accordionFamily, collapsibleFamily } from "./details"
import { alertDialogFamily, dialogFamily } from "./dialog"
import { progressFamily } from "./progress"
import type { FamilyRule } from "./types"

export type { FamilyRule } from "./types"

/** Compound Base UI primitives translated as a whole (docs/adr/0019). */
export const PRIMITIVE_FAMILIES: readonly FamilyRule[] = [
  accordionFamily,
  alertDialogFamily,
  collapsibleFamily,
  dialogFamily,
  progressFamily,
]

export function findFamilyRule(
  module: string,
  exportName: string
): FamilyRule | undefined {
  return PRIMITIVE_FAMILIES.find(
    (r) => r.module === module && r.exportName === exportName
  )
}
