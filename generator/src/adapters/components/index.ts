/**
 * Component-specific adapters: explicit escape hatches for upstream components
 * that the generic transformers cannot translate. Keep every special case here
 * and document why it exists.
 */
export interface ComponentAdapter {
  /** Blocking reason keys (`code` or `code:detail`) this adapter resolves. */
  resolves: readonly string[]
  /** User-visible differences introduced by the adapter. */
  notes: readonly string[]
}

export const COMPONENT_ADAPTERS: Readonly<Record<string, ComponentAdapter>> = {}
