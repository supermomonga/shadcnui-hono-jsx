/**
 * Icons of the libraries a preset can choose besides Lucide (docs/adr/0031),
 * read from the pinned React-free data packages at generation time. Each
 * renders a file-local Hono JSX component (`__COMPONENT__` stands for its
 * name) that produces what the library's React package renders, as the
 * shadcn CLI uses it (`icons/libraries.ts`: Hugeicons and Phosphor get
 * `strokeWidth={2}`).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import type { IconLibrary } from "../../../cli/src/icons"
import { LICENSE_NOTICE_PATH } from "../licenses"
import { ROOT } from "../paths"
import { toPascalCase } from "./lucide"

export type IconNode = [tag: string, attributes: Record<string, unknown>][]

export interface ResolvedIcon {
  /** The name in headers (`chevron-down`). */
  name: string
  node: IconNode
  /** Tabler's filled icons use other SVG attributes. */
  filled?: boolean
}

export interface InlinedLibrary {
  library: Exclude<IconLibrary, "lucide">
  package: string
  resolve(name: string): ResolvedIcon | null
  render(icon: ResolvedIcon): string
}

const modules = path.join(ROOT, "node_modules")
const require = createRequire(import.meta.url)

const kebab = (name: string) =>
  name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

/** `[tag, attributes]` nodes as Hono JSX, attribute names in DOM form. */
function renderNode(node: IconNode): string {
  return node
    .map(([tag, attributes]) => {
      const attrs = Object.entries(attributes)
        .filter(([name, value]) => name !== "key" && value !== undefined)
        .map(
          ([name, value]) => `${kebab(name)}=${JSON.stringify(String(value))}`
        )
      return `<${tag} ${attrs.join(" ")} />`
    })
    .join("\n")
}

/** Parses the elements inside an `<svg>` file into nodes. */
function svgNodes(svg: string): IconNode {
  const inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
  return [...inner.matchAll(/<([a-z]+)((?:\s+[a-z-]+="[^"]*")*)\s*\/>/g)].map(
    ([, tag = "", attrs = ""]) => [
      tag,
      Object.fromEntries(
        [...attrs.matchAll(/([a-z-]+)="([^"]*)"/g)].map(([, n = "", v]) => [
          n,
          v,
        ])
      ),
    ]
  )
}

function comment(title: string, name: string, license: string): string {
  return `/** ${title} \`${name}\` icon, inlined (${license}, see ${LICENSE_NOTICE_PATH}). */`
}

/** `@tabler/icons-react`: Lucide's attributes (filled icons fill), its classes, no aria-hidden. */
const tabler: InlinedLibrary = (() => {
  let index: Map<string, ResolvedIcon> | undefined
  const load = () => {
    if (index) return index
    index = new Map()
    for (const [file, filled] of [
      ["tabler-nodes-outline.json", false],
      ["tabler-nodes-filled.json", true],
    ] as const) {
      const nodes = JSON.parse(
        readFileSync(path.join(modules, "@tabler/icons", file), "utf8")
      ) as Record<string, IconNode>
      for (const [name, node] of Object.entries(nodes)) {
        index.set(`Icon${toPascalCase(name)}${filled ? "Filled" : ""}`, {
          name,
          node,
          filled,
        })
      }
    }
    return index
  }
  return {
    library: "tabler",
    package: "@tabler/icons",
    resolve: (name) => load().get(name) ?? null,
    render(icon) {
      const attributes = icon.filled
        ? 'xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"'
        : 'xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
      return `${comment("Tabler", icon.name, "MIT License")}
function __COMPONENT__({ class: className, children, ...props }: ComponentProps<"svg">) {
  return (
    <svg ${attributes} class={cn(${JSON.stringify(`tabler-icon tabler-icon-${icon.name}`)}, className)} {...props}>
      ${renderNode(icon.node)}
      {children}
    </svg>
  )
}`
    },
  }
})()

/**
 * `<HugeiconsIcon icon={…} strokeWidth={2} />`: every element's stroke width
 * becomes 2 (appended with the stroke color where the data has none), no
 * children, and the class is `className` alone.
 */
const hugeicons: InlinedLibrary = {
  library: "hugeicons",
  package: "@hugeicons/core-free-icons",
  resolve(name) {
    const icons = require("@hugeicons/core-free-icons") as Record<
      string,
      IconNode
    >
    const node = icons[name]
    return node ? { name, node } : null
  },
  render(icon) {
    const node: IconNode = [...icon.node]
      .sort(([, a], [, b]) =>
        b.opacity !== undefined ? 1 : a.opacity !== undefined ? -1 : 0
      )
      .map(([tag, attributes]) => [
        tag,
        { ...attributes, strokeWidth: "2", stroke: "currentColor" },
      ])
    return `${comment("Hugeicons", icon.name, "MIT License")}
function __COMPONENT__({ class: className = "", children, ...props }: ComponentProps<"svg">) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" color="currentColor" class={className} stroke-width="2" stroke="currentColor" {...props}>
      ${renderNode(node)}
    </svg>
  )
}`
  },
}

/** `<Icon strokeWidth={2} />` of `@phosphor-icons/react`: the regular weight, 1em, children first. */
const phosphor: InlinedLibrary = {
  library: "phosphor",
  package: "@phosphor-icons/core",
  resolve(name) {
    const file = name.replace(/Icon$/, "")
    const kebabName = kebab(file).replace(/^-/, "")
    const svg = path.join(
      modules,
      "@phosphor-icons/core/assets/regular",
      `${kebabName}.svg`
    )
    if (!name.endsWith("Icon") || !existsSync(svg)) return null
    return { name: kebabName, node: svgNodes(readFileSync(svg, "utf8")) }
  },
  render(icon) {
    return `${comment("Phosphor", icon.name, "MIT License")}
function __COMPONENT__({ children, ...props }: ComponentProps<"svg">) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" stroke-width="2" {...props}>
      {children}
      ${renderNode(icon.node)}
    </svg>
  )
}`
  },
}

/** `@remixicon/react`: 24px, filled, `remixicon` plus the class last, no children. */
const remixicon: InlinedLibrary = (() => {
  let index: Map<string, string> | undefined
  const load = () => {
    if (index) return index
    index = new Map()
    const dir = path.join(modules, "remixicon/icons")
    for (const category of readdirSync(dir)) {
      for (const file of readdirSync(path.join(dir, category))) {
        if (!file.endsWith(".svg")) continue
        const name = file.slice(0, -".svg".length)
        index.set(`Ri${toPascalCase(name)}`, path.join(dir, category, file))
      }
    }
    return index
  }
  return {
    library: "remixicon",
    package: "remixicon",
    resolve(name) {
      const file = load().get(name)
      if (!file) return null
      return {
        name: path.basename(file, ".svg"),
        node: svgNodes(readFileSync(file, "utf8")),
      }
    },
    render(icon) {
      return `${comment("Remix Icon", icon.name, "Remix Icon License v1.0")}
function __COMPONENT__({ class: className, children, ...props }: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" {...props} class={\`remixicon \${className ?? ""}\`}>
      ${renderNode(icon.node)}
    </svg>
  )
}`
    },
  }
})()

export const INLINED_LIBRARIES: readonly InlinedLibrary[] = [
  tabler,
  hugeicons,
  phosphor,
  remixicon,
]

/** Version of a pinned icon data package. */
export function packageVersion(name: string): string {
  return (
    JSON.parse(
      readFileSync(path.join(modules, name, "package.json"), "utf8")
    ) as { version: string }
  ).version
}
