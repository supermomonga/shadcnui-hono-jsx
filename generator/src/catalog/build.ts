import type { Catalog, CatalogItem } from "../../../cli/src/catalog"
import type { ThemeItem } from "../../../cli/src/theme"
import { COMPONENT_ADAPTERS } from "../adapters/components"
import { behaviorsOf } from "../adapters/families"
import type { Classification } from "../analyzer/classify"
import { reasonKey } from "../analyzer/reasons"
import type { GeneratorConfig } from "../config"
import type { OutputFile } from "../emit/write"
import { derivedNoticeLines } from "../licenses"
import { LITE_COMPONENTS } from "../lite"
import {
  ALLOWED_REGISTRY_DEPENDENCIES,
  findImports,
  packageNameOf,
} from "../policy"

/** Hono is a prerequisite of every component, not an installed dependency. */
export const MIN_HONO_VERSION = "4.12.34"

export interface ComponentEntry {
  name: string
  file: OutputFile
  classification: Classification
  mode: "generated" | "adapter" | "lite"
}

/** Sibling components a generated file imports (`./<name>`). */
export function collectComponentImports(file: OutputFile): string[] {
  const names = new Set<string>()
  for (const specifier of findImports(file.text)) {
    const name = specifier.match(/^\.\/([a-z0-9-]+)$/)?.[1]
    if (name) names.add(name)
  }
  return [...names].sort()
}

function allowlisted(pkg: string, source: string): string {
  if (!ALLOWED_REGISTRY_DEPENDENCIES.includes(pkg)) {
    throw new Error(
      `${source} depends on ${pkg}, which is not allowlisted in policy.ts`
    )
  }
  return pkg
}

/** npm packages a generated file imports, excluding `hono` (a prerequisite). */
export function collectDependencies(file: OutputFile): string[] {
  const packages = new Set<string>()
  for (const specifier of findImports(file.text)) {
    if (/^\.\/[a-z0-9-]+$/.test(specifier)) continue
    const pkg = packageNameOf(specifier)
    if (pkg === null) {
      throw new Error(
        `${file.path} imports ${specifier}; installed files cannot rewrite local imports`
      )
    }
    if (pkg === "hono") continue
    packages.add(allowlisted(pkg, file.path))
  }
  return [...packages].sort()
}

/**
 * npm packages the theme's CSS imports, besides the vendored
 * `shadcn/tailwind.css`. Font packages are added by the CLI per preset.
 */
export function collectThemeDependencies(theme: ThemeItem): string[] {
  return Object.keys(theme.css ?? {})
    .map((key) => key.match(/^@import "([^"]+)"$/)?.[1])
    .filter((specifier): specifier is string => specifier !== undefined)
    .filter((specifier) => specifier !== "shadcn/tailwind.css")
    .map((specifier) => {
      const pkg = packageNameOf(specifier)
      if (pkg === null) throw new Error(`The theme imports ${specifier}`)
      return allowlisted(pkg, "The theme")
    })
    .sort()
}

/**
 * Builds `cli/generated/catalog.json`: what the CLI installs for each item
 * (docs/adr/0029).
 */
export function buildCatalog(deps: {
  config: GeneratorConfig
  theme: ThemeItem
  components: ComponentEntry[]
}): Catalog {
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
  const items = [...deps.components]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((component): CatalogItem => {
      const siblings = [...closure(component.name)]
        .filter((name) => name !== component.name)
        .sort()
      const files = [component.name, ...siblings].map(
        (name) => byName.get(name) as ComponentEntry
      )
      return {
        name: component.name,
        kind: LITE_COMPONENTS[component.name] ? "lite" : "port",
        components: files.map((c) => c.name),
        dependencies: [
          ...new Set(files.flatMap((c) => collectDependencies(c.file))),
        ].sort(),
        scripts: [
          ...new Set(
            files.flatMap((c) =>
              behaviorsOf(
                c.classification.reasons.map(reasonKey),
                COMPONENT_ADAPTERS[c.name]
              )
            )
          ),
        ].sort(),
      }
    })
  return {
    styles: [deps.config.style],
    items,
    themeDependencies: collectThemeDependencies(deps.theme),
    noticeLines: derivedNoticeLines(),
  }
}
