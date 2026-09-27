/**
 * Installs the components the site renders, as `shadcnui-hono-jsx init` does
 * in a user project, into git-ignored directories under site/.installs/:
 *
 * - `nova`: the default preset; the site itself and most examples
 *   (`@/components/ui/*`).
 * - `nova-rtl`: the default preset with `--rtl`, for the RTL examples
 *   (`@/ui/nova-rtl/*`).
 * - `rhea`: the rhea style, for the chat examples and the home page cards
 *   (`@/ui/rhea/*`).
 *
 * The client scripts, the same for every install, are copied to
 * site/public/shadcn/, which the site serves at /shadcn/.
 */
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { devInstall } from "../../generator/src/dev-install"
import site from "../package.json"

export const SITE_DIR = path.resolve(import.meta.dirname, "..")
export const INSTALLS_DIR = path.join(SITE_DIR, ".installs")

export const INSTALLS = [
  { id: "nova" },
  { id: "nova-rtl", rtl: true },
  { id: "rhea", style: "base-rhea" },
] as const

for (const install of INSTALLS) {
  const cwd = path.join(INSTALLS_DIR, install.id)
  mkdirSync(cwd, { recursive: true })
  writeFileSync(
    path.join(cwd, "package.json"),
    `${JSON.stringify({ private: true, dependencies: site.dependencies }, null, 2)}\n`
  )
  await devInstall({ cwd, ...install })
}

const scripts = path.join(SITE_DIR, "public/shadcn")
rmSync(scripts, { recursive: true, force: true })
cpSync(path.join(INSTALLS_DIR, "nova/public/shadcn"), scripts, {
  recursive: true,
})
console.log(
  `Installed ${INSTALLS.map((install) => install.id).join(", ")} into site/.installs/.`
)
