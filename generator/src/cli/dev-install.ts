/**
 * Installs the CLI's default preset with every component into the repository
 * root, as `shadcnui-hono-jsx init` does in a user project: components/ui/,
 * styles/shadcn/, public/shadcn/, the license notice and the config (all
 * git-ignored). Tests, type checking, the visual tests and the examples use
 * this install. The theme and fonts come from the upstream snapshot instead of
 * ui.shadcn.com, and no packages are installed: the root package.json lists
 * them.
 *
 * `--style <style>`, `--rtl`, `--menu-color <color>` and `--icon-library
 * <library>` install the default preset with those options, for the visual
 * tests (`bun run test:visual:styles`). Every style uses the snapshotted
 * theme, which suits comparisons with upstream in the same theme.
 */
import { rmSync } from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"
import { encodePreset } from "../../../cli/generated/shadcn-preset.js"
import { readCatalog } from "../../../cli/src/catalog"
import { init } from "../../../cli/src/commands"
import { ICON_LIBRARIES, type IconLibrary } from "../../../cli/src/icons"
import {
  COMPONENTS_DIR,
  CONFIG_FILE,
  LICENSE_NOTICE_FILE,
  SCRIPTS_DIR,
  STYLES_DIR,
} from "../../../cli/src/paths"
import { readNamedPresets } from "../../../cli/src/preset"
import { DEFAULT_PRESET, type FetchJson } from "../../../cli/src/shadcn"
import { MENU_COLORS, type MenuColor } from "../../../cli/src/variants"
import { config } from "../../../generator.config"
import { ROOT } from "../paths"
import { UpstreamStore } from "../upstream/store"

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
const custom =
  style !== config.style || menuColor !== "default" || iconLibrary !== "lucide"

const store = new UpstreamStore(ROOT, config.style)
const lock = store.readLock()
if (!lock?.theme) {
  console.error("upstream/lock.json has no theme; run `bun run upstream:sync`.")
  process.exit(1)
}

const snapshot: FetchJson = async (url) => {
  if (url === lock.theme?.url || new URL(url).pathname === "/init") {
    return store.readTheme()
  }
  const font = Object.entries(lock.fonts).find(([, entry]) => entry.url === url)
  if (font) return store.readFont(font[0])
  throw new Error(
    `The upstream snapshot has no ${url}; run \`bun run upstream:sync\`.`
  )
}

for (const target of [
  COMPONENTS_DIR,
  STYLES_DIR,
  SCRIPTS_DIR,
  LICENSE_NOTICE_FILE,
  CONFIG_FILE,
]) {
  rmSync(path.join(ROOT, target), { recursive: true, force: true })
}

const catalog = readCatalog()
await init(
  {
    cwd: ROOT,
    catalog,
    fetch: snapshot,
    install: (_cwd, packages) => {
      throw new Error(
        `Add ${packages.join(", ")} to the root devDependencies for the development install.`
      )
    },
    log: () => {},
  },
  {
    preset: custom
      ? encodePreset({
          ...readNamedPresets()[DEFAULT_PRESET],
          style: style.replace(/^base-/, "") as never,
          menuColor,
          iconLibrary,
        })
      : undefined,
    rtl: values.rtl,
    pointer: false,
    force: true,
    components: catalog.items.map((item) => item.name),
  }
)
const options = [
  ...(style === config.style ? [] : [style]),
  ...(values.rtl ? ["RTL"] : []),
  ...(menuColor === "default" ? [] : [`menu ${menuColor}`]),
  ...(iconLibrary === "lucide" ? [] : [`${iconLibrary} icons`]),
]
console.log(
  `Installed the default preset${options.length > 0 ? ` (${options.join(", ")})` : ""} and ${catalog.items.length} components into the repository root.`
)
