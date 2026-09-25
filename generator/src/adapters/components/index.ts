/**
 * Component-specific adapters: explicit escape hatches for upstream components
 * that the generic transformers cannot translate. Keep every special case here
 * and document why it exists.
 */
import type { TransformStep } from "../../transformers/context"
import { dialogAdapter } from "./dialog"

export interface ComponentAdapter {
  /**
   * `native`: maps the component onto a browser primitive with behavior
   * (classified `native-adapter`); `custom`: any other hand-written rule.
   */
  kind: "native" | "custom"
  /** Blocking reason keys (`code` or `code:detail`) this adapter resolves. */
  resolves: readonly string[]
  /** User-visible differences introduced by the adapter. */
  notes: readonly string[]
  /** Extra transform steps, each inserted after the named pipeline step. */
  steps?: readonly { after: string; step: TransformStep }[]
}

export const COMPONENT_ADAPTERS: Readonly<Record<string, ComponentAdapter>> = {
  dialog: dialogAdapter,
}
