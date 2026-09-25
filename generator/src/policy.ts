/**
 * Dependency policy for generated output.
 *
 * Generated components must stay React-free, and registry items may only
 * install allowlisted npm packages. Adding a package here requires an ADR.
 */

export const PROHIBITED_MODULES: readonly RegExp[] = [
  /^react(\/|$)/,
  /^react-dom(\/|$)/,
  /^@base-ui\//,
  /^@base-ui-components\//,
  /^@radix-ui\//,
  /^radix-ui(\/|$)/,
  /^lucide-react(\/|$)/,
  /^next(\/|$)/,
  /^@floating-ui\/react(-dom)?(\/|$)/,
  /^@hono\/react-renderer(\/|$)/,
]

export const ALLOWED_REGISTRY_DEPENDENCIES: readonly string[] = [
  "class-variance-authority",
  "cn",
  "tw-animate-css",
]

export function isProhibitedModule(specifier: string): boolean {
  return PROHIBITED_MODULES.some((pattern) => pattern.test(specifier))
}

const IMPORT_PATTERN =
  /(?:^|[\s;])(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,$]+\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|require\(\s*["']([^"']+)["']\s*\)/g

/** Returns every module specifier imported, re-exported, or required by `source`. */
export function findImports(source: string): string[] {
  const specifiers: string[] = []
  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const specifier = match[1] ?? match[2] ?? match[3]
    if (specifier) specifiers.push(specifier)
  }
  return specifiers
}

/** Returns the prohibited module specifiers used by `source`. */
export function findProhibitedImports(source: string): string[] {
  return findImports(source).filter(isProhibitedModule)
}

/** Maps a module specifier to the npm package that provides it, or null for relative/builtin imports. */
export function packageNameOf(specifier: string): string | null {
  if (specifier.startsWith(".") || specifier.startsWith("/")) return null
  if (specifier.startsWith("node:") || specifier.startsWith("~/")) return null
  if (specifier.startsWith("@/")) return null
  const parts = specifier.split("/")
  if (specifier.startsWith("@")) {
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null
  }
  return parts[0] ?? null
}
