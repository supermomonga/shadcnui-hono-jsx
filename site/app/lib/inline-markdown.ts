const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ESCAPES[c] ?? c)
}

/**
 * Renders the inline Markdown of compatibility.json (code spans, links,
 * emphasis) as HTML. Links to the repository's docs/ point to GitHub.
 */
export function inlineMarkdown(text: string): string {
  const parts = text.split(/(`[^`]+`)/)
  return parts
    .map((part) => {
      if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
        return `<code>${escapeHtml(part.slice(1, -1))}</code>`
      }
      return escapeHtml(part)
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          (_, label: string, url: string) => {
            const href = url.startsWith("http")
              ? url
              : `https://github.com/supermomonga/shadcnui-hono-jsx/blob/main/${url.replace(/^(\.\.\/|\.\/)+/, "")}`
            return `<a href="${href}">${label}</a>`
          }
        )
    })
    .join("")
}
