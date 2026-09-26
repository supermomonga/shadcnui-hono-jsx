import type { FC } from "hono/jsx"
import { components } from "./catalog"
import type { TocItem } from "./mdx/remark-toc"

export interface DocModule {
  default: FC<{ components?: Record<string, unknown> }>
  frontmatter: { title: string; description?: string }
  toc: TocItem[]
}

const modules = import.meta.glob<DocModule>(
  ["/content/docs/**/*.mdx", "!/content/docs/components/*.mdx"],
  { eager: true }
)

/** Hand-written pages by URL path, e.g. `/docs/installation/honox`. */
export const docPages = new Map<string, DocModule>(
  Object.entries(modules).map(([file, mod]) => [
    `/docs/${file.replace(/^\/content\/docs\//, "").replace(/\.mdx$/, "")}`
      .replace(/\/index$/, "")
      .replace(/^\/docs\/$/, "/docs"),
    mod,
  ])
)

const generatedComponentPages = import.meta.glob<DocModule>(
  "/generated/docs/*.mdx",
  { eager: true }
)
const writtenComponentPages = import.meta.glob<DocModule>(
  "/content/docs/components/*.mdx",
  { eager: true }
)

const byName = (pages: Record<string, DocModule>) =>
  Object.entries(pages).map(
    ([file, mod]) =>
      [file.replace(/^.*\//, "").replace(/\.mdx$/, ""), mod] as const
  )

/**
 * Component pages by name: translated from shadcn/ui's docs
 * (site/generated/docs/, `bun run site:generate`), or hand-written in
 * site/content/docs/components/, which take precedence.
 */
export const componentPages = new Map<string, DocModule>([
  ...byName(generatedComponentPages),
  ...byName(writtenComponentPages),
])

export interface NavItem {
  title: string
  href: string
  /** Shown as a badge in the sidebar. */
  badge?: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

function page(href: string): NavItem {
  const doc = docPages.get(href)
  if (!doc) throw new Error(`No page for ${href} in site/content/docs`)
  return { title: doc.frontmatter.title, href }
}

export const docsNav: NavGroup[] = [
  {
    title: "Sections",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Components", href: "/docs/components" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Theming", href: "/docs/theming" },
      { title: "CLI", href: "/docs/cli" },
      { title: "Changelog", href: "/docs/changelog" },
    ],
  },
  {
    title: "Get Started",
    items: [
      page("/docs/installation"),
      page("/docs/theming"),
      page("/docs/dark-mode"),
      page("/docs/cli"),
      page("/docs/client-scripts"),
      page("/docs/rtl"),
      page("/docs/icons"),
      page("/docs/differences"),
      page("/docs/compatibility"),
    ],
  },
  {
    title: "Components",
    items: components.map((entry) => ({
      title: entry.title,
      href: `/docs/components/${entry.name}`,
      badge: entry.unreleased ? "Unreleased" : undefined,
    })),
  },
]

/** Every page in reading order, for the previous and next links. */
const readingOrder: NavItem[] = [
  { title: "Introduction", href: "/docs" },
  ...[...docPages.keys()]
    .filter((href) => href.startsWith("/docs/installation/"))
    .sort()
    .map(page),
  ...docsNav[1].items,
  { title: "Components", href: "/docs/components" },
  ...docsNav[2].items,
  { title: "Changelog", href: "/docs/changelog" },
].filter(
  (item, index, all) => all.findIndex((i) => i.href === item.href) === index
)

export function neighbours(href: string): {
  previous?: NavItem
  next?: NavItem
} {
  const index = readingOrder.findIndex((item) => item.href === href)
  if (index === -1) return {}
  return { previous: readingOrder[index - 1], next: readingOrder[index + 1] }
}

export function isActive(href: string, pathname: string): boolean {
  return href === "/docs" ? pathname === href : pathname.startsWith(href)
}
