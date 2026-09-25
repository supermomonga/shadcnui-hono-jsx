/**
 * Declarative translation of stateless Base UI primitives into intrinsic
 * elements. Each rule reproduces the attributes the Base UI primitive renders
 * during SSR (checked against the referenced Base UI source), minus client-only
 * state. Primitives that need browser behavior do not belong here; they need a
 * native or custom adapter.
 */
export interface PrimitiveRule {
  /** Module specifier, e.g. `@base-ui/react/button`. */
  module: string
  /** Named export imported from `module`. */
  exportName: string
  /**
   * `intrinsic`: plain element + attributes (classified as `direct`).
   * `native`: mapped onto a browser primitive with behavior (Tier B).
   */
  kind: "intrinsic" | "native"
  /** Intrinsic element rendered instead of the primitive. */
  tag: string
  /** Props type replacing `<Local>.Props` (uses the generated `ComponentProps` helper). */
  propsType: string
  /** Attributes always rendered, before the props spread. */
  staticAttrs?: Record<string, string>
  /** Default attributes rendered before the props spread, so callers can override them. */
  defaultAttrs?: Record<string, string>
  /** Explicit props that are rendered as one or more attributes. */
  propAttrs?: Record<string, readonly string[]>
  /** Boolean props mirrored as presence `data-*` state attributes (`data-x=""`). */
  stateAttrs?: readonly { prop: string; attr: string }[]
  /** Primitive-only props removed from the public props. */
  dropProps?: readonly string[]
  /** User-visible behavioral differences (Markdown; wrap HTML in backticks). */
  notes: readonly string[]
  /** Base UI source used as the parity reference. */
  reference: string
}

export const BASE_UI_PRIMITIVES: readonly PrimitiveRule[] = [
  {
    module: "@base-ui/react/button",
    exportName: "Button",
    kind: "intrinsic",
    tag: "button",
    propsType: 'ComponentProps<"button">',
    defaultAttrs: { type: "button" },
    stateAttrs: [{ prop: "disabled", attr: "data-disabled" }],
    dropProps: ["render", "nativeButton", "focusableWhenDisabled"],
    notes: [
      'Renders a native `<button>` with `type="button"` by default, like Base UI; pass `type="submit"` for form submission.',
      "`render` and `focusableWhenDisabled` are not supported.",
    ],
    reference:
      "https://github.com/mui/base-ui/blob/master/packages/react/src/use-button/useButton.ts",
  },
  {
    module: "@base-ui/react/input",
    exportName: "Input",
    kind: "intrinsic",
    tag: "input",
    propsType: 'ComponentProps<"input">',
    stateAttrs: [{ prop: "disabled", attr: "data-disabled" }],
    dropProps: ["render", "onValueChange"],
    notes: [
      "Client-side field state attributes (`data-dirty`, `data-touched`, `data-focused`, `data-filled`, `data-valid`) and the auto-generated `id` are not rendered.",
    ],
    reference:
      "https://github.com/mui/base-ui/blob/master/packages/react/src/input/Input.tsx",
  },
  {
    module: "@base-ui/react/separator",
    exportName: "Separator",
    kind: "intrinsic",
    tag: "div",
    propsType:
      'ComponentProps<"div"> & { orientation?: "horizontal" | "vertical" | undefined }',
    staticAttrs: { role: "separator" },
    propAttrs: { orientation: ["aria-orientation", "data-orientation"] },
    dropProps: ["render"],
    notes: [],
    reference:
      "https://github.com/mui/base-ui/blob/master/packages/react/src/separator/Separator.tsx",
  },
]

export function findPrimitiveRule(
  module: string,
  exportName: string
): PrimitiveRule | undefined {
  return BASE_UI_PRIMITIVES.find(
    (rule) => rule.module === module && rule.exportName === exportName
  )
}

/** Base UI helper modules handled by the generic `use-render` transformer. */
export const BASE_UI_RENDER_HELPERS = {
  useRender: "@base-ui/react/use-render",
  mergeProps: "@base-ui/react/merge-props",
} as const
