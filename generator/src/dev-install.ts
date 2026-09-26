/**
 * Installs the CLI's default preset with every component into a project, as
 * `shadcnui-hono-jsx init` does: components/ui/, styles/shadcn/,
 * public/shadcn/, the license notice and the config. The theme and fonts come
 * from the upstream snapshot instead of ui.shadcn.com, and no packages are
 * installed: the project's package.json must already list them.
 *
 * The repository root (`bun run dev:install`) and the documentation site
 * (`bun run site:install`) use it. `style`, `rtl`, `menuColor` and
 * `iconLibrary` install the default preset with those options; every style
 * uses the snapshotted theme.
 */
import { rmSync } from "node:fs"
import path from "node:path"
import { encodePreset } from "../../cli/generated/shadcn-preset.js"
import { type Catalog, readCatalog } from "../../cli/src/catalog"
import { init } from "../../cli/src/commands"
import type { IconLibrary } from "../../cli/src/icons"
import {
  COMPONENTS_DIR,
  CONFIG_FILE,
  LICENSE_NOTICE_FILE,
  SCRIPTS_DIR,
  STYLES_DIR,
} from "../../cli/src/paths"
import { readNamedPresets } from "../../cli/src/preset"
import { DEFAULT_PRESET, type FetchJson } from "../../cli/src/shadcn"
import type { MenuColor } from "../../cli/src/variants"
import { config } from "../../generator.config"
import { ROOT } from "./paths"
import { UpstreamStore } from "./upstream/store"

export interface DevInstallOptions {
  /** Project root to install into; its package.json lists the packages. */
  cwd: string
  style?: string
  rtl?: boolean
  menuColor?: MenuColor
  iconLibrary?: IconLibrary
}

/** The theme and fonts of the upstream snapshot, in place of ui.shadcn.com. */
export function snapshotFetch(): FetchJson {
  const store = new UpstreamStore(ROOT, config.style)
  const lock = store.readLock()
  if (!lock?.theme) {
    throw new Error(
      "upstream/lock.json has no theme; run `bun run upstream:sync`."
    )
  }
  return async (url) => {
    if (url === lock.theme?.url || new URL(url).pathname === "/init") {
      return store.readTheme()
    }
    const font = Object.entries(lock.fonts).find(
      ([, entry]) => entry.url === url
    )
    if (font) return store.readFont(font[0])
    throw new Error(
      `The upstream snapshot has no ${url}; run \`bun run upstream:sync\`.`
    )
  }
}

export async function devInstall(options: DevInstallOptions): Promise<Catalog> {
  const style = options.style ?? config.style
  const menuColor = options.menuColor ?? "default"
  const iconLibrary = options.iconLibrary ?? "lucide"
  if (!config.styles.includes(style)) {
    throw new Error(`style takes one of ${config.styles.join(", ")}`)
  }
  const custom =
    style !== config.style ||
    menuColor !== "default" ||
    iconLibrary !== "lucide"
  const fetch = snapshotFetch()

  for (const target of [
    COMPONENTS_DIR,
    STYLES_DIR,
    SCRIPTS_DIR,
    LICENSE_NOTICE_FILE,
    CONFIG_FILE,
  ]) {
    rmSync(path.join(options.cwd, target), { recursive: true, force: true })
  }

  const catalog = readCatalog()
  await init(
    {
      cwd: options.cwd,
      catalog,
      fetch,
      install: (_cwd, packages) => {
        throw new Error(
          `Add ${packages.join(", ")} to ${path.join(options.cwd, "package.json")} for the development install.`
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
      rtl: options.rtl ?? false,
      pointer: false,
      force: true,
      components: catalog.items.map((item) => item.name),
    }
  )
  return catalog
}
