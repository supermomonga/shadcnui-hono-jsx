import { describe, expect, test } from "bun:test"
import { collectFacts } from "../../src/analyzer/facts"
import { parseSource } from "../../src/analyzer/source"
import type {
  TransformContext,
  TransformStep,
} from "../../src/transformers/context"
import { STEPS, transformSource } from "../../src/transformers/pipeline"
import { classAttr } from "../../src/transformers/steps/class-attr"
import {
  cnMarkers,
  rewriteClassTokens,
} from "../../src/transformers/steps/cn-markers"
import { removeDirectives } from "../../src/transformers/steps/directives"
import { domAttributes } from "../../src/transformers/steps/dom-attributes"
import { dropProps } from "../../src/transformers/steps/drop-props"
import { primitivesStep } from "../../src/transformers/steps/primitives"
import { reactTypes } from "../../src/transformers/steps/react-types"
import { styleValues } from "../../src/transformers/steps/style-values"
import { useRenderStep } from "../../src/transformers/steps/use-render"

function facts(source: string) {
  const item = {
    name: "fixture",
    type: "registry:ui",
    files: [{ path: "fixture.tsx", type: "registry:ui", content: source }],
  }
  const [file] = collectFacts(item).files
  if (!file) throw new Error("no facts")
  return file
}

/** Runs `steps` on `source` and returns the resulting text and context. */
function apply(source: string, ...steps: TransformStep[]) {
  const ctx: TransformContext = {
    sf: parseSource(source),
    name: "fixture",
    facts: facts(source),
    primitives: new Map(),
    adapter: undefined,
    honoTypes: new Set(),
    needsComponentProps: false,
    icons: new Set(),
    honoValues: new Set(),
    needsRender: false,
    log: [],
  }
  for (const step of steps) step.run(ctx)
  return { text: ctx.sf.getFullText().trim(), ctx }
}

/** Collapses whitespace so assertions do not depend on formatting. */
const squash = (text: string) => text.replace(/\s+/g, " ").trim()

describe("remove-directives", () => {
  test("removes leading directives only", () => {
    const { text } = apply(
      `"use client"\n\nconst a = "use client"`,
      removeDirectives
    )
    expect(text).toBe(`const a = "use client"`)
  })
})

describe("cn-markers", () => {
  test("maps cn-font-heading and strips other cn-* classes", () => {
    expect(rewriteClassTokens("cn-font-heading text-base cn-card-title")).toBe(
      "font-heading text-base"
    )
    expect(rewriteClassTokens("a  b")).toBe("a  b")
  })

  test("rewrites string literals but not import specifiers", () => {
    const { text } = apply(
      `import { cn } from "cn"\nconst c = cn("cn-button p-2", x)`,
      cnMarkers
    )
    expect(text).toBe(`import { cn } from "cn"\nconst c = cn("p-2", x)`)
  })
})

describe("use-render", () => {
  test("turns canonical useRender into an intrinsic element with state data attributes", () => {
    const { text } = apply(
      `function Badge({ className, variant = "default", render, ...props }) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">({ className: cn(badgeVariants({ variant }), className) }, props),
    render,
    state: { slot: "badge", variant, isOpen: open },
  })
}`,
      useRenderStep
    )
    expect(squash(text)).toContain(
      `return renderElement(<span data-slot="badge" data-variant={variant} data-isopen={open} className={cn(badgeVariants({ variant }), className)} {...props} />, render)`
    )
  })
})

