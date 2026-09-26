import type { FC } from "hono/jsx"
import manifestJson from "../../generated/manifest.json"

export interface ExampleEntry {
  component: string
  skipped?: string
}

export const manifest = manifestJson as {
  commit: string
  examples: Record<string, ExampleEntry>
}

const modules = import.meta.glob<Record<string, unknown>>(
  "/generated/examples/*.tsx",
  { eager: true }
)
const sources = import.meta.glob<string>("/generated/examples/*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
})

const nameOf = (file: string) => file.replace(/^.*\//, "").replace(/\.tsx$/, "")

const components = new Map<string, FC>(
  Object.entries(modules).flatMap(([file, mod]) => {
    const component =
      (mod.default as FC | undefined) ??
      (Object.values(mod).find((value) => typeof value === "function") as
        | FC
        | undefined)
    return component ? [[nameOf(file), component]] : []
  })
)

const code = new Map(
  Object.entries(sources).map(([file, source]) => [
    nameOf(file),
    displayCode(source),
  ])
)

/**
 * The example as users write it: without the generated header, and importing
 * components from `@/components/ui` whichever install the site renders it with.
 */
function displayCode(source: string): string {
  return source
    .replace(/^(\/\/.*\n)+\n?/, "")
    .replace(/from "@\/ui\/[a-z-]+\//g, 'from "@/components/ui/')
    .trimEnd()
}

export function exampleComponent(name: string): FC | undefined {
  return components.get(name)
}

export function exampleCode(name: string): string | undefined {
  return code.get(name)
}

/** The upstream source of an example, for examples the site has no version of. */
export function upstreamExampleUrl(name: string): string {
  return `https://github.com/shadcn-ui/ui/blob/main/apps/v4/examples/base/${name}.tsx`
}
