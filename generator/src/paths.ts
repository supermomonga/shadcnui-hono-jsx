import path from "node:path"
import { fileURLToPath } from "node:url"

/** Absolute path of the repository root. */
export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
)
