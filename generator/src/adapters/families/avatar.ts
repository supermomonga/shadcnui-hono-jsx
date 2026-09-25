/**
 * Base UI's Avatar: the image is absolutely positioned over the fallback, so
 * a loaded image shows without JavaScript and the fallback shows while it
 * loads. The client script \`public/shadcn/avatar.js\` (docs/adr/0025) hides a
 * failed image and removes the fallback once the image loads, like Base UI.
 */
import type { FamilyRule } from "./types"
import {
  forEachPart,
  helperEntries,
  registerHelpers,
  replacePartTypes,
} from "./util"

const HELPERS = `/**
 * The image covers the fallback once it loads, so avatars work without
 * JavaScript; the client script \`/shadcn/avatar.js\` hides a failed image and
 * removes the fallback after a load, like Base UI.
 */
function AvatarRootElement(props: ComponentProps<"span">) {
  return <span data-avatar="" {...props} />
}

function AvatarImageElement({ style, ...props }: ComponentProps<"img">) {
  return (
    // biome-ignore lint/a11y/useAltText: \`alt\` comes from the props, like Base UI's image
    <img
      data-avatar-image=""
      style={withAvatarStyle(style, { position: "absolute", inset: "0" })}
      {...props}
    />
  )
}

function AvatarFallbackElement({
  delay,
  ...props
}: ComponentProps<"span"> & {
  /** Base UI's delay before showing the fallback; not supported on the server. */
  delay?: number | undefined
}) {
  return <span data-avatar-fallback="" {...props} />
}

/** Adds \`extra\` declarations to a string or object \`style\` prop (the prop wins). */
function withAvatarStyle(
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
  Root: 'ComponentProps<"span">',
  Image: 'ComponentProps<"img">',
  Fallback: 'ComponentProps<"span"> & { delay?: number | undefined }',
}

export const avatarFamily: FamilyRule = {
  module: "@base-ui/react/avatar",
  exportName: "Avatar",
  kind: "script",
  behaviors: ["avatar"],
  domParity: "native-structure",
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/avatar",
  notes: [
    'The image covers the fallback once it loads, so avatars work without JavaScript. Hiding an image that fails to load (the fallback shows instead) and removing the fallback after a load need the client script `/shadcn/avatar.js` (`<script type="module" src="/shadcn/avatar.js">`); without it a broken image shows its alt text over the fallback.',
    "The fallback's `delay` and `onLoadingStatusChange` are not supported.",
  ],
  transform(ctx, local) {
    const step = "family:Avatar"
    replacePartTypes(ctx, step, local, PART_TYPES)
    forEachPart(ctx, local, (element) => {
      if (!(element.part in PART_TYPES)) {
        throw new Error(
          `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
        )
      }
      const tag = `Avatar${element.part}Element`
      const attrs = element.attributes().join(" ")
      element.replace(
        element.children
          ? `<${tag} ${attrs}>${element.children}</${tag}>`
          : `<${tag} ${attrs} />`
      )
    })
    registerHelpers(ctx, HELPER_ENTRIES)
    ctx.needsComponentProps = true
    ctx.log.push(`${step}: ${local} with the image over the fallback`)
  },
}
