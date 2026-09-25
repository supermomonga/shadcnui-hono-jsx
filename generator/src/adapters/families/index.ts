import type { ComponentAdapter } from "../components"
import { comboboxFamily } from "./combobox"
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
import { previewCardFamily, tooltipFamily } from "./hover"
import { contextMenuFamily, menubarFamily, menuFamily } from "./menu"
import { popoverFamily } from "./popover"
import { progressFamily } from "./progress"
import { selectFamily } from "./select"
import { sliderFamily } from "./slider"
import { tabsFamily } from "./tabs"
import type { FamilyRule } from "./types"

export type { FamilyRule } from "./types"

/** Compound Base UI primitives translated as a whole (docs/adr/0019). */
export const PRIMITIVE_FAMILIES: readonly FamilyRule[] = [
  accordionFamily,
  alertDialogFamily,
  checkboxFamily,
  collapsibleFamily,
  comboboxFamily,
  contextMenuFamily,
  dialogFamily,
  menubarFamily,
  menuFamily,
  popoverFamily,
  previewCardFamily,
  progressFamily,
  radioFamily,
  radioGroupFamily,
  selectFamily,
  sliderFamily,
  switchFamily,
  tabsFamily,
  toggleFamily,
  toggleGroupFamily,
  tooltipFamily,
]

export function findFamilyRule(
  module: string,
  exportName: string
): FamilyRule | undefined {
  return PRIMITIVE_FAMILIES.find(
    (r) => r.module === module && r.exportName === exportName
  )
}

/** Directory of the optional client scripts (docs/adr/0025), installed at the same path. */
export const BEHAVIORS_DIR = "public/shadcn"

/**
 * Client scripts a component needs, from its mapped Base UI primitives
 * (`base-ui-primitive-mapped:<module>#<export>` reason keys) and its
 * component adapter, plus the shared `core` module they import.
 */
export function behaviorsOf(
  reasonKeys: readonly string[],
  adapter?: Pick<ComponentAdapter, "behaviors">
): string[] {
  const names = new Set<string>(adapter?.behaviors)
  for (const key of reasonKeys) {
    const match = key.match(/^base-ui-primitive-mapped:(.+)#(.+)$/)
    if (!match) continue
    for (const name of findFamilyRule(match[1] ?? "", match[2] ?? "")
      ?.behaviors ?? []) {
      names.add(name)
    }
  }
  return names.size === 0 ? [] : ["core", ...[...names].sort()]
}
