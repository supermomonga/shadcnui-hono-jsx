import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"
import { finalize } from "../../cli/src/finalize"
import { ICON_HELPER_MARKER, ICON_LIBRARIES } from "../../cli/src/icons"
import { TEMPLATES_DIR } from "../../cli/src/paths"
import { INLINED_LIBRARIES } from "../src/icons/libraries"
import {
  resolveLucideIcon,
  toKebabCase,
  toPascalCase,
} from "../src/icons/lucide"
import { markedIcons } from "../src/icons/sets"
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

describe("inlined libraries (docs/adr/0031)", () => {
  const library = (name: string) => {
    const found = INLINED_LIBRARIES.find((l) => l.library === name)
    if (!found) throw new Error(`missing ${name}`)
    return found
  }
  const render = (name: string, icon: string) => {
    const lib = library(name)
    const resolved = lib.resolve(icon)
    if (!resolved) throw new Error(`unresolved ${icon}`)
    return lib.render(resolved)
  }

  test("resolve the names upstream's placeholders use, or null", () => {
    expect(library("tabler").resolve("IconChevronDown")?.name).toBe(
      "chevron-down"
    )
    expect(library("tabler").resolve("IconCircleCheckFilled")).toMatchObject({
      name: "circle-check",
      filled: true,
    })
    expect(library("hugeicons").resolve("UnfoldMoreIcon")?.name).toBe(
      "UnfoldMoreIcon"
    )
    expect(library("phosphor").resolve("XCircleIcon")?.name).toBe("x-circle")
    expect(library("remixicon").resolve("RiArrowDownSLine")?.name).toBe(
      "arrow-down-s-line"
    )
    for (const lib of INLINED_LIBRARIES) {
      expect(lib.resolve("NoSuchIcon")).toBeNull()
    }
  })

  test("render what each React package renders", () => {
    const tabler = render("tabler", "IconChevronDown")
    expect(tabler).toContain(
      'class={cn("tabler-icon tabler-icon-chevron-down", className)}'
    )
    expect(tabler).toContain('<path d="M6 9l6 6l6 -6" />')
    expect(tabler).not.toContain("aria-hidden")
    expect(render("tabler", "IconCircleCheckFilled")).toContain(
      'fill="currentColor" stroke="none"'
    )

    const hugeicons = render("hugeicons", "UnfoldMoreIcon")
    expect(hugeicons).toContain('class={className} stroke-width="2"')
    expect(hugeicons).toMatch(/stroke-linejoin="round" stroke-width="2"/)
    expect(hugeicons).not.toContain("{children}")

    const phosphor = render("phosphor", "CaretDownIcon")
    expect(phosphor).toContain('width="1em" height="1em"')
    expect(phosphor.indexOf("{children}")).toBeLessThan(
      phosphor.indexOf("<path")
    )

    const remixicon = render("remixicon", "RiArrowDownSLine")
    expect(remixicon).toMatch(
      /\{\.\.\.props\} class=\{`remixicon \$\{className \?\? ""\}`\}/
    )
  })
})

describe("templates", () => {
  const templates = [...new Bun.Glob("**/*.tsx").scanSync(TEMPLATES_DIR)].map(
    (file) =>
      [file, readFileSync(path.join(TEMPLATES_DIR, file), "utf8")] as const
  )

  test("mark every inlined icon and the helper", () => {
    for (const [file, text] of templates) {
      const icons = text.match(/^\/\*\* Lucide `/gm)?.length ?? 0
      expect([file, markedIcons(text).length]).toEqual([file, icons])
      expect([file, text.includes(ICON_HELPER_MARKER)]).toEqual([
        file,
        text.includes("function hasA11yProp("),
      ])
    }
  })

  test.each([...ICON_LIBRARIES])(
    "finalize with %s icons everywhere, keeping every import used",
    (iconLibrary) => {
      for (const [file, text] of templates) {
        const installed = finalize(text, { iconLibrary, preset: "b0" })
        expect([file, installed.includes("// icon")]).toEqual([file, false])
        if (/^import \{ cn \}/m.test(installed)) {
          expect([file, /\bcn\(/.test(installed)]).toEqual([file, true])
        }
      }
    }
  )
})
