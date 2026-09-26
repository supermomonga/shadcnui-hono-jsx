import { raw } from "hono/html"
import { components, titleOf, unsupported } from "@/lib/catalog"
import { inlineMarkdown } from "@/lib/inline-markdown"

/** Every installable item with its client script and known differences. */
export function CompatibilityTable() {
  return (
    <div class="typeset-scroll scroll-fade-x scrollbar-none *:[table]:w-full">
      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th>Client JS</th>
            <th>Known differences</th>
          </tr>
        </thead>
        <tbody>
          {components.map((entry) => (
            <tr>
              <td>
                <a href={`/docs/components/${entry.name}`}>{entry.title}</a>
              </td>
              <td>
                {entry.scripts.length > 0
                  ? raw(
                      entry.scripts
                        .map((script) => `<code>/shadcn/${script}.js</code>`)
                        .join(", ")
                    )
                  : "None"}
              </td>
              <td>
                {raw(
                  (entry.compatibility?.knownDifferences ?? [])
                    .map(inlineMarkdown)
                    .join("<br />") || "None"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Upstream components without a Hono JSX version yet. */
export function UnsupportedList() {
  return (
    <ul>
      {unsupported.map((name) => (
        <li>
          <a href={`https://ui.shadcn.com/docs/components/base/${name}`}>
            {titleOf(name)}
          </a>
        </li>
      ))}
    </ul>
  )
}
