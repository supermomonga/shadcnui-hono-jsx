import {
  ICON_MARKER,
  type IconNames,
  type IconSet,
} from "../../../cli/src/icons"
import { formatWithBiome } from "../emit/format"
import { TEMPLATES_DIR } from "../generate"
import { iconHeaderLine } from "../licenses"
import { INLINED_LIBRARIES, packageVersion } from "./libraries"

/** The names of every icon marked in `template`. */
export function markedIcons(template: string): IconNames[] {
  return template
    .split("\n")
    .filter((line) => line.startsWith(ICON_MARKER))
    .map((line) => JSON.parse(line.slice(ICON_MARKER.length)) as IconNames)
}

/**
 * `cli/generated/icons/<library>.json` for every library besides Lucide: the
 * icons marked in `templates`, rendered as the CLI swaps them in
 * (docs/adr/0031).
 */
export function buildIconSets(templates: string[]): IconSet[] {
  const marked = templates.flatMap(markedIcons)
  return INLINED_LIBRARIES.map((library) => {
    const version = packageVersion(library.package)
    const names = [...new Set(marked.map((icon) => icon[library.library]))]
    const icons = Object.fromEntries(
      names.sort().map((name) => {
        const icon = library.resolve(name)
        if (!icon) {
          throw new Error(`unresolved ${library.library} icon ${name}`)
        }
        const source = formatWithBiome(
          library.render(icon),
          `${TEMPLATES_DIR}/icons.tsx`
        )
        return [name, { name: icon.name, source }]
      })
    )
    return {
      library: library.library,
      package: library.package,
      version,
      headerLine: iconHeaderLine(library.library, version),
      icons,
    }
  })
}
