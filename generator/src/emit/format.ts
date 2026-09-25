import path from "node:path"
import { ROOT } from "../paths"

const BIOME = path.join(ROOT, "node_modules", ".bin", "biome")

/**
 * Formats and organizes imports with the pinned Biome, exactly as
 * `biome check --write` would for a file at `repoPath`.
 */
export function formatWithBiome(text: string, repoPath: string): string {
  const result = Bun.spawnSync(
    [
      BIOME,
      "check",
      "--write",
      "--colors=off",
      `--stdin-file-path=${repoPath}`,
    ],
    { cwd: ROOT, stdin: Buffer.from(text), stdout: "pipe", stderr: "pipe" }
  )
  if (result.exitCode !== 0) {
    throw new Error(
      `biome failed for ${repoPath}:\n${result.stderr.toString()}${result.stdout.toString()}`
    )
  }
  return result.stdout.toString()
}
