/**
 * Component-specific adapters: explicit escape hatches for upstream components
 * that the generic transformers cannot translate. Keep every special case here
 * and document why it exists.
 */
import { comboboxAdapter } from "./combobox"
import { inputGroupAdapter } from "./input-group"
import type { ComponentAdapter } from "./types"

export type { ComponentAdapter } from "./types"

export const COMPONENT_ADAPTERS: Readonly<Record<string, ComponentAdapter>> = {
  combobox: comboboxAdapter,
  "input-group": inputGroupAdapter,
}
