import { createHash } from "node:crypto"
import type { UpstreamItem } from "./types"

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex")
}

/**
 * Hash of an item's file paths and contents only, so metadata-only upstream
 * changes do not alter the revision recorded in generated file headers.
 */
export function contentSha256(item: UpstreamItem): string {
  const files = [...(item.files ?? [])].sort((a, b) =>
    a.path.localeCompare(b.path)
  )
  return sha256(files.map((f) => `${f.path}\0${f.content}\0`).join(""))
}

/** Canonical on-disk JSON text: two-space indentation and a trailing newline. */
export function toJsonText(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}
