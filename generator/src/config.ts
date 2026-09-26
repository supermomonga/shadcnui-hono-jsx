export interface GeneratorConfig {
  /** GitHub repository that serves the registry, as `owner/name`. */
  repository: string
  /** Upstream shadcn/ui style that is snapshotted and translated. */
  style: string
  /** Base URL of the upstream shadcn/ui registry. */
  registryBaseUrl: string
  /** URL of the upstream repository's license, snapshotted for review (never redistributed as-is). */
  licenseUrl: string
  /** Upstream item types that are snapshotted and classified. */
  trackedTypes: readonly string[]
  /** Upstream item names that are translated into Hono JSX components. */
  components: readonly string[]
}

export function itemUrl(config: GeneratorConfig, name: string): string {
  return `${config.registryBaseUrl}/styles/${config.style}/${name}.json`
}

export function indexUrl(config: GeneratorConfig): string {
  return `${config.registryBaseUrl}/styles/${config.style}/registry.json`
}
