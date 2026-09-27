import { describe, expect, test } from "bun:test"
import {
  applyOverride,
  tidyImports,
  translateExample,
} from "../../src/site/translate"
import { sha256 } from "../../src/upstream/hash"

describe("translateExample", () => {
  test("points imports at the site's installs and the shared icons", () => {
    const { text, icons, issues } = translateExample(
      "demo",
      `"use client"

import { ArrowUpIcon } from "lucide-react"
import { IconCheck } from "@tabler/icons-react"
import { Button } from "@/styles/base-nova/ui/button"
import { Bubble } from "@/styles/base-rhea/ui/bubble"
import { Field } from "@/styles/base-nova/ui-rtl/field"

export default function Demo() {
  return <Button><ArrowUpIcon /><IconCheck /><Bubble /><Field /></Button>
}`
    )
    expect(text).not.toContain("use client")
    expect(text).toContain('from "@/components/icons"')
    expect(text).toContain('from "@/components/ui/button"')
    expect(text).toContain('from "@/ui/rhea/bubble"')
    expect(text).toContain('from "@/ui/nova-rtl/field"')
    expect(icons.map((i) => [i.name, i.source])).toEqual([
      ["ArrowUpIcon", "lucide"],
      ["IconCheck", "tabler"],
    ])
    expect(issues).toEqual([])
  })

  test("renders class, for and initial input values as Hono JSX does", () => {
    const { text } = translateExample(
      "form",
      `import { Input } from "@/styles/base-nova/ui/input"
import { Select } from "@/styles/base-nova/ui/select"
export function Form({ className }: { className?: string }) {
  return (
    <div className={className}>
      <label htmlFor="name">Name</label>
      <Input id="name" defaultValue="Pedro" />
      <Select items={items} defaultValue="a" />
      <Select defaultValue={null} />
    </div>
  )
}`
    )
    expect(text).toContain(
      "function Form({ class: className }: { class?: string })"
    )
    expect(text).toContain("<div class={className}>")
    expect(text).toContain('<label for="name">')
    expect(text).toContain('<Input id="name" value="Pedro" />')
    expect(text).toContain('<Select defaultValue="a" />')
    expect(text).toContain("<Select />")
  })

  test("turns Next.js links and images into elements", () => {
    const { text } = translateExample(
      "next",
      `import Image from "next/image"
import Link from "next/link"
export function A() {
  return <Link href="/x"><Image src="/a.png" alt="" fill className="rounded" /></Link>
}`
    )
    expect(text).toContain('<a href="/x">')
    expect(text).toContain("</a>")
    expect(text).toContain(
      '<img src="/a.png" alt="" class="absolute inset-0 size-full rounded" />'
    )
    expect(text).not.toContain("next/")
  })

  test("reports functions that need React, with the hash of their upstream text", () => {
    const upstream = `export function Pick() {
  const [value, setValue] = React.useState("a")
  return <Select value={value} onValueChange={setValue} />
}`
    const source = `import * as React from "react"
import { toast } from "sonner"
${upstream}
export function Notify() {
  return <button type="button">{String(toast)}</button>
}
export function Plain() {
  return <p>ok</p>
}`
    const { issues } = translateExample("pick", source)
    expect(issues).toEqual([
      {
        name: "Pick",
        sha256: sha256(upstream),
        reasons: ["calls React.useState", "handles onValueChange"],
      },
      {
        name: "Notify",
        sha256: expect.any(String),
        reasons: ["uses toast from sonner"],
      },
    ])
  })

  test("reports props the components do not have and types from React-only libraries", () => {
    const { issues } = translateExample(
      "unsupported",
      `import type { UIMessage } from "ai"
import { Collapsible, CollapsibleTrigger } from "@/styles/base-nova/ui/collapsible"
import { Select } from "@/styles/base-nova/ui/select"
type Message = UIMessage<unknown>
export function Tree() {
  return <Collapsible><CollapsibleTrigger render={<button type="button" />} /></Collapsible>
}
export function Fruits() {
  return <Select multiple defaultValue={[]} />
}`
    )
    expect(issues).toEqual([
      {
        name: "Message",
        sha256: expect.any(String),
        reasons: ["uses UIMessage from ai"],
      },
      {
        name: "Tree",
        sha256: expect.any(String),
        reasons: ["passes render to CollapsibleTrigger"],
      },
      {
        name: "Fruits",
        sha256: expect.any(String),
        reasons: ["passes multiple to Select"],
      },
    ])
  })

  test("keeps fragments with keys and React types in Hono JSX terms", () => {
    const { text } = translateExample(
      "types",
      `import * as React from "react"
export function List({ items, icon: Icon }: { items: string[]; icon: React.ElementType }) {
  return <>{items.map((item) => <React.Fragment key={item}><Icon />{item}</React.Fragment>)}</>
}
export function Box(props: React.ComponentProps<"div">) {
  return <div {...props} />
}`
    )
    expect(text).toContain('import { Fragment } from "hono/jsx"')
    expect(text).toContain('import type { FC, JSX } from "hono/jsx"')
    expect(text).toContain("<Fragment key={item}>")
    expect(text).toContain("icon: FC")
    expect(text).toContain('props: ComponentProps<"div">')
  })
})

describe("applyOverride and tidyImports", () => {
  test("replace functions, add the override's imports and drop unused ones", () => {
    const translated = `import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"

export function Pick() {
  return <Select value={value} />
}

export function Keep() {
  return <Button>ok</Button>
}`
    const override = `import { NativeSelect } from "@/components/ui/native-select"

export function Pick() {
  return <NativeSelect defaultValue="a" />
}`
    const text = tidyImports(applyOverride(translated, override, ["Pick"]))
    expect(text).toContain('import { Button } from "@/components/ui/button"')
    expect(text).toContain(
      'import { NativeSelect } from "@/components/ui/native-select"'
    )
    expect(text).not.toContain("@/components/ui/select")
    expect(text).toContain('<NativeSelect defaultValue="a" />')
    expect(text).toContain("<Button>ok</Button>")
  })

  test("attribute names and comments do not keep an import", () => {
    const text = tidyImports(`import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { Progress, ProgressValue } from "@/components/ui/progress"

export function Show() {
  return (
    <>
      {/* ProgressValue takes no render function. */}
      <Progress value={50} />
      <Button data-toast-trigger="">Show</Button>
    </>
  )
}`)
    expect(text).toContain('import { Button } from "@/components/ui/button"')
    expect(text).toContain(
      'import { Progress } from "@/components/ui/progress"'
    )
    expect(text).not.toContain("@/components/ui/toast")
  })
})
