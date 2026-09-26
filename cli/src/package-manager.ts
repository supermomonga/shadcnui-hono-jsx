import { spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { UsageError } from "./errors"

export type PackageManager = "bun" | "pnpm" | "yarn" | "npm"

const LOCKFILES: readonly [string, PackageManager][] = [
  ["bun.lock", "bun"],
  ["bun.lockb", "bun"],
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["package-lock.json", "npm"],
]

/** The package manager whose lockfile is nearest to `cwd`; npm without one. */
export function detectPackageManager(cwd: string): PackageManager {
  for (let dir = path.resolve(cwd); ; dir = path.dirname(dir)) {
    for (const [file, manager] of LOCKFILES) {
      if (existsSync(path.join(dir, file))) return manager
    }
    if (path.dirname(dir) === dir) return "npm"
  }
}

export function readPackageJson(cwd: string): {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
} {
  const file = path.join(cwd, "package.json")
  if (!existsSync(file)) {
    throw new UsageError(
      `No package.json in ${cwd}. Run the command in your Hono project (or pass --cwd).`
    )
  }
  return JSON.parse(readFileSync(file, "utf8"))
}

/** Packages that package.json does not list yet. */
export function missingDependencies(
  cwd: string,
  packages: readonly string[]
): string[] {
  const pkg = readPackageJson(cwd)
  const listed = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ])
  return [...new Set(packages)].filter((name) => !listed.has(name)).sort()
}

export function installCommand(
  manager: PackageManager,
  packages: readonly string[]
): string[] {
  return [manager, manager === "npm" ? "install" : "add", ...packages]
}

/** Installs npm packages into the project; replaced by `--no-install`. */
export type Installer = (cwd: string, packages: readonly string[]) => void

export const runInstall: Installer = (cwd, packages) => {
  const [command, ...args] = installCommand(detectPackageManager(cwd), packages)
  const result = spawnSync(command as string, args, {
    cwd,
    stdio: "inherit",
  })
  if (result.status !== 0) {
    throw new UsageError(`${[command, ...args].join(" ")} failed`)
  }
}
