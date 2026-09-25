/**
 * File-local support for Base UI's `render` prop (docs/adr/0018): a component
 * renders the given element (or calls the given function) instead of its
 * default element, with its own props merged in. Server-side only.
 */
export const RENDER_HELPER = `/** An element (or a function returning one) that replaces the default element, as in Base UI. */
type RenderProp = Child | ((props: Record<string, unknown>) => Child)

/**
 * Renders \`render\` in place of \`element\`, merging props like Base UI's
 * mergeProps: the render element's props win, classes are combined (the render
 * element's first) and styles are merged. \`type\` only applies to button and
 * input targets.
 */
function renderElement<Element>(
  element: Element,
  render: RenderProp | undefined
): Element {
  if (render === undefined) return element
  const own: Record<string, unknown> = {
    ...(element as unknown as JSXNode).props,
  }
  if (typeof render === "function") return render(own) as Element
  if (!isValidElement(render)) {
    throw new Error("render must be a JSX element or a function returning one")
  }
  const target = render as JSXNode
  const merged: Record<string, unknown> = { ...own }
  for (const [key, value] of Object.entries(target.props)) {
    if (key === "class" || key === "className") {
      merged.class = [value, own.class].filter(Boolean).join(" ")
    } else if (key === "style" && isObject(value) && isObject(own.style)) {
      merged.style = { ...own.style, ...value }
    } else {
      merged[key] = value
    }
  }
  if (typeof target.tag === "string" && !["button", "input"].includes(target.tag)) {
    if (!("type" in target.props)) delete merged.type
  }
  const { children, ...props } = merged
  return cloneElement(
    target,
    props,
    ...(children === undefined ? [] : [children as Child].flat())
  ) as Element
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}`

/** Value and type imports from \`hono/jsx\` the helper needs. */
export const RENDER_HELPER_VALUES = ["cloneElement", "isValidElement"] as const
export const RENDER_HELPER_TYPES = ["Child", "JSXNode"] as const
