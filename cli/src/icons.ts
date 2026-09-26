/**
 * Icon libraries a preset can choose (docs/adr/0031). Templates inline
 * Lucide; `finalize` swaps in the chosen library's icons from
 * `generated/icons/<library>.json`.
 */
export const ICON_LIBRARIES = [
  "lucide",
  "tabler",
  "hugeicons",
  "phosphor",
  "remixicon",
] as const

export type IconLibrary = (typeof ICON_LIBRARIES)[number]

/** An icon of the templates, named for every library as upstream does. */
export type IconNames = Readonly<Record<IconLibrary, string>>

/**
 * Line before each inlined icon of a template, followed by its names as
 * JSON; the next function is the icon's component.
 */
export const ICON_MARKER = "// icon: "

/** Line before the helper that only Lucide icons use. */
export const ICON_HELPER_MARKER = "// icon-helper"

/** `generated/icons/<library>.json`: rendered icons of one library. */
export interface IconSet {
  library: IconLibrary
  package: string
  version: string
  /** Header line of files with its icons; `{names}` lists them. */
  headerLine: string
  /**
   * Icon components by the library's icon name: the canonical name for the
   * header and the component's source, with `__COMPONENT__` for its name.
   */
  icons: Readonly<Record<string, { name: string; source: string }>>
}
