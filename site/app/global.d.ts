import "hono"

declare module "hono" {
  interface ContextRenderer {
    // biome-ignore lint/style/useShorthandFunctionType: HonoX's declaration merging
    (
      content: string | Promise<string>,
      props?: {
        title?: string
        description?: string
        /** Render without the site header and footer (preview frames). */
        bare?: boolean
        /** The page's oEmbed response (`/oembed/<name>.json`), for discovery. */
        oembed?: string
      }
    ): Response | Promise<Response>
  }
}
