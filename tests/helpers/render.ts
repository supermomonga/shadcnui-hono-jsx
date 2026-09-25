export interface RenderedElement {
  tag: string
  attributes: Record<string, string>
  /** Whitespace-separated class tokens. */
  classes: string[]
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
}

const decode = (value: string) =>
  value.replace(
    /&(amp|lt|gt|quot|#39);/g,
    (entity) => ENTITIES[entity] ?? entity
  )

/** Renders a Hono JSX element (sync or async) to an HTML string. */
export async function render(node: unknown): Promise<string> {
  return String(await node)
}

/** Parses the rendered HTML and returns every element matching `selector`. */
export async function query(
  html: string,
  selector: string
): Promise<RenderedElement[]> {
  const found: RenderedElement[] = []
  const rewriter = new HTMLRewriter().on(selector, {
    element(element) {
      const attributes: Record<string, string> = {}
      for (const [name, value] of element.attributes)
        attributes[name] = decode(value)
      found.push({
        tag: element.tagName,
        attributes,
        classes: (attributes.class ?? "").split(/\s+/).filter(Boolean),
      })
    },
  })
  await rewriter.transform(new Response(html)).text()
  return found
}

/** Renders `node` and returns its single element matching `selector`. */
export async function renderOne(
  node: unknown,
  selector: string
): Promise<RenderedElement> {
  const elements = await query(await render(node), selector)
  if (elements.length !== 1) {
    throw new Error(
      `Expected one element for "${selector}", found ${elements.length}`
    )
  }
  return elements[0] as RenderedElement
}

/** Attributes that must never leak from component props into the DOM. */
export const LEAKY_ATTRIBUTES = [
  "classname",
  "variant",
  "size",
  "render",
  "aschild",
  "ref",
]
