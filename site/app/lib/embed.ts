/**
 * Embeds of component pages: `/embed/<name>` shows the component's demo live,
 * and `/oembed/<name>.json` offers it to oEmbed consumers (Notion, WordPress,
 * Misskey...) as a frame; link previews come from the pages' Open Graph tags.
 */
import { type ComponentEntry, components, titleOf } from "./catalog"
import { componentPages } from "./docs"
import { exampleComponent } from "./examples"
import { siteConfig } from "./site"

/** The size of the frame that the oEmbed responses embed. */
export const EMBED_SIZE = { width: 720, height: 400 }

/** The title and description of a component's page. */
export function componentMeta(entry: ComponentEntry): {
  title: string
  description: string
} {
  const page = componentPages.get(entry.name)
  const basedOn = entry.compatibility?.basedOn?.map((b) => b.name) ?? []
  return {
    title: page?.frontmatter.title ?? entry.title,
    description:
      page?.frontmatter.description ??
      (entry.kind === "lite"
        ? `A hand-written alternative to the shadcn/ui ${basedOn.map(titleOf).join(" and ")} component, without JavaScript.`
        : `The shadcn/ui ${entry.title} component for Hono JSX.`),
  }
}

/** The example the component's embed shows: the demo that opens its page. */
export function embedExample(name: string): string | undefined {
  const example = `${name}-demo`
  return exampleComponent(example) ? example : undefined
}

/** Components with an embed (every one with a demo). */
export const embeddable = components.filter((entry) => embedExample(entry.name))

export function oembedPath(name: string): string {
  return `/oembed/${name}.json`
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
}

/** The oEmbed response (https://oembed.com, type "rich") of a component page. */
export function oembedResponse(entry: ComponentEntry) {
  const { title, description } = componentMeta(entry)
  const src = new URL(`/embed/${entry.name}`, siteConfig.url).toString()
  const { width, height } = EMBED_SIZE
  const image = siteConfig.ogImage
  return {
    version: "1.0",
    type: "rich",
    title,
    // Not in the specification; read by some consumers (Iframely, Embedly).
    description,
    provider_name: siteConfig.name,
    provider_url: siteConfig.url,
    html: `<iframe src="${src}" width="${width}" height="${height}" style="border:0;max-width:100%" title="${escapeAttribute(`${title} - ${siteConfig.name}`)}" loading="lazy"></iframe>`,
    width,
    height,
    thumbnail_url: new URL(image.url, siteConfig.url).toString(),
    thumbnail_width: image.width,
    thumbnail_height: image.height,
    cache_age: 60 * 60 * 24,
  }
}
