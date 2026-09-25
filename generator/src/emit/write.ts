import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"

export interface OutputFile {
  /** Repository-relative path. */
  path: string
  text: string
}

export interface WriteResult {
  written: string[]
  deleted: string[]
  /** Files whose content differs from disk (or that are missing / stale). */
  stale: string[]
}

/**
 * Writes `files` under `root`, and deletes files in `prune` directories that
 * match `pruneExtension` and are not part of `files`. In check mode nothing is
 * written; differences are reported as `stale`.
 */
export function writeOutputs(
  root: string,
  files: readonly OutputFile[],
  options: { check: boolean; prune?: { dir: string; extension: string }[] }
): WriteResult {
  const result: WriteResult = { written: [], deleted: [], stale: [] }
  for (const file of files) {
    const target = path.join(root, file.path)
    const current = existsSync(target) ? readFileSync(target, "utf8") : null
    if (current === file.text) continue
    result.stale.push(file.path)
    if (!options.check) {
      mkdirSync(path.dirname(target), { recursive: true })
      writeFileSync(target, file.text)
      result.written.push(file.path)
    }
  }
  const expected = new Set(files.map((f) => f.path))
  for (const { dir, extension } of options.prune ?? []) {
    const absolute = path.join(root, dir)
    if (!existsSync(absolute)) continue
    for (const entry of readdirSync(absolute).sort()) {
      const relative = path.posix.join(dir, entry)
      if (!entry.endsWith(extension) || expected.has(relative)) continue
      result.stale.push(relative)
      if (!options.check) {
        rmSync(path.join(root, relative))
        result.deleted.push(relative)
      }
    }
  }
  return result
}