describe("primitives", () => {
  test("maps Base UI Button to <button> with defaults before the spread", () => {
    const { text, ctx } = apply(
      `import { Button as ButtonPrimitive } from "@base-ui/react/button"
function Button({ className, ...props }: ButtonPrimitive.Props & V) {
  return <ButtonPrimitive data-slot="button" className={className} {...props} />
}`,
      primitivesStep
    )
    expect(squash(text)).toContain(
      `function Button({ className, render, nativeButton: _nativeButton, focusableWhenDisabled: _focusableWhenDisabled, ...props }: ComponentProps<"button", RenderProp> & V)`
    )
    expect(squash(text)).toContain(
      `return renderElement(<button data-slot="button" className={className} type="button" data-disabled={props.disabled ? "" : undefined} {...props} />, render)`
    )
    expect(ctx.needsComponentProps).toBe(true)
    expect(ctx.needsRender).toBe(true)
  })

  test("maps prop attributes and keeps explicit attributes over defaults", () => {
    const { text } = apply(
      `import { Separator as P } from "@base-ui/react/separator"
function S({ orientation = "horizontal", ...props }: P.Props) {
  return <P role="none" orientation={orientation} {...props}>child</P>
}`,
      primitivesStep
    )
    expect(squash(text)).toContain(
      `<div role="none" aria-orientation={orientation} data-orientation={orientation} {...props}>child</div>`
    )
  })

  test("requires mapped props to be passed explicitly", () => {
    expect(() =>
      apply(
        `import { Separator as P } from "@base-ui/react/separator"
function S(props: P.Props) { return <P {...props} /> }`,
        primitivesStep
      )
    ).toThrow(/orientation" must be passed explicitly/)
  })
})

describe("react-types", () => {
  test("rewrites React and useRender prop types, ReactNode and CSSProperties", () => {
    const { text, ctx } = apply(
      `type A = React.ComponentProps<"div">
type B = useRender.ComponentProps<"span">
type C = { icon: React.ReactNode; style: React.CSSProperties }`,
      reactTypes
    )
    expect(text).toBe(`type A = ComponentProps<"div">
type B = ComponentProps<"span", RenderProp>
type C = { icon: Child; style: CSSProperties }`)
    expect([...ctx.honoTypes].sort()).toEqual(["CSSProperties", "Child"])
  })

  test("rejects React types without a Hono equivalent", () => {
    expect(() => apply(`type E = React.KeyboardEvent`, reactTypes)).toThrow(
      /no Hono JSX equivalent for React.KeyboardEvent/
    )
  })
})

describe("style-values", () => {
  test("stringifies non-string custom property values in style objects", () => {
    const { text } = apply(
      `const a = <div style={{ "--ratio": ratio, "--gap": "4px", width: 10 } as React.CSSProperties} />
const b = <div style={{ ["--x"]: 1 }} />`,
      styleValues
    )
    expect(
      text
    ).toBe(`const a = <div style={{ "--ratio": String(ratio), "--gap": "4px", width: 10 } as React.CSSProperties} />
const b = <div style={{ ["--x"]: 1 }} />`)
  })
})

describe("class-attr", () => {
  test("binds the class prop to the upstream className local and renders class", () => {
    const { text } = apply(
      `function A({ className, ...props }) { return <div className={className} {...props} /> }
function B({ className = "x" }) { return <div className="y" /> }
function C({ className: cls }) { return <div className={cls} /> }`,
      classAttr
    )
    expect(
      text
    ).toBe(`function A({ class: className, ...props }) { return <div class={className} {...props} /> }
function B({ class: className = "x" }) { return <div class="y" /> }
function C({ class: cls }) { return <div class={cls} /> }`)
  })
})

describe("dom-attributes", () => {
  test("lowercases React camelCase attributes on intrinsic elements only", () => {
    const { text } = apply(
      `const a = <input readOnly tabIndex={0} maxLength={3} />
const b = <Custom tabIndex={0} />`,
      domAttributes
    )
    expect(text).toBe(`const a = <input readonly tabindex={0} maxlength={3} />
const b = <Custom tabIndex={0} />`)
  })
})

describe("drop-props", () => {
  test("removes unused asChild bindings and keeps render (supported)", () => {
    const { text } = apply(
      `function A({ className, render, asChild, ...props }) { return <div {...props} /> }`,
      dropProps
    )
    expect(squash(text)).toBe(
      `function A({ className, render, ...props }) { return <div {...props} /> }`
    )
  })

  test("folds conditionals on a dropped prop to their else branch", () => {
    const { text } = apply(
      `function A({ asChild, type, ...props }) { return <button type={asChild ? type : (type ?? "button")} {...props} /> }`,
      dropProps
    )
    expect(squash(text)).toBe(
      `function A({ type, ...props }) { return <button type={(type ?? "button")} {...props} /> }`
    )
  })

  test("refuses to drop a prop that is still used", () => {
    expect(() =>
      apply(
        `function A({ asChild, ...props }) { return asChild(props) }`,
        dropProps
      )
    ).toThrow(/"asChild" is still used/)
  })
})

describe("pipeline", () => {
  const source = `"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cn } from "cn"

function Box({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="box" className={cn("cn-font-heading p-2", className)} {...props} />
}

function Button({ className, ...props }: ButtonPrimitive.Props) {
  return <ButtonPrimitive className={cn("px-2", className)} {...props} />
}

export { Box, Button }
`

  test("produces React-free Hono JSX", () => {
    const { text } = transformSource({
      name: "fixture",
      source,
      facts: facts(source),
    })
    expect(text).toMatch(/^import type \{ [^}]*JSX[^}]* \} from "hono\/jsx"/)
    expect(text).toContain(
      `import { cloneElement, isValidElement } from "hono/jsx"`
    )
    expect(text).not.toContain("React")
    expect(text).not.toContain("@base-ui")
    expect(text).not.toContain("use client")
    expect(text).not.toContain("className=")
    expect(text).toContain(
      `type ComponentProps<T extends keyof JSX.IntrinsicElements, Render = never>`
    )
    expect(squash(text)).toContain(
      `function Box({ class: className, ...props }: ComponentProps<"div">)`
    )
    expect(squash(text)).toContain(`class={cn("font-heading p-2", className)}`)
    expect(squash(text)).toContain(
      `<button class={cn("px-2", className)} type="button"`
    )
  })

  test("is deterministic", () => {
    const run = () =>
      transformSource({ name: "fixture", source, facts: facts(source) }).text
    expect(run()).toBe(run())
  })

  test("guard rejects unresolved components", () => {
    const bad = `import { Icon } from "lucide-react"\nexport function A() { return <Icon /> }`
    expect(() =>
      transformSource({ name: "fixture", source: bad, facts: facts(bad) })
    ).toThrow(/guard: prohibited import lucide-react/)
  })

  test("runs every step exactly once, guard last", () => {
    expect(STEPS.map((s) => s.name)).toEqual([
      "remove-directives",
      "component-imports",
      "cn-markers",
      "icons",
      "use-render",
      "primitives",
      "react-types",
      "style-values",
      "class-attr",
      "dom-attributes",
      "drop-props",
      "helpers",
      "imports",
      "guard",
    ])
  })
})
