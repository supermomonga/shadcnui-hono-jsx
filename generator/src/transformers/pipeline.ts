import type { ComponentAdapter } from "../adapters/components"
import type { FileFacts } from "../analyzer/facts"
import { parseSource } from "../analyzer/source"
import type { TransformContext, TransformStep } from "./context"
import { classAttr } from "./steps/class-attr"
import { cnMarkers } from "./steps/cn-markers"
import { componentImports } from "./steps/component-imports"
import { controlState } from "./steps/control-state"
import { removeDirectives } from "./steps/directives"
import { domAttributes } from "./steps/dom-attributes"
import { dropProps } from "./steps/drop-props"
import { families } from "./steps/families"
import { guard } from "./steps/guard"
import { helpers } from "./steps/helpers"
import { icons } from "./steps/icons"
import { imports } from "./steps/imports"
import { memoHooks } from "./steps/memo-hooks"
import { primitivesStep } from "./steps/primitives"
import { reactContext } from "./steps/react-context"
import { reactTypes } from "./steps/react-types"
import { styleValues } from "./steps/style-values"
import { useRenderStep } from "./steps/use-render"

/** Ordered translation steps applied to every upstream component file. */
export const STEPS: readonly TransformStep[] = [
  removeDirectives,
  componentImports,
  cnMarkers,
  icons,
  useRenderStep,
  memoHooks,
  reactContext,
  families,
  primitivesStep,
  controlState,
  reactTypes,
  styleValues,
  classAttr,
  domAttributes,
  dropProps,
  helpers,
  imports,
  guard,
]

/** Splices adapter steps in after the step they name. */
export function resolveSteps(
  adapter: ComponentAdapter | undefined
): TransformStep[] {
  const steps = [...STEPS]
  for (const extra of adapter?.steps ?? []) {
    const index = steps.findIndex((s) => s.name === extra.after)
    if (index === -1)
      throw new Error(`Unknown step "${extra.after}" in adapter`)
    steps.splice(index + 1, 0, extra.step)
  }
  return steps
}

export interface TransformInput {
  name: string
  source: string
  facts: FileFacts
  adapter?: ComponentAdapter | undefined
}

export interface TransformOutput {
  /** Unformatted Hono JSX source. */
  text: string
  log: string[]
  /** Canonical names of inlined Lucide icons. */
  icons: string[]
}

export function transformSource(input: TransformInput): TransformOutput {
  const ctx: TransformContext = {
    sf: parseSource(input.source, `${input.name}.tsx`),
    name: input.name,
    facts: input.facts,
    primitives: new Map(),
    adapter: input.adapter,
    honoTypes: new Set(),
    needsComponentProps: false,
    icons: new Set(),
    honoValues: new Set(),
    needsRender: false,
    log: [],
  }
  for (const step of resolveSteps(input.adapter)) step.run(ctx)
  return {
    text: ctx.sf.getFullText(),
    log: ctx.log,
    icons: [...ctx.icons].sort(),
  }
}
