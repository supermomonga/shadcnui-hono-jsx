import type { SourceFile } from "ts-morph"
import type { ComponentAdapter } from "../adapters/components"
import type { PrimitiveRule } from "../adapters/primitives/base-ui"
import type { FileFacts } from "../analyzer/facts"

export type HonoTypeImport =
  | "JSX"
  | "Child"
  | "CSSProperties"
  | "JSXNode"
  | "Context"

export interface TransformContext {
  sf: SourceFile
  /** Upstream item name, for error messages. */
  name: string
  facts: FileFacts
  /** Base UI primitives imported by this file, keyed by local identifier. */
  primitives: Map<string, PrimitiveRule>
  adapter: ComponentAdapter | undefined
  /** Types that must be imported from `hono/jsx`. */
  honoTypes: Set<HonoTypeImport>
  /** Whether the file-local `ComponentProps` helper type is needed. */
  needsComponentProps: boolean
  /** Canonical names of Lucide icons inlined into the file. */
  icons: Set<string>
  /** Values that must be imported from \`hono/jsx\`. */
  honoValues: Set<string>
  /** Whether the file-local \`renderElement\` helper (Base UI \`render\` prop) is needed. */
  needsRender: boolean
  /** Human-readable record of applied rewrites (for debugging and tests). */
  log: string[]
  /** File-local helpers families may insert; only referenced ones are (see families/util). */
  helperEntries?: { id: string; text: string }[]
}

export class TransformError extends Error {
  constructor(
    ctx: Pick<TransformContext, "name">,
    step: string,
    message: string
  ) {
    super(`[${ctx.name}] ${step}: ${message}`)
    this.name = "TransformError"
  }
}

export interface TransformStep {
  name: string
  run(ctx: TransformContext): void
}
