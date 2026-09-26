/**
 * Turns a shadcn/ui docs page (`upstream/site/docs/<name>.mdx`) into the
 * site's page for the same component: this project's install command instead
 * of `npx shadcn add` and manual steps, `class` instead of `className` in
 * snippets, icons from `@/components/icons`, links to the site's pages where
 * it has them, and a Notes section with the known differences. Examples keep
 * their names; the site renders the translated ones.
 */

import type { IconUse } from "./icons-module"

export interface DocsContext {
  /** Components the site has pages for. */
  components: ReadonlySet<string>
  /** Hand-written docs pages of the site (`/docs/<slug>`). */
  pages: ReadonlySet<string>
}

const UPSTREAM = "https://ui.shadcn.com"

interface Section {
  heading: string | null
  lines: string[]
}

/** Lines of `body`, split into `## ` sections outside code fences. */
function sections(body: string): Section[] {
  const result: Section[] = [{ heading: null, lines: [] }]
  let fence = false
  for (const line of body.split("\n")) {
    if (/^\s*```/.test(line)) fence = !fence
    if (!fence && line.startsWith("## ")) {
      result.push({ heading: line.slice(3).trim(), lines: [] })
    } else {
      result.at(-1)?.lines.push(line)
    }
  }
  return result
}

/** The snippet of a code block as Hono JSX users write it. */
export function translateSnippet(code: string): string {
  return code
    .replace(/\bclassName=/g, "class=")
    .replace(/\bhtmlFor=/g, "for=")
    .replace(/from "lucide-react"/g, 'from "@/components/icons"')
    .replace(/from "@tabler\/icons-react"/g, 'from "@/components/icons"')
    .replace(/^"use client"\n\n?/m, "")
}

function translateCommand(code: string): string {
  return code.replace(
    /npx shadcn@latest add/g,
    "npx shadcnui-hono-jsx@latest add"
  )
}

function rewriteLink(url: string, context: DocsContext): string {
  const component = url.match(
    /^\/docs\/components\/(?:base\/|radix\/)?([a-z0-9-]+)(#.*)?$/
  )
  if (component?.[1]) {
    return context.components.has(component[1])
      ? `/docs/components/${component[1]}${component[2] ?? ""}`
      : `${UPSTREAM}/docs/components/base/${component[1]}${component[2] ?? ""}`
  }
  const page = url.match(/^\/docs\/([a-z0-9-]+)(?:\/[a-z0-9-]+)?(#.*)?$/)
  if (page?.[1] && context.pages.has(page[1])) {
    return `/docs/${page[1]}${page[2] ?? ""}`
  }
  return url.startsWith("/") ? `${UPSTREAM}${url}` : url
}

const ICON_MODULES: Record<string, IconUse["source"]> = {
  "lucide-react": "lucide",
  "@tabler/icons-react": "tabler",
}

/** Prose and MDX elements: links, `className`, preview props and icon imports. */
function translateProse(
  text: string,
  context: DocsContext,
  icons: IconUse[]
): string {
  return (
    text
      .replace(
        /^import \{([^}]+)\} from "(lucide-react|@tabler\/icons-react)"$/gm,
        (_, names: string, module: string) => {
          for (const name of names.split(",").map((n) => n.trim())) {
            if (name)
              icons.push({ name, source: ICON_MODULES[module] ?? "lucide" })
          }
          return `import {${names}} from "@/components/icons"`
        }
      )
      .replace(
        /\]\((\/[^)\s]*)\)/g,
        (_, url: string) => `](${rewriteLink(url, context)})`
      )
      .replace(/(<[A-Z][A-Za-z]*\b[^>]*?)\sclassName=/g, "$1 class=")
      .replace(/(<ComponentPreview\b[^>]*?)\s+styleName="[^"]*"/g, "$1")
      .replace(
        /(\s)href="(\/[^"]*)"/g,
        (_, space: string, url: string) =>
          `${space}href="${rewriteLink(url, context)}"`
      )
      // `asChild` becomes Base UI's `render`, which the components support.
      .replace(
        /<Button asChild([^>]*)>\s*<a ([^>]*)>([\s\S]*?)<\/a>\s*<\/Button>/g,
        (_, props: string, link: string, content: string) =>
          `<Button${props} render={<a ${link} />}>${content}</Button>`
      )
      .replace(/React\.ReactElement/g, "JSX element")
      .replace(/React\.ReactNode/g, "Child")
  )
}

/** Code fences and prose of a section's lines, translated. */
function translateLines(
  lines: string[],
  context: DocsContext,
  icons: IconUse[]
): string {
  const out: string[] = []
  let fence: { language: string; lines: string[]; open: string } | null = null
  let prose: string[] = []
  const flushProse = () => {
    if (prose.length > 0) {
      out.push(translateProse(prose.join("\n"), context, icons))
    }
    prose = []
  }
  for (const line of lines) {
    const marker = line.match(/^(\s*)```(\S*)/)
    if (marker && !fence) {
      flushProse()
      fence = { language: marker[2] ?? "", lines: [], open: line }
      continue
    }
    if (marker && fence) {
      const code = fence.lines.join("\n")
      const translated = ["tsx", "jsx", "ts", "js"].includes(fence.language)
        ? translateSnippet(code)
        : ["bash", "sh", "shell"].includes(fence.language)
          ? translateCommand(code)
          : code
      out.push(fence.open, translated, line)
      fence = null
      continue
    }
    if (fence) fence.lines.push(line)
    else prose.push(line)
  }
  flushProse()
  return out.join("\n")
}

/** Frontmatter fields the site uses, from upstream's YAML. */
function frontmatter(yaml: string, name: string): string {
  const lines = yaml.split("\n")
  const value = (key: string) =>
    lines
      .find((line) => line.startsWith(`${key}:`))
      ?.slice(key.length + 1)
      .trim()
  const api = lines
    .find((line) => /^\s+api:/.test(line))
    ?.replace(/^\s+api:/, "")
    .trim()
  return [
    "---",
    `title: ${value("title")}`,
    `description: ${value("description")}`,
    `upstream: ${UPSTREAM}/docs/components/base/${name}`,
    ...(api ? [`api: ${api}`] : []),
    "---",
  ].join("\n")
}

export function transformDocs(
  name: string,
  mdx: string,
  context: DocsContext
): { text: string; icons: IconUse[] } {
  const icons: IconUse[] = []
  const match = mdx.match(/^---\n([\s\S]*?)\n---\n/)
  if (!match?.[1]) throw new Error(`${name}.mdx has no frontmatter`)
  const out: string[] = [frontmatter(match[1], name), ""]
  let notes = false
  for (const section of sections(mdx.slice(match[0].length))) {
    if (section.heading === "Changelog") continue
    if (section.heading === "Installation") {
      out.push("## Installation", "", `<ComponentInstall name="${name}" />`, "")
      continue
    }
    if (section.heading === "API Reference" && !notes) {
      out.push("## Notes", "", `<ComponentNotes name="${name}" />`, "")
      notes = true
    }
    if (section.heading) out.push(`## ${section.heading}`)
    out.push(translateLines(section.lines, context, icons))
  }
  if (!notes) out.push("## Notes", "", `<ComponentNotes name="${name}" />`, "")
  const text = `${out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()}\n`
  return { text, icons }
}
