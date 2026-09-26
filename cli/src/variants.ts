/**
 * Template variants (docs/adr/0030): menu color and RTL are translated at
 * generation time with the shadcn CLI's transforms and stored next to the
 * default template, in `<style>/<variant>/`, only where they differ.
 */

export const MENU_COLORS = [
  "default",
  "inverted",
  "default-translucent",
  "inverted-translucent",
] as const

export type MenuColor = (typeof MENU_COLORS)[number]

export interface Variant {
  rtl: boolean
  menuColor: MenuColor
}

export const DEFAULT_VARIANT: Variant = { rtl: false, menuColor: "default" }

/** The directory of a variant under its style; empty for the default. */
export function variantDir(variant: Variant): string {
  return [
    ...(variant.rtl ? ["rtl"] : []),
    ...(variant.menuColor === "default" ? [] : [`menu-${variant.menuColor}`]),
  ].join("_")
}

/**
 * Directories to look for a template in, most specific first: a component
 * without a variant for an option looks the same with and without it.
 */
export function variantCandidates(variant: Variant): string[] {
  return [
    ...new Set([
      variantDir(variant),
      variantDir({ ...variant, menuColor: "default" }),
      variantDir({ ...variant, rtl: false }),
      "",
    ]),
  ]
}
