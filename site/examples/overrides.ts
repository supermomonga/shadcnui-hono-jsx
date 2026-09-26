/**
 * Hand-written versions of upstream example functions that `site:generate`
 * cannot translate (they use React state, event handlers or React-only
 * libraries). Each override lives in `overrides/<example>.tsx`, exports the
 * replaced functions under their upstream names, and records the SHA-256 of
 * the upstream function it replaces: when upstream changes it,
 * `site:generate` fails until the override is reviewed and the hash updated.
 */
export interface Override {
  /** Upstream function name → SHA-256 of its upstream text. */
  functions: Record<string, string>
  /** What the override does instead of the React behavior. */
  reason: string
}

export const OVERRIDES: Record<string, Override> = {}

/** Examples the site shows no version of, with the reason shown instead. */
export const SKIPPED: Record<string, string> = {}
