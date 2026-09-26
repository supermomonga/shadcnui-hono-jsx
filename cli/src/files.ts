import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { UsageError } from "./errors"

export interface PlannedFile {
  /** Path relative to the project root, with `/` separators. */
  path: string
  text: string
}

export interface WriteSummary {
  created: string[]
  updated: string[]
  unchanged: string[]
}

/** Drops repeated paths (a sibling component shipped with several items). */
export function uniqueFiles(files: readonly PlannedFile[]): PlannedFile[] {
  const byPath = new Map<string, PlannedFile>()
  for (const file of files) {
    const seen = byPath.get(file.path)
    if (seen && seen.text !== file.text) {
      throw new Error(`${file.path} was planned with two different contents`)
    }
    byPath.set(file.path, file)
  }
  return [...byPath.values()]
}

/**
 * Writes files into the project. Identical files are left alone; a file with
 * other content is only replaced with `overwrite`, otherwise nothing is
 * written and the conflicts are reported.
 */
export function writeFiles(
  cwd: string,
  files: readonly PlannedFile[],
  options: { overwrite: boolean; hint: string }
): WriteSummary {
  const summary: WriteSummary = { created: [], updated: [], unchanged: [] }
  const planned = uniqueFiles(files).map((file) => {
    const target = path.join(cwd, file.path)
    const current = existsSync(target) ? readFileSync(target, "utf8") : null
    return { file, target, current }
  })
  const conflicts = planned.filter(
    ({ file, current }) => current !== null && current !== file.text
  )
  if (conflicts.length > 0 && !options.overwrite) {
    throw new UsageError(
      `These files exist with other content:\n${conflicts.map(({ file }) => `  ${file.path}`).join("\n")}\n${options.hint}`
    )
  }
  for (const { file, target, current } of planned) {
    if (current === file.text) {
      summary.unchanged.push(file.path)
      continue
    }
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, file.text)
    ;(current === null ? summary.created : summary.updated).push(file.path)
  }
  return summary
}
