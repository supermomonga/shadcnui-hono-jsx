/**
 * Base UI's ScrollArea: the viewport scrolls natively and keeps the browser's
 * scrollbar without JavaScript. The client script
 * \`public/shadcn/scroll-area.js\` (docs/adr/0025) hides the native scrollbar,
 * shows the custom scrollbars that have overflow, sizes and moves their
 * thumbs, and adds track clicks and thumb dragging, like Base UI.
 */
import type { FamilyRule } from "./types"
import {
  forEachPart,
  helperEntries,
  registerHelpers,
  replacePartTypes,
} from "./util"

const HELPERS = `/**
 * The viewport scrolls natively (with the browser's scrollbar) until the
 * client script \`/shadcn/scroll-area.js\` hides it and shows the custom
 * scrollbars, like Base UI.
 */
function ScrollAreaRootElement({ style, ...props }: ComponentProps<"div">) {
  return (
    <div
      role="presentation"
      data-scroll-area=""
      style={withScrollAreaStyle(style, {
        position: "relative",
        "--scroll-area-corner-height": "0px",
        "--scroll-area-corner-width": "0px",
      })}
      {...props}
    />
  )
}

function ScrollAreaViewportElement({ style, ...props }: ComponentProps<"div">) {
  return (
    <div
      role="presentation"
      data-scroll-area-viewport=""
      style={withScrollAreaStyle(style, { overflow: "auto" })}
      {...props}
    />
  )
}

function ScrollAreaContentElement(props: ComponentProps<"div">) {
  return <div role="presentation" {...props} />
}

type ScrollAreaScrollbarProps = ComponentProps<"div"> & {
  orientation?: "vertical" | "horizontal" | undefined
}

/** Hidden until the script finds overflow in its orientation. */
function ScrollAreaScrollbarElement({ orientation = "vertical", style, ...props }: ScrollAreaScrollbarProps) {
  const vertical = orientation === "vertical"
  return (
    <div
      hidden
      aria-hidden="true"
      data-orientation={orientation}
      data-scroll-area-scrollbar=""
      style={withScrollAreaStyle(style, {
        position: "absolute",
        "touch-action": "none",
        "user-select": "none",
        ...(vertical
          ? { top: "0", bottom: "var(--scroll-area-corner-height)", "inset-inline-end": "0" }
          : { "inset-inline-start": "0", "inset-inline-end": "var(--scroll-area-corner-width)", bottom: "0" }),
      })}
      {...props}
    />
  )
}

function ScrollAreaThumbElement({ style, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-scroll-area-thumb=""
      style={withScrollAreaStyle(style, {
        width: "var(--scroll-area-thumb-width)",
        height: "var(--scroll-area-thumb-height)",
      })}
      {...props}
    />
  )
}

function ScrollAreaCornerElement({ style, ...props }: ComponentProps<"div">) {
  return (
    <div
      hidden
      data-scroll-area-corner=""
      style={withScrollAreaStyle(style, {
        position: "absolute",
        bottom: "0",
        "inset-inline-end": "0",
        width: "var(--scroll-area-corner-width)",
        height: "var(--scroll-area-corner-height)",
      })}
      {...props}
    />
  )
}

/** Adds \`extra\` declarations to a string or object \`style\` prop (the prop wins). */
function withScrollAreaStyle(
  style: string | JSX.CSSProperties | undefined,
  extra: Record<string, string>
): string | JSX.CSSProperties {
  if (typeof style === "string") {
    const css = Object.entries(extra).map(([key, value]) => \`\${key}:\${value}\`)
    return [...css, style].join(";")
  }
  return { ...extra, ...style }
}`

const HELPER_ENTRIES = helperEntries(HELPERS)

const PART_TYPES: Readonly<Record<string, string>> = {
  Root: 'ComponentProps<"div">',
  Viewport: 'ComponentProps<"div">',
  Content: 'ComponentProps<"div">',
  Scrollbar: "ScrollAreaScrollbarProps",
  Thumb: 'ComponentProps<"div">',
  Corner: 'ComponentProps<"div">',
}

export const scrollAreaFamily: FamilyRule = {
  module: "@base-ui/react/scroll-area",
  exportName: "ScrollArea",
  kind: "script",
  behaviors: ["scroll-area"],
  domParity: "native-structure",
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/scroll-area",
  notes: [
    'The custom scrollbars need the client script `/shadcn/scroll-area.js` (`<script type="module" src="/shadcn/scroll-area.js">`); without it the area scrolls with the browser\'s own scrollbar.',
    "`overflowEdgeThreshold` is not supported.",
  ],
  transform(ctx, local) {
    const step = "family:ScrollArea"
    replacePartTypes(ctx, step, local, PART_TYPES)
    forEachPart(ctx, local, (element) => {
      if (!(element.part in PART_TYPES)) {
        throw new Error(
          `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
        )
      }
      const tag = `ScrollArea${element.part}Element`
      const attrs = element.attributes().join(" ")
      element.replace(
        element.children
          ? `<${tag} ${attrs}>${element.children}</${tag}>`
          : `<${tag} ${attrs} />`
      )
    })
    registerHelpers(ctx, HELPER_ENTRIES)
    ctx.needsComponentProps = true
    ctx.log.push(`${step}: ${local} with native scrolling`)
  },
}
