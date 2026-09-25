export const BLOCKING_CODES = [
  "no-files",
  "multi-file",
  "unsupported-file-type",
  "unknown-import",
  "registry-import",
  "icon-unresolved",
  "render-prop",
  "base-ui-primitive-unmapped",
  "react-runtime-api",
  "react-hook",
  "use-render-noncanonical",
  "react-type-unmapped",
  "event-handler",
  "registry-dependency",
] as const

export const REWRITE_CODES = [
  "use-client-directive",
  "react-type-rewrite",
  "classname-to-class",
  "base-ui-primitive-mapped",
  "base-ui-use-render",
  "cn-marker",
  "component-import",
  "component-dependency",
  "icon-placeholder",
  "lucide-icon",
  "render-composition",
  "memo-hook",
  "react-context",
  "control-state-class",
] as const

export type BlockingCode = (typeof BLOCKING_CODES)[number]
export type RewriteCode = (typeof REWRITE_CODES)[number]
export type ReasonCode = BlockingCode | RewriteCode

export interface Reason {
  code: ReasonCode
  detail?: string
  blocking: boolean
}

export function reason(code: ReasonCode, detail?: string): Reason {
  const blocking = (BLOCKING_CODES as readonly string[]).includes(code)
  return detail === undefined ? { code, blocking } : { code, detail, blocking }
}

/** `code` or `code:detail`, as used in manifests and adapter `resolves` lists. */
export function reasonKey(r: Reason): string {
  return r.detail === undefined ? r.code : `${r.code}:${r.detail}`
}

/** Blocking first, then by key; duplicates removed. */
export function sortReasons(reasons: readonly Reason[]): Reason[] {
  const unique = new Map(reasons.map((r) => [reasonKey(r), r]))
  return [...unique.values()].sort((a, b) =>
    a.blocking !== b.blocking
      ? a.blocking
        ? -1
        : 1
      : reasonKey(a).localeCompare(reasonKey(b))
  )
}
