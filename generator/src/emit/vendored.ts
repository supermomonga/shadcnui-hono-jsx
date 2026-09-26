import { vendoredNoticeLines } from "../licenses"
import type { PresetLock, VendoredLock } from "../upstream/lock"

const REGENERATE =
  "Vendored by shadcnui-hono-jsx. DO NOT EDIT; run `bun run upstream:sync` and `bun run generate`."

function blockComment(lines: string[]): string {
  return [
    "/*",
    ...lines.map((line) => (line ? ` * ${line}` : " *")),
    " */",
  ].join("\n")
}

/** The vendored `shadcn/tailwind.css` with a provenance header. */
export function buildVendoredTailwindCss(
  text: string,
  source: Pick<VendoredLock, "package" | "version" | "file" | "sha256">
): string {
  return `${blockComment([
    REGENERATE,
    `upstream: ${source.package}@${source.version}/${source.file} (sha256:${source.sha256})`,
    ...vendoredNoticeLines(),
  ])}\n\n${text}`
}

/** The vendored `shadcn/preset` module or its types, with a provenance header. */
export function buildVendoredPreset(
  text: string,
  source: PresetLock,
  file: "index.js" | "index.d.ts"
): string {
  return `${blockComment([
    REGENERATE,
    `upstream: ${source.package}@${source.version}/dist/preset/${file} (sha256 of the vendored preset data: ${source.sha256})`,
    ...vendoredNoticeLines(),
  ])}\n${text.endsWith("\n") ? text : `${text}\n`}`
}
