import { raw } from "hono/html"
import { findComponent, titleOf } from "@/lib/catalog"
import { inlineMarkdown } from "@/lib/inline-markdown"

/** The known differences of a component from shadcn/ui, and where upstream documents it. */
export function ComponentNotes({ name }: { name: string }) {
  const entry = findComponent(name)
  const notes = entry?.compatibility?.knownDifferences ?? []
  const upstream =
    entry?.kind === "lite"
      ? (entry.compatibility?.basedOn?.[0]?.name ?? name)
      : name
  return (
    <ul>
      {notes.map((note) => (
        <li>{raw(inlineMarkdown(note))}</li>
      ))}
      <li>
        Upstream documentation:{" "}
        <a href={`https://ui.shadcn.com/docs/components/base/${upstream}`}>
          shadcn/ui {titleOf(upstream)}
        </a>
        . See also <a href="/docs/differences">Differences from shadcn/ui</a>.
      </li>
    </ul>
  )
}
