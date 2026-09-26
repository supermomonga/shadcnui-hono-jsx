/**
 * Hand-written versions of the sections of the create page's registry
 * examples (upstream/site/registry/) that need React, in
 * `registry-overrides/<example>.tsx`. Sections without one are left out of
 * the preview. Recorded like the docs examples' overrides (./overrides.ts):
 * upstream function name → SHA-256 of its upstream text.
 */
import type { Override } from "./overrides"

export const REGISTRY_OVERRIDES: Record<string, Override> = {}
