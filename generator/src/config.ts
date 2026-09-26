export interface GeneratorConfig {
  /** GitHub repository that serves the registry, as `owner/name`. */
  repository: string
  /**
   * The style of the CLI's default preset. Per-style steps receive a copy
   * with `style` set to the style at hand (see `forStyle`).
   */
  style: string
  /** Every Base UI style that is snapshotted and translated (docs/adr/0030). */
  styles: readonly string[]
  /** Base URL of the upstream shadcn/ui registry. */
  registryBaseUrl: string
  /** URL of the upstream repository's license, snapshotted for review (never redistributed as-is). */
  licenseUrl: string
  /** Upstream item types that are snapshotted and classified. */
  trackedTypes: readonly string[]
  /** Upstream item names that are translated into Hono JSX components. */
  components: readonly string[]
}

/** The config for one of its styles. */
export function forStyle(
  config: GeneratorConfig,
  style: string
): GeneratorConfig {
  return { ...config, style }
}

export function itemUrl(config: GeneratorConfig, name: string): string {
  return `${config.registryBaseUrl}/styles/${config.style}/${name}.json`
}

export function indexUrl(config: GeneratorConfig): string {
  return `${config.registryBaseUrl}/styles/${config.style}/registry.json`
}
