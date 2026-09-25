/**
 * Declarative translation of stateless Base UI primitives into intrinsic
 * elements. Each rule reproduces the attributes the Base UI primitive renders
 * during SSR (checked against the referenced Base UI source), minus client-only
 * state. Primitives that need browser behavior do not belong here; they need a
 * native or custom adapter.
 */
/**
 * An attribute Base UI renders that the generated component deliberately does
 * not: it promises client-side behavior that is not shipped (docs/adr/0018).
 * Tests normalize exactly these differences when comparing with upstream.
 */
export interface OmittedAttribute {
  attr: string
  /** Only this value (exact) or values matching this pattern are omitted. */
  value?: string
  valuePattern?: string
  /** Only omitted on elements other than `<button>` and `<input>`. */
  nonButtonOnly?: boolean
  reason: string
}

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
  /** Supports Base UI's `render` prop (via the generated `renderElement` helper). */
  renderable?: boolean
  /** Attributes always rendered, before the props spread. */
  staticAttrs?: Record<string, string>
  /** Default attributes rendered before the props spread, so callers can override them. */
  defaultAttrs?: Record<string, string>
  /** Explicit props that are rendered as one or more attributes. */
  propAttrs?: Record<string, readonly string[]>
  /** Boolean props mirrored as presence `data-*` state attributes (`data-x=""`). */
  stateAttrs?: readonly { prop: string; attr: string }[]
  /** Primitive-only props that are accepted and ignored (never rendered). */
  consumeProps?: readonly string[]
  /** Attributes Base UI renders that are deliberately not reproduced. */
  omittedAttrs?: readonly OmittedAttribute[]
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
    propsType: 'ComponentProps<"button", RenderProp>',
    renderable: true,
    defaultAttrs: { type: "button" },
    stateAttrs: [{ prop: "disabled", attr: "data-disabled" }],
    consumeProps: ["nativeButton", "focusableWhenDisabled"],
    omittedAttrs: [
      {
        attr: "tabindex",
        value: "0",
        reason:
          'Base UI sets `tabindex="0"` to keep disabled buttons focusable (`focusableWhenDisabled`); native buttons are focusable without it.',
      },
      {
        attr: "role",
        value: "button",
        nonButtonOnly: true,
        reason:
          'Base UI marks non-button render targets (such as links) `role="button"` and adds Space/Enter handling in client JavaScript, which is not shipped; they keep their native role instead.',
      },
      {
        attr: "type",
        nonButtonOnly: true,
        reason: "`type` is only meaningful on buttons and inputs.",
      },
    ],
    notes: [
      'Renders a native `<button>` with `type="button"` by default, like Base UI; pass `type="submit"` for form submission.',
      '`render` is supported on the server; a non-button target such as `render={<a href="/docs" />}` keeps its native role (no `role="button"` or `tabindex`), since the client-side button behavior Base UI adds is not shipped.',
      "`focusableWhenDisabled` is not supported.",
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
    omittedAttrs: [
      {
        attr: "id",
        valuePattern: "^base-ui-",
        reason:
          "Base UI generates an `id` for field labelling on the client; pass `id` explicitly.",
      },
    ],
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
      'ComponentProps<"div", RenderProp> & { orientation?: "horizontal" | "vertical" | undefined }',
    renderable: true,
    staticAttrs: { role: "separator" },
    propAttrs: { orientation: ["aria-orientation", "data-orientation"] },
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
