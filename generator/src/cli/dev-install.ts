/**
 * Installs the CLI's default preset with every component into the repository
 * root, as `shadcnui-hono-jsx init` does in a user project: components/ui/,
 * styles/shadcn/, public/shadcn/, the license notice and the config (all
 * git-ignored). Tests, type checking, the visual tests and the examples use
 * this install. The theme and fonts come from the upstream snapshot instead of
 * ui.shadcn.com, and no packages are installed: the root package.json lists
 * them.
 */
import { rmSync } from "node:fs"
import path from "node:path"
import { readCatalog } from "../../../cli/src/catalog"
import { init } from "../../../cli/src/commands"
import {
  COMPONENTS_DIR,
  CONFIG_FILE,
  LICENSE_NOTICE_FILE,
  SCRIPTS_DIR,
  STYLES_DIR,
} from "../../../cli/src/paths"
import type { FetchJson } from "../../../cli/src/shadcn"
import { config } from "../../../generator.config"
import { ROOT } from "../paths"
import { UpstreamStore } from "../upstream/store"

const store = new UpstreamStore(ROOT, config.style)
const lock = store.readLock()
if (!lock?.theme) {
  console.error("upstream/lock.json has no theme; run `bun run upstream:sync`.")
  process.exit(1)
}

const snapshot: FetchJson = async (url) => {
  if (url === lock.theme?.url) return store.readTheme()
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
    rtl: false,
    pointer: false,
    force: true,
    components: catalog.items.map((item) => item.name),
  }
)
console.log(
  `Installed the default preset and ${catalog.items.length} components into the repository root.`
)
