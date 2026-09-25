import type { TransformContext } from "../../transformers/context"
import type { OmittedAttribute } from "../primitives/base-ui"

/**
 * A compound Base UI primitive (Root plus parts connected through context)
 * translated as a whole: every `<Local.Part>` element and `Local.Part.Props`
 * type in the file is rewritten by `transform`.
 */
export interface FamilyRule {
  module: string
  exportName: string
  /** `native`: behavior comes from a browser primitive (classified `native-adapter`). */
  kind: "intrinsic" | "native"
  transform(ctx: TransformContext, local: string): void
  /** User-visible differences (Markdown; wrap HTML in backticks). */
  notes: readonly string[]
  /** Parts that accept Base UI's `render` prop (docs/adr/0018). */
  renderableParts?: readonly string[]
  /** Attributes Base UI renders that are deliberately not reproduced. */
  omittedAttrs?: readonly OmittedAttribute[]
  /**
   * `exact`: visual tests compare the DOM with upstream (after omissions).
   * `native-structure`: native elements replace Base UI's markup, so only
   * pixels are compared.
   */
  domParity: "exact" | "native-structure"
  reference: string
}
