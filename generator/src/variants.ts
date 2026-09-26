/**
 * Menu color and RTL variants (docs/adr/0030): the pinned shadcn CLI's own
 * transforms applied to upstream React source before translation, in the
 * order the shadcn CLI applies them when installing (menu, then RTL).
 */
import { createRequire } from "node:module"
import { transformDirection, transformMenu } from "shadcn/utils"
import {
  DEFAULT_VARIANT,
  MENU_COLORS,
  type Variant,
} from "../../cli/src/variants"

/**
 * The ts-morph the shadcn package depends on: transformMenu walks the source
 * file with its own SyntaxKind values, which differ between versions.
 */
const shadcnTsMorph = createRequire(import.meta.resolve("shadcn/utils"))(
  "ts-morph"
) as typeof import("ts-morph")

export async function applyVariant(
  source: string,
  variant: Variant
): Promise<string> {
  let output = source
  if (variant.menuColor !== "default") {
    const sourceFile = new shadcnTsMorph.Project({
      useInMemoryFileSystem: true,
    }).createSourceFile("component.tsx", output, {
      scriptKind: shadcnTsMorph.ScriptKind.TSX,
    })
    await transformMenu({
      sourceFile: sourceFile as never,
      filename: "component.tsx",
      raw: output,
      // transformMenu only reads `menuColor`.
      config: { menuColor: variant.menuColor } as never,
    })
    output = sourceFile.getFullText()
  }
  if (variant.rtl) output = await transformDirection(output, true)
  return output
}

/** Whether upstream source has menu markers, which menu colors resolve. */
export function hasMenuMarkers(source: string): boolean {
  return /\bcn-menu-(target|translucent)\b/.test(source)
}

/** Variants besides the default that may change a component. */
export function candidateVariants(source: string): Variant[] {
  const menuColors = hasMenuMarkers(source) ? MENU_COLORS : ["default" as const]
  return [false, true]
    .flatMap((rtl) => menuColors.map((menuColor) => ({ rtl, menuColor })))
    .filter(
      (v) =>
        v.rtl !== DEFAULT_VARIANT.rtl ||
        v.menuColor !== DEFAULT_VARIANT.menuColor
    )
}
