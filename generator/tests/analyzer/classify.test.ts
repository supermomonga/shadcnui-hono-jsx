import { describe, expect, test } from "bun:test"
import { config } from "../../../generator.config"
import { COMPONENT_ADAPTERS } from "../../src/adapters/components"
import { classify } from "../../src/analyzer/classify"
import { collectFacts } from "../../src/analyzer/facts"
import { reasonKey } from "../../src/analyzer/reasons"
import { ROOT } from "../../src/paths"
import { UpstreamStore } from "../../src/upstream/store"
import type { UpstreamItem } from "../../src/upstream/types"

function item(
  content: string,
  extra: Partial<UpstreamItem> = {}
): UpstreamItem {
  return {
    name: "fixture",
    type: "registry:ui",
    files: [{ path: "registry/ui/fixture.tsx", type: "registry:ui", content }],
    ...extra,
  }
}

function run(
  content: string,
  extra: Partial<UpstreamItem> = {},
  adapters = {}
) {
  const result = classify(collectFacts(item(content, extra)), adapters)
  return {
    kind: result.kind,
    blocking: result.reasons.filter((r) => r.blocking).map(reasonKey),
    rewrites: result.reasons.filter((r) => !r.blocking).map(reasonKey),
  }
}

const PLAIN = `
import * as React from "react"
import { cn } from "cn"
function Box({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="box" className={cn("p-2 cn-font-heading", className)} {...props} />
}
export { Box }
`

describe("classify", () => {
  test("plain HTML + cn is direct, with the mechanical rewrites recorded", () => {
    expect(run(`"use client"\n${PLAIN}`)).toEqual({
      kind: "direct",
      blocking: [],
      rewrites: [
        "classname-to-class",
        "cn-marker:cn-font-heading",
        "react-type-rewrite:React.ComponentProps",
        "use-client-directive",
      ],
    })
  })

  test("global React types without an import are rewrites", () => {
    const source = `import { cn } from "cn"
function A(props: React.ComponentProps<"div">) { return <div {...props} /> }
export { A }`
    expect(run(source).rewrites).toContain(
      "react-type-rewrite:React.ComponentProps"
    )
  })

  test("React context APIs are rewritten to hono/jsx", () => {
    const source = `import * as React from "react"
const Ctx = React.createContext(0)
function C() { const value = React.useContext(Ctx); return <div>{value}</div> }
export { C }`
    expect(run(source)).toMatchObject({
      kind: "direct",
      rewrites: expect.arrayContaining([
        "react-context:createContext",
        "react-context:useContext",
      ]),
    })
  })

  test("mapped Base UI primitives are direct", () => {
    const source = `import { Button as ButtonPrimitive } from "@base-ui/react/button"
function Button(props: ButtonPrimitive.Props) { return <ButtonPrimitive {...props} /> }
export { Button }`
    expect(run(source)).toMatchObject({
      kind: "direct",
      rewrites: [
        "base-ui-primitive-mapped:@base-ui/react/button#Button",
        "classname-to-class",
      ],
    })
  })

  test("canonical useRender is direct; other shapes are blocking", () => {
    const canonical = `import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
function Tag({ className, render, ...props }: useRender.ComponentProps<"span">) {
  return useRender({ defaultTagName: "span", props: mergeProps<"span">({ className }, props), render, state: { slot: "tag" } })
}
export { Tag }`
    expect(run(canonical)).toMatchObject({ kind: "direct", blocking: [] })

    const other = `import { useRender } from "@base-ui/react/use-render"
function Tag(props: any) { const el = useRender({ render: props.render }); return el }
export { Tag }`
    expect(run(other).blocking).toEqual(["use-render-noncanonical"])
  })

  test.each([
    [
      `import { Toast as P } from "@base-ui/react/toast"\nexport function D() { return <P.Root /> }`,
      "base-ui-primitive-unmapped:@base-ui/react/toast#Toast",
    ],
    [
      `export { DirectionProvider } from "@base-ui/react/direction-provider"`,
      "base-ui-primitive-unmapped:@base-ui/react/direction-provider#DirectionProvider",
    ],
    [
      `import * as React from "react"\nexport function C() { const [s] = React.useState(0); return <div>{s}</div> }`,
      "react-hook:useState",
    ],
    [
      `import * as React from "react"\nexport const Ctx = React.createElement("div")`,
      "react-runtime-api:React.createElement",
    ],
    [
      `import { forwardRef } from "react"\nexport const C = forwardRef(() => null)`,
      "react-runtime-api:forwardRef",
    ],
    [
      `import * as React from "react"\nexport function C(p: { e: React.KeyboardEvent }) { return <div /> }`,
      "react-type-unmapped:React.KeyboardEvent",
    ],
    [
      `export function C() { return <button onClick={() => {}} /> }`,
      "event-handler:onClick",
    ],
    [
      `import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"\nexport function C() { return <IconPlaceholder lucide="NoSuchIcon" /> }`,
      "icon-unresolved:NoSuchIcon",
    ],
    [
      `import { Button } from "@/registry/base-nova/ui/button"\nexport function C() { return <Button /> }`,
      "registry-import:@/registry/base-nova/ui/button",
    ],
    [
      `import { Command } from "cmdk"\nexport function C() { return <Command /> }`,
      "unknown-import:cmdk",
    ],
  ])("blocks unsupported constructs (%#)", (source, expected) => {
    const result = run(source)
    expect(result.kind).toBe("unsupported")
    expect(result.blocking).toContain(expected)
  })

  test("Lucide icons behind IconPlaceholder are rewrites; render props block", () => {
    const icons = `import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"
export function C() { return <IconPlaceholder lucide="ChevronRightIcon" tabler="IconChevronRight" /> }`
    expect(run(icons)).toMatchObject({
      kind: "direct",
      rewrites: ["icon-placeholder", "lucide-icon:ChevronRightIcon"],
    })
    const renderProp = `import { Button } from "@/registry/base-nova/ui/button"
export function C() { return <Button render={<a href="/" />} /> }`
    expect(run(renderProp).blocking).toContain("render-prop:Button")
  })

  test("items without files, with several files, or with registry dependencies are blocked", () => {
    expect(
      classify(collectFacts({ name: "form", type: "registry:ui" }), {})
    ).toMatchObject({
      kind: "unsupported",
      reasons: [{ code: "no-files", blocking: true }],
    })
    const twoFiles = item(PLAIN)
    twoFiles.files = [...(twoFiles.files ?? []), ...(twoFiles.files ?? [])]
    expect(
      classify(collectFacts(twoFiles), {}).reasons.map(reasonKey)
    ).toContain("multi-file:2")
    expect(run(PLAIN, { registryDependencies: ["button"] }).blocking).toEqual([
      "registry-dependency:button",
    ])
  })

  test("an adapter that resolves every blocking reason yields custom-adapter", () => {
    const source = `export function C() { return <button onClick={() => {}} /> }`
    const adapters = {
      fixture: {
        kind: "custom" as const,
        resolves: ["event-handler"],
        notes: [],
      },
    }
    expect(run(source, {}, adapters).kind).toBe("custom-adapter")
    const partial = {
      fixture: {
        kind: "custom" as const,
        resolves: ["icon-unresolved"],
        notes: [],
      },
    }
    expect(run(source, {}, partial).kind).toBe("unsupported")
    const native = { fixture: { ...adapters.fixture, kind: "native" as const } }
    expect(run(source, {}, native).kind).toBe("native-adapter")
  })
})

