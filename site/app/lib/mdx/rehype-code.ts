import type { Element, ElementContent, Root, RootContent } from "hast"
import { visit } from "unist-util-visit"
import { commandVariants, PACKAGE_MANAGERS } from "../commands.ts"
import { highlight } from "../highlight.ts"

function text(node: ElementContent): string {
  if (node.type === "text") return node.value
  if (node.type === "element") return node.children.map(text).join("")
  return ""
}

function attribute(name: string, value: string) {
  return { type: "mdxJsxAttribute", name, value }
}

/**
 * Replaces fenced code blocks with `<CodeBlock>` (highlighted with Shiki at
 * build time) and npm commands with `<CodeBlockCommand>`, whose tabs show the
 * command for every package manager.
 */
export function rehypeCode() {
  return async (tree: Root) => {
    const blocks: { parent: Root | Element; index: number; pre: Element }[] = []
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "pre" || index === undefined || !parent) return
      blocks.push({ parent: parent as Root | Element, index, pre: node })
    })
    for (const { parent, index, pre } of blocks) {
      const code = pre.children.find(
        (child): child is Element =>
          child.type === "element" && child.tagName === "code"
      )
      if (!code) continue
      const classes = (code.properties.className as string[] | undefined) ?? []
      const language =
        classes
          .find((name) => name.startsWith("language-"))
          ?.slice("language-".length) ?? "text"
      const meta = (code.data as { meta?: string } | undefined)?.meta ?? ""
      const title = meta.match(/title="([^"]+)"/)?.[1]
      const raw = code.children.map(text).join("").replace(/\n$/, "")
      let replacement: RootContent
      const lines = raw.split("\n").filter((line) => line.trim() !== "")
      const variants = lines.map(commandVariants)
      if (
        ["bash", "sh", "shell"].includes(language) &&
        !title &&
        lines.length > 0 &&
        variants.every((variant) => variant !== null)
      ) {
        replacement = {
          type: "mdxJsxFlowElement",
          name: "CodeBlockCommand",
          attributes: PACKAGE_MANAGERS.map((pm) =>
            attribute(pm, variants.map((variant) => variant?.[pm]).join("\n"))
          ),
          children: [],
        } as never
      } else {
        replacement = {
          type: "mdxJsxFlowElement",
          name: "CodeBlock",
          attributes: [
            attribute("html", await highlight(raw, language)),
            attribute("raw", raw),
            attribute("language", language),
            ...(title ? [attribute("title", title)] : []),
          ],
          children: [],
        } as never
      }
      parent.children[index] = replacement as never
    }
  }
}
