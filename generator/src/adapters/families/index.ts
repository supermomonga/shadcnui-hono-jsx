import {
  checkboxFamily,
  radioFamily,
  radioGroupFamily,
  switchFamily,
  toggleFamily,
  toggleGroupFamily,
} from "./controls"
import { accordionFamily, collapsibleFamily } from "./details"
import { alertDialogFamily, dialogFamily } from "./dialog"
import { popoverFamily } from "./popover"
import { progressFamily } from "./progress"
import { selectFamily } from "./select"
import type { FamilyRule } from "./types"

export type { FamilyRule } from "./types"

/** Compound Base UI primitives translated as a whole (docs/adr/0019). */
export const PRIMITIVE_FAMILIES: readonly FamilyRule[] = [
  accordionFamily,
  alertDialogFamily,
  checkboxFamily,
  collapsibleFamily,
  dialogFamily,
  popoverFamily,
  progressFamily,
  radioFamily,
  radioGroupFamily,
  selectFamily,
  switchFamily,
  toggleFamily,
  toggleGroupFamily,
]

export function findFamilyRule(
  module: string,
  exportName: string
): FamilyRule | undefined {
  return PRIMITIVE_FAMILIES.find(
    (r) => r.module === module && r.exportName === exportName
  )
}
