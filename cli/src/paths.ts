import path from "node:path"
import { fileURLToPath } from "node:url"

/** Root of the CLI package (the directory of its package.json). */
export const PACKAGE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
)

/** Files written by `bun run generate` (docs/adr/0030). */
export const GENERATED_DIR = path.join(PACKAGE_DIR, "generated")

/** Hand-written client scripts, installed as they are (docs/adr/0025). */
export const CLIENT_DIR = path.join(PACKAGE_DIR, "client")

/** Templates of every style: `<GENERATED_DIR>/templates/<style>/<name>.tsx`. */
export const TEMPLATES_DIR = path.join(GENERATED_DIR, "templates")

// Locations in the user's project, relative to its root (docs/adr/0029).
export const CONFIG_FILE = "shadcnui-hono-jsx.json"
export const COMPONENTS_DIR = "components/ui"
export const STYLES_DIR = "styles/shadcn"
export const SCRIPTS_DIR = "public/shadcn"
export const LICENSE_NOTICE_FILE = "LICENSE-shadcnui-hono-jsx.txt"
