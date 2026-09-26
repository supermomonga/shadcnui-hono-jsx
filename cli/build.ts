/**
 * Bundles the CLI for Node into dist/bin.js, the package's executable, so that
 * `npx shadcnui-hono-jsx` works without Bun. Run by `prepack`.
 */
import { rmSync } from "node:fs"
import path from "node:path"

const DIR = import.meta.dir
rmSync(path.join(DIR, "dist"), { recursive: true, force: true })
const result = await Bun.build({
  entrypoints: [path.join(DIR, "src", "bin.ts")],
  outdir: path.join(DIR, "dist"),
  target: "node",
})
if (!result.success) {
  throw new AggregateError(result.logs, "building the CLI failed")
}
