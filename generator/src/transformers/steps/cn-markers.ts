import { SyntaxKind } from "ts-morph"
import type { TransformStep } from "../context"

/**
 * Replicates the shadcn CLI's install-time handling of `cn-*` placeholder
 * classes: `cn-font-heading` becomes `font-heading` (the theme always defines
 * `--font-heading`), every other `cn-*` class is removed.
 */
export const CN_MARKER_REPLACEMENTS: Readonly<Record<string, string>> = {
  "cn-font-heading": "font-heading",
}

const MARKER = /^cn-[a-z-]+$/

export function rewriteClassTokens(value: string): string {
  const tokens = value.split(/\s+/).filter((t) => t.length > 0)
  if (!tokens.some((t) => MARKER.test(t))) return value
  return tokens
    .map((t) => (MARKER.test(t) ? (CN_MARKER_REPLACEMENTS[t] ?? null) : t))
    .filter((t): t is string => t !== null)
    .join(" ")
}

export const cnMarkers: TransformStep = {
  name: "cn-markers",
  run(ctx) {
    const literals = [
      ...ctx.sf.getDescendantsOfKind(SyntaxKind.StringLiteral),
      ...ctx.sf.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral),
    ]
    for (const literal of literals.reverse()) {
      if (literal.getFirstAncestorByKind(SyntaxKind.ImportDeclaration)) continue
      const value = literal.getLiteralValue()
      const next = rewriteClassTokens(value)
      if (next !== value) {
        ctx.log.push(`cn-markers: "${value}" -> "${next}"`)
        literal.setLiteralValue(next)
      }
    }
  },
}