describe("classification of the committed upstream snapshot", () => {
  const store = new UpstreamStore(ROOT, config.style)
  const kindOf = (name: string) =>
    classify(collectFacts(store.readItem(name)), COMPONENT_ADAPTERS, {
      available: new Set(config.components),
    }).kind

  // Built on browser primitives with behavior (native families, docs/adr/0019).
  const NATIVE = new Set([
    "accordion",
    "alert-dialog",
    "checkbox",
    "collapsible",
    "dialog",
    "popover",
    "radio-group",
    "select",
    "sheet",
    "switch",
    "toggle",
    "toggle-group",
  ])

  // Built with an optional client script (script families, docs/adr/0025).
  const SCRIPTED = new Set([
    "context-menu",
    "dropdown-menu",
    "hover-card",
    "menubar",
    "slider",
    "tabs",
    "tooltip",
  ])

  test.each([...config.components])(
    "%s (generation target) is direct, natively adapted or scripted",
    (name) => {
      expect(kindOf(name)).toBe(
        SCRIPTED.has(name)
          ? "script-adapter"
          : NATIVE.has(name)
            ? "native-adapter"
            : "direct"
      )
    }
  )

  test.each(["toast", "drawer", "combobox", "form"])(
    "%s is unsupported",
    (name) => {
      expect(kindOf(name)).toBe("unsupported")
    }
  )

  test("classification is deterministic", () => {
    const first = store.listItems().map(kindOf)
    const second = store.listItems().map(kindOf)
    expect(second).toEqual(first)
  })
})
