import { raw } from "hono/html"
import {
  type ComponentEntry,
  components,
  findComponent,
  titleOf,
} from "@/lib/catalog"
import { inlineMarkdown } from "@/lib/inline-markdown"

/** The upstream component a lite alternative is based on. */
const baseOf = (entry: ComponentEntry) =>
  entry.kind === "lite" ? entry.compatibility?.basedOn?.[0]?.name : undefined

/**
 * The known differences of a component from shadcn/ui, and where upstream
 * documents it. A port and the lite alternatives beside it (docs/adr/0036)
 * link to each other.
 */
export function ComponentNotes({ name }: { name: string }) {
  const entry = findComponent(name)
  const notes = entry?.compatibility?.knownDifferences ?? []
  const base = entry && baseOf(entry)
  const upstream = base ?? name
  const port = base ? findComponent(base) : undefined
  const lites = components.filter((other) => baseOf(other) === name)
  return (
    <ul>
      {notes.map((note) => (
        <li>{raw(inlineMarkdown(note))}</li>
      ))}
      {port?.kind === "port" && (
        <li>
          The port: <a href={`/docs/components/${port.name}`}>{port.title}</a>.
        </li>
      )}
      {lites.map((lite) => (
        <li>
          Lite alternative:{" "}
          <a href={`/docs/components/${lite.name}`}>{lite.title}</a>.
        </li>
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
