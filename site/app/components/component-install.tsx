import { type ComponentEntry, release } from "@/lib/catalog"
import { commandVariants, type PackageManager } from "@/lib/commands"
import { highlight } from "@/lib/highlight"
import { CLI } from "@/lib/site"
import { Callout } from "./callout"
import { CodeBlock, CodeBlockCommand } from "./code-block"

/** The `add` command of an item and the client scripts it needs. */
export async function ComponentInstall({ entry }: { entry: ComponentEntry }) {
  const commands = commandVariants(`npx ${CLI} add ${entry.name}`) as Record<
    PackageManager,
    string
  >
  const scripts = entry.scripts.map(
    (script) => `<script type="module" src="/shadcn/${script}.js"></script>`
  )
  return (
    <>
      <CodeBlockCommand {...commands} />
      {entry.unreleased && (
        <Callout variant="warning" title="Not released yet">
          This component is on the main branch but not in the latest release of
          the CLI{release ? ` (${release.version})` : ""}. It will be
          installable with the next release.
        </Callout>
      )}
      {scripts.length > 0 && (
        <>
          <p>
            This component uses a small client script. <code>add</code> installs
            it into <code>public/shadcn/</code>; serve that directory at{" "}
            <code>/shadcn/</code> and load the script on pages that use the
            component (see <a href="/docs/client-scripts">Client Scripts</a>):
          </p>
          <CodeBlock
            html={await highlight(scripts.join("\n"), "html")}
            raw={scripts.join("\n")}
            language="html"
          />
        </>
      )}
    </>
  )
}
