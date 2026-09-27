/**
 * Installs the CLI's default preset with every component into the repository
 * root (all git-ignored). Tests, type checking, the visual tests and the
 * examples use this install; see ../dev-install.ts.
 *
 * `--style <style>`, `--rtl`, `--menu-color <color>` and `--icon-library
 * <library>` install the default preset with those options, for the visual
 * tests (`bun run test:visual:styles`). Every style uses the snapshotted
 * theme, which suits comparisons with upstream in the same theme.
 */
import { parseArgs } from "node:util"
import { ICON_LIBRARIES, type IconLibrary } from "../../../cli/src/icons"
import { MENU_COLORS, type MenuColor } from "../../../cli/src/variants"
import { config } from "../../../generator.config"
import { devInstall } from "../dev-install"
import { ROOT } from "../paths"

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    style: { type: "string", default: config.style },
    rtl: { type: "boolean", default: false },
    "menu-color": { type: "string", default: "default" },
    "icon-library": { type: "string", default: "lucide" },
  },
})
const style = values.style
const menuColor = values["menu-color"] as MenuColor
if (!config.styles.includes(style)) {
  console.error(`--style takes one of ${config.styles.join(", ")}`)
  process.exit(1)
}
if (!MENU_COLORS.includes(menuColor)) {
  console.error(`--menu-color takes one of ${MENU_COLORS.join(", ")}`)
  process.exit(1)
}
const iconLibrary = values["icon-library"] as IconLibrary
if (!ICON_LIBRARIES.includes(iconLibrary)) {
  console.error(`--icon-library takes one of ${ICON_LIBRARIES.join(", ")}`)
  process.exit(1)
}

const catalog = await devInstall({
  cwd: ROOT,
  style,
  rtl: values.rtl,
  menuColor,
  iconLibrary,
})
const options = [
  ...(style === config.style ? [] : [style]),
  ...(values.rtl ? ["RTL"] : []),
  ...(menuColor === "default" ? [] : [`menu ${menuColor}`]),
  ...(iconLibrary === "lucide" ? [] : [`${iconLibrary} icons`]),
]
console.log(
  `Installed the default preset${options.length > 0 ? ` (${options.join(", ")})` : ""} and ${catalog.items.length} components into the repository root.`
)
