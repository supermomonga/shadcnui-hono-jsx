import type { Classification } from "../analyzer/classify"
import type { GeneratorConfig } from "../config"
import type { OutputFile } from "../emit/write"
import { LICENSE_NOTICE_PATH } from "../licenses"
import {
  ALLOWED_REGISTRY_DEPENDENCIES,
  findImports,
  packageNameOf,
} from "../policy"
import type { UpstreamLock } from "../upstream/lock"

export const THEME_ITEM = "theme"
export const STYLES_DIR = "styles/shadcn"

/** Hono is a prerequisite of every component, not an installed dependency. */
export const MIN_HONO_VERSION = "4.12.34"

export interface RegistryFile {
  path: string
  type: "registry:file"
  target: string
}

export interface RegistryItem {
  name: string
  type: "registry:item"
  title: string
  description: string
  dependencies?: string[]
  files: RegistryFile[]
  docs?: string
  meta?: Record<string, unknown>
}

export interface Registry {
  $schema: string
  name: string
  homepage: string
  items: RegistryItem[]
}

export interface ComponentEntry {
  name: string
  file: OutputFile
  classification: Classification
  mode: "generated" | "adapter"
}

const title = (name: string) =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

/** Sibling components a generated file imports (`./<name>`). */
export function collectComponentImports(file: OutputFile): string[] {
  const names = new Set<string>()
  for (const specifier of findImports(file.text)) {
    const name = specifier.match(/^\.\/([a-z0-9-]+)$/)?.[1]
    if (name) names.add(name)
  }
  return [...names].sort()
}

/** npm packages a generated file imports, excluding `hono` (a prerequisite). */
export function collectDependencies(file: OutputFile): string[] {
  const packages = new Set<string>()
  for (const specifier of findImports(file.text)) {
    if (/^\.\/[a-z0-9-]+$/.test(specifier)) continue
    const pkg = packageNameOf(specifier)
    if (pkg === null) {
      throw new Error(
        `${file.path} imports ${specifier}; universal items cannot rewrite local imports`
      )
    }
    if (pkg === "hono") continue
    if (!ALLOWED_REGISTRY_DEPENDENCIES.includes(pkg)) {
      throw new Error(
        `${file.path} depends on ${pkg}, which is not allowlisted in policy.ts`
      )
    }
    packages.add(pkg)
  }
  return [...packages].sort()
}

const universalFile = (path: string): RegistryFile => ({
  path,
  type: "registry:file",
  target: `~/${path}`,
})

/**
 * Builds the GitHub source registry. Every item is universal (`registry:item`
 * with explicit `~/` targets), so it installs without components.json or
 * framework detection.
 */
export function buildRegistry(deps: {
  config: GeneratorConfig
  lock: UpstreamLock
  components: ComponentEntry[]
}): Registry {
  const { config, lock } = deps
  const theme: RegistryItem = {
    name: THEME_ITEM,
    type: "registry:item",
    title: "Theme",
    description: `shadcn/ui ${config.style} design tokens, dark mode and custom variants for Tailwind CSS v4.`,
    dependencies: ["tw-animate-css"],
    files: [
      universalFile(`${STYLES_DIR}/theme.css`),
      universalFile(`${STYLES_DIR}/tailwind.css`),
      universalFile(LICENSE_NOTICE_PATH),
    ],
    docs: `Import the theme after Tailwind CSS in your stylesheet: @import "tailwindcss"; @import "<relative path>/styles/shadcn/theme.css"; and make sure Tailwind scans components/ui (add @source if it is outside your source root).`,
    meta: {
      upstream: {
        style: config.style,
        url: lock.theme?.url ?? null,
        sha256: lock.theme?.sha256 ?? null,
        tailwindCss: lock.tailwindCss
          ? `${lock.tailwindCss.package}@${lock.tailwindCss.version}/${lock.tailwindCss.file}`
          : null,
      },
    },
  }
  const byName = new Map(deps.components.map((c) => [c.name, c]))
  /** The component plus every sibling component it imports, transitively. */
  const closure = (name: string, seen = new Set<string>()): Set<string> => {
    const component = byName.get(name)
    if (!component) throw new Error(`${name} is imported but not generated`)
    if (seen.has(name)) return seen
    seen.add(name)
    for (const dependency of collectComponentImports(component.file)) {
      closure(dependency, seen)
    }
    return seen
  }
  const components = [...deps.components]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((component): RegistryItem => {
      const entry = lock.items[component.name]
      // Sibling components are shipped in the same item (not registryDependencies)
      // so a pinned `#ref` installs a consistent set; identical files are skipped.
      const included = [...closure(component.name)]
        .filter((name) => name !== component.name)
        .sort()
        .map((name) => byName.get(name) as ComponentEntry)
      const files = [component, ...included]
      return {
        name: component.name,
        type: "registry:item",
        title: title(component.name),
        description: `Hono JSX port of the shadcn/ui ${config.style} ${component.name} component.`,
        dependencies: [
          ...new Set(files.flatMap((c) => collectDependencies(c.file))),
        ].sort(),
        files: [
          ...files.map((c) => universalFile(c.file.path)),
          universalFile(LICENSE_NOTICE_PATH),
        ],
        docs: `Requires hono >= ${MIN_HONO_VERSION} with "jsxImportSource": "hono/jsx", and the ${config.repository}/${THEME_ITEM} item for styles.`,
        meta: {
          upstream: {
            name: component.name,
            style: config.style,
            contentSha256: entry?.contentSha256 ?? null,
            commit: entry?.upstreamCommit ?? null,
          },
          classification: component.classification.kind,
          mode: component.mode,
        },
      }
    })
  return {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "shadcnui-hono-jsx",
    homepage: `https://github.com/${config.repository}`,
    items: [theme, ...components],
  }
}
