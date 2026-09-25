import type { TransformStep } from "../../transformers/context"

export interface ComponentAdapter {
  /**
   * `native`: maps the component onto a browser primitive with behavior
   * (classified `native-adapter`); `script`: moves behavior into optional
   * client scripts (`script-adapter`, docs/adr/0025); `custom`: any other
   * hand-written rule.
   */
  kind: "native" | "script" | "custom"
  /** Client scripts in `public/shadcn/` (without `.js`) for `script` adapters. */
  behaviors?: readonly string[]
  /** Blocking reason keys (`code` or `code:detail`) this adapter resolves. */
  resolves: readonly string[]
  /** User-visible differences introduced by the adapter. */
  notes: readonly string[]
  /** Extra transform steps, each inserted after the named pipeline step. */
  steps?: readonly { after: string; step: TransformStep }[]
}
