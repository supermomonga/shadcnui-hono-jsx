import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { UsageError } from "./errors"
import type { PlannedFile } from "./files"
import { CONFIG_FILE } from "./paths"

/** `shadcnui-hono-jsx.json`: the preset the project's files were installed with. */
export interface ProjectConfig {
  /** Preset code from https://ui.shadcn.com/create. */
  preset: string
  rtl: boolean
  pointer: boolean
}

export function readConfig(cwd: string): ProjectConfig | null {
  const file = path.join(cwd, CONFIG_FILE)
  if (!existsSync(file)) return null
  const value = JSON.parse(readFileSync(file, "utf8")) as Partial<ProjectConfig>
  if (typeof value.preset !== "string") {
    throw new UsageError(`${CONFIG_FILE} has no "preset"`)
  }
  return {
    preset: value.preset,
    rtl: value.rtl === true,
    pointer: value.pointer === true,
  }
}

export function requireConfig(cwd: string): ProjectConfig {
  const config = readConfig(cwd)
  if (!config) {
    throw new UsageError(
      `No ${CONFIG_FILE} in ${cwd}. Run \`shadcnui-hono-jsx init\` first.`
    )
  }
  return config
}

export function configFile(config: ProjectConfig): PlannedFile {
  return { path: CONFIG_FILE, text: `${JSON.stringify(config, null, 2)}\n` }
}
