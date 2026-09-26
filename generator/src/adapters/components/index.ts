/**
 * Component-specific adapters: explicit escape hatches for upstream components
 * that the generic transformers cannot translate. Keep every special case here
 * and document why it exists.
 */
import { comboboxAdapter } from "./combobox"
import { directionAdapter } from "./direction"
import { inputGroupAdapter } from "./input-group"
import { sidebarAdapter } from "./sidebar"
import { toastAdapter } from "./toast"
import type { ComponentAdapter } from "./types"

export type { ComponentAdapter } from "./types"

export const COMPONENT_ADAPTERS: Readonly<Record<string, ComponentAdapter>> = {
  combobox: comboboxAdapter,
  direction: directionAdapter,
  "input-group": inputGroupAdapter,
  sidebar: sidebarAdapter,
  toast: toastAdapter,
}
