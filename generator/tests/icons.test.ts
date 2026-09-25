import { describe, expect, test } from "bun:test"
import {
  resolveLucideIcon,
  toKebabCase,
  toPascalCase,
} from "../src/icons/lucide"
import { renderIconComponent } from "../src/transformers/steps/icons"

describe("lucide", () => {
  test.each([
    ["MoreHorizontal", "more-horizontal"],
    ["Loader2", "loader-2"],
    ["ChevronRight", "chevron-right"],
  ])("toKebabCase(%s) = %s", (pascal, kebab) => {
    expect(toKebabCase(pascal)).toBe(kebab)
  })

  test("toPascalCase inverts canonical file names", () => {
    expect(toPascalCase("loader-circle")).toBe("LoaderCircle")
  })

  test("resolves canonical names and aliases like lucide-react", () => {
    expect(resolveLucideIcon("MoreHorizontalIcon")).toMatchObject({
      name: "ellipsis",
      aliases: ["more-horizontal"],
    })
    expect(resolveLucideIcon("Loader2Icon")).toMatchObject({
      name: "loader-circle",
      aliases: ["loader-2"],
    })
    expect(resolveLucideIcon("XIcon")?.node).toEqual([
      ["path", { d: "M18 6 6 18" }],
      ["path", { d: "m6 6 12 12" }],
    ])
    expect(resolveLucideIcon("NoSuchIcon")).toBeNull()
  })
})

describe("renderIconComponent", () => {
  test("renders lucide-react's attributes, classes and aria-hidden rule", () => {
    const icon = resolveLucideIcon("MoreHorizontalIcon")
    if (!icon) throw new Error("missing icon")
    const text = renderIconComponent("MoreHorizontalIcon", icon)
    expect(text).toContain(
      'class={cn("lucide lucide-ellipsis lucide-more-horizontal", className)}'
    )
    expect(text).toContain(
      'aria-hidden={children || hasA11yProp(props) ? undefined : "true"}'
    )
    expect(text).toContain('<circle cx="12" cy="12" r="1" />')
    expect(text.indexOf('xmlns="http://www.w3.org/2000/svg"')).toBeLessThan(
      text.indexOf("{...props}")
    )
  })
})
