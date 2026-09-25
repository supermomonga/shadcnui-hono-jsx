/**
 * File-local helpers shared by families that anchor a native popover to its
 * trigger with CSS anchor positioning (Popover, Menu): Base UI's positioner
 * props (`side`, `align`, offsets) become `position-area`, margins and
 * `--transform-origin` on the popup. Inserted once per file.
 */
import type { TransformContext } from "../../transformers/context"
import { helperEntries, registerHelpers } from "./util"

const ANCHOR_HELPERS = `type AnchorSide = "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end"
type AnchorAlign = "start" | "center" | "end"

interface AnchorPlacement {
  side: AnchorSide
  align: AnchorAlign
  sideOffset: number
  alignOffset: number
}

type AnchorPositionerProps = {
  side?: AnchorSide | undefined
  align?: AnchorAlign | undefined
  sideOffset?: number | undefined
  alignOffset?: number | undefined
  class?: string | undefined
  children?: Child
}

const AnchorPlacementContext = createContext<AnchorPlacement>({
  side: "bottom",
  align: "center",
  sideOffset: 0,
  alignOffset: 0,
})

/** Placement for the popup inside; the popup itself is positioned with CSS. */
function AnchorPositioner({
  side = "bottom",
  align = "center",
  sideOffset = 0,
  alignOffset = 0,
  children,
}: AnchorPositionerProps) {
  return (
    <AnchorPlacementContext.Provider value={{ side, align, sideOffset, alignOffset }}>
      {children}
    </AnchorPlacementContext.Provider>
  )
}

/** Inline styles that anchor a popup to \`anchor\` like Base UI's positioner. */
function anchorPlacementStyle(anchor: string, p: AnchorPlacement): Record<string, string> {
  const block = p.side === "top" || p.side === "bottom"
  const logical = p.side === "inline-start" || p.side === "inline-end"
  const span = block
    ? { start: "span-x-end", center: "", end: "span-x-start" }[p.align]
    : logical
      ? { start: "span-block-end", center: "", end: "span-block-start" }[p.align]
      : { start: "span-y-end", center: "", end: "span-y-start" }[p.align]
  const toward = {
    top: "margin-bottom",
    bottom: "margin-top",
    left: "margin-right",
    right: "margin-left",
    "inline-start": "margin-inline-end",
    "inline-end": "margin-inline-start",
  }[p.side]
  const across = block
    ? p.align === "end" ? "margin-inline-end" : "margin-inline-start"
    : p.align === "end" ? "margin-block-end" : "margin-block-start"
  const edge = { start: "0%", center: "50%", end: "100%" }[p.align]
  const origin = {
    top: \`\${edge} 100%\`,
    bottom: \`\${edge} 0%\`,
    left: \`100% \${edge}\`,
    right: \`0% \${edge}\`,
    "inline-start": \`100% \${edge}\`,
    "inline-end": \`0% \${edge}\`,
  }[p.side]
  return {
    "position-anchor": anchor,
    "position-area": [p.side, span].filter(Boolean).join(" "),
    "position-try-fallbacks": block ? "flip-block" : "flip-inline",
    [toward]: \`\${p.sideOffset}px\`,
    // A centered popup shifts as a whole (a one-sided margin would move it half as far).
    ...(p.alignOffset === 0
      ? {}
      : p.align === "center"
        ? { translate: block ? \`\${p.alignOffset}px 0\` : \`0 \${p.alignOffset}px\` }
        : { [across]: \`\${p.alignOffset}px\` }),
    "--transform-origin": origin,
    // Base UI's size variables for popup classes (\`w-(--anchor-width)\`, ...).
    "--anchor-width": "anchor-size(width)",
    "--anchor-height": "anchor-size(height)",
    "--available-width": "100%",
    "--available-height": "100%",
  }
}

/** Adds \`extra\` declarations to a string or object \`style\` prop (the prop wins). */
function withStyle(
  style: string | JSX.CSSProperties | undefined,
  extra: Record<string, string>
): string | JSX.CSSProperties {
  if (typeof style === "string") {
    const css = Object.entries(extra).map(([key, value]) => \`\${key}:\${value}\`)
    return [...css, style].join(";")
  }
  return { ...extra, ...style }
}`

/**
 * Without anchor positioning a popup keeps the user-agent centering
 * (`margin: auto`); with it, margins only carry the offsets.
 */
export const ANCHORED_POPUP_RESET = "m-auto supports-[position-area:bottom]:m-0"

const ANCHOR_ENTRIES = helperEntries(ANCHOR_HELPERS)

/** Offers the anchor helpers; those the file uses are inserted after the families step. */
export function insertAnchorHelpers(ctx: TransformContext): void {
  registerHelpers(ctx, ANCHOR_ENTRIES)
}
