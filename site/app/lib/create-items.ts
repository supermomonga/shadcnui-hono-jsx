import type { FC } from "hono/jsx"
import type { Option } from "./create-options"
import { manifest } from "./examples"

const modules = import.meta.glob<Record<string, unknown>>(
  "/generated/create/*.tsx",
  { eager: true }
)

/** The example's default export, or its first exported component. */
const components = new Map(
  Object.entries(modules).flatMap(([file, mod]) => {
    const component = (mod.default ??
      Object.values(mod).find((value) => typeof value === "function")) as
      | FC
      | undefined
    const name = file.replace(/^.*\//, "").replace(/\.tsx$/, "")
    return component && name !== "example" ? [[name, component] as const] : []
  })
)

/** The registry examples the create page previews (site/generated/create/). */
export const CREATE_ITEMS: Option[] = manifest.create
  .filter((item) => components.has(item.name))
  .map((item) => ({
    value: item.name,
    label: item.title.replace(/ Example$/, ""),
  }))
  .sort((a, b) => a.label.localeCompare(b.label))

export const DEFAULT_ITEM = CREATE_ITEMS.some((i) => i.value === "demo")
  ? "demo"
  : "component-example"

export function createItem(name: string): FC | undefined {
  return components.get(name)
}
