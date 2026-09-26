/**
 * Renders every visual parity case twice from the same data:
 *   - with the generated Hono JSX components (components/ui), and
 *   - with the upstream shadcn/ui React components from the committed snapshot,
 *     after the shadcn CLI's install-time `cn-*` marker rewrite.
 * Both pages share one Tailwind CSS build (the generated theme), so screenshot
 * differences come from markup and classes only.
 *
 * Output: .output/{hono,react}.html, .output/style.css, .output/cases.json
 */
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { jsx } from "hono/jsx"
import { createElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { COMPONENT_ADAPTERS } from "../../generator/src/adapters/components"
import { findFamilyRule } from "../../generator/src/adapters/families"
import { collectFacts } from "../../generator/src/analyzer/facts"
import { UpstreamStore } from "../../generator/src/upstream/store"
import { config } from "../../generator.config"
import {
  type CaseNode,
  type CaseProps,
  isCaseElement,
  VISUAL_CASES,
} from "./cases"

const HERE = import.meta.dir
const ROOT = path.resolve(HERE, "../..")
const OUT = path.join(HERE, ".output")
const UPSTREAM = path.join(HERE, ".upstream")
const MODES = ["light", "dark"] as const

type Exports = Record<string, unknown>

/**
 * Mirrors the shadcn CLI install step: `cn-font-heading` -> `font-heading`,
 * other `cn-*` removed, and registry imports resolved to the sibling files.
 */
function applyInstallMarkers(source: string): string {
  return source
    .split("\n")
    .map((line) =>
      line.startsWith("import ") || line.startsWith("} from ")
        ? line
            .replace(
              /"@\/registry\/[^/]+\/(?:ui|hooks)\/([a-z0-9-]+)"/,
              '"./$1"'
            )
            .replace(
              /"@\/app\/\(create\)\/components\/icon-placeholder"/,
              '"./icon-placeholder"'
            )
        : line.replace(/\bcn-[a-z-]+\b/g, (m) =>
            m === "cn-font-heading" ? "font-heading" : ""
          )
    )
    .join("\n")
}

/**
 * What the shadcn CLI produces for `IconPlaceholder` with the default icon
 * library: the named lucide-react icon with the remaining props.
 */
const ICON_PLACEHOLDER = `/** @jsxImportSource react */
import * as icons from "lucide-react"

const LIBRARIES = ["lucide", "tabler", "hugeicons", "phosphor", "remixicon"]

export function IconPlaceholder(props: Record<string, unknown>) {
  const Icon = (icons as Record<string, unknown>)[props.lucide as string] as (
    p: Record<string, unknown>
  ) => unknown
  const rest = Object.fromEntries(
    Object.entries(props).filter(([key]) => !LIBRARIES.includes(key))
  )
  return <Icon {...rest} />
}
`

function writeUpstreamSources(): void {
  const store = new UpstreamStore(ROOT, config.style)
  rmSync(UPSTREAM, { recursive: true, force: true })
  mkdirSync(UPSTREAM, { recursive: true })
  writeFileSync(path.join(UPSTREAM, "icon-placeholder.tsx"), ICON_PLACEHOLDER)
  // Upstream hooks are not snapshotted; tests/visual/hooks holds copies.
  for (const hook of readdirSync(path.join(HERE, "hooks"))) {
    copyFileSync(path.join(HERE, "hooks", hook), path.join(UPSTREAM, hook))
  }
  for (const name of config.components) {
    const [file] = store.readItem(name).files ?? []
    if (!file) throw new Error(`${name} has no upstream file`)
    writeFileSync(
      path.join(UPSTREAM, `${name}.tsx`),
      `/** @jsxImportSource react */\n${applyInstallMarkers(file.content)}`
    )
  }
}

/** Export name → the component whose file defines it. */
const OWNERS = new Map<string, string>()

async function loadExports(dir: string): Promise<Exports> {
  const exports: Exports = {}
  for (const name of config.components) {
    const module = await import(path.join(dir, `${name}.tsx`))
    for (const key of Object.keys(module)) {
      if (!OWNERS.has(key)) OWNERS.set(key, name)
    }
    Object.assign(exports, module)
  }
  return exports
}

/** Whether any element of the case (including element props) comes from one of `components`. */
function usesAny(node: CaseNode, components: ReadonlySet<string>): boolean {
  if (typeof node === "string") return false
  const [type, props, ...children] = node
  if (components.has(OWNERS.get(type) ?? "")) return true
  return [...Object.values(props).filter(isCaseElement), ...children].some(
    (child) => usesAny(child, components)
  )
}

function resolveType(type: string, exports: Exports): unknown {
  if (/^[a-z]/.test(type)) return type
  const component = exports[type]
  if (typeof component !== "function")
    throw new Error(`Unknown component ${type}`)
  return component
}

const REACT_PROP_NAMES: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  colspan: "colSpan",
  rowspan: "rowSpan",
  tabindex: "tabIndex",
  readonly: "readOnly",
}

/** Text fields are uncontrolled in React (`defaultValue` renders the same attribute). */
const UNCONTROLLED_FIELDS = new Set(["Input", "Textarea", "input", "textarea"])

function toReactProps(type: string, props: CaseProps): CaseProps {
  // React's render prop target takes className like any React element.
  return Object.fromEntries(
    Object.entries(props).map(([key, value]) => [
      key === "value" && UNCONTROLLED_FIELDS.has(type)
        ? "defaultValue"
        : (REACT_PROP_NAMES[key] ?? key),
      value,
    ])
  )
}

/** Element-valued props (`render`) are rendered with the same runtime. */
function mapElementProps(
  props: CaseProps,
  convert: (node: CaseNode) => unknown
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(props).map(([key, value]) => [
      key,
      isCaseElement(value) ? convert(value) : value,
    ])
  )
}

function toHono(node: CaseNode, exports: Exports): unknown {
  if (typeof node === "string") return node
  const [type, props, ...children] = node
  const tag = resolveType(type, exports) as Parameters<typeof jsx>[0]
  return jsx(
    tag,
    mapElementProps(props, (n) => toHono(n, exports)) as never,
    ...(children.map((c) => toHono(c, exports)) as never[])
  )
}

function toReact(node: CaseNode, exports: Exports): ReactNode {
  if (typeof node === "string") return node
  const [type, props, ...children] = node
  const tag = resolveType(type, exports) as string
  return createElement(
    tag,
    mapElementProps(toReactProps(type, props), (n) => toReact(n, exports)),
    ...children.map((c) => toReact(c, exports))
  )
}

function page(title: string, sections: string[]): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<link rel="stylesheet" href="style.css">
<style>body { margin: 0 } [data-case] { display: block; margin: 0 0 8px }</style>
</head>
<body>
${sections.join("\n")}
</body>
</html>
`
}

function section(
  id: string,
  mode: (typeof MODES)[number],
  width: number,
  html: string
): string {
  return `<section data-case="${id}@${mode}" class="${mode === "dark" ? "dark" : ""}" style="width:${width}px"><div class="bg-background p-4 text-foreground">${html}</div></section>`
}

/**
 * Components built on a `native-structure` family (docs/adr/0019), or whose
 * component adapter declares it: their markup differs from upstream's, so
 * only pixels and icons are compared.
 */
function nativeStructureComponents(): Set<string> {
  const store = new UpstreamStore(ROOT, config.style)
  return new Set(
    config.components.filter(
      (name) =>
        COMPONENT_ADAPTERS[name]?.domParity === "native-structure" ||
        collectFacts(store.readItem(name)).files.some((file) =>
          file.imports.some((imp) =>
            imp.named.some(
              (named) =>
                findFamilyRule(imp.module, named.name)?.domParity ===
                "native-structure"
            )
          )
        )
    )
  )
}

async function main(): Promise<void> {
  writeUpstreamSources()
  const hono = await loadExports(path.join(ROOT, "components", "ui"))
  const react = await loadExports(UPSTREAM)

  const honoSections: string[] = []
  const reactSections: string[] = []
  const nativeStructure = nativeStructureComponents()
  const ids: { id: string; compareDom: boolean }[] = []
  for (const visualCase of VISUAL_CASES) {
    const width = visualCase.width ?? 520
    const reactHtml = renderToStaticMarkup(toReact(visualCase.node, react))
    for (const mode of MODES) {
      // Rendered per mode so generated ids (and <details name> groups) stay unique on the page.
      const honoHtml = String(await toHono(visualCase.node, hono))
      ids.push({
        id: `${visualCase.id}@${mode}`,
        compareDom: !usesAny(visualCase.node, nativeStructure),
      })
      honoSections.push(section(visualCase.id, mode, width, honoHtml))
      reactSections.push(section(visualCase.id, mode, width, reactHtml))
    }
  }

  mkdirSync(OUT, { recursive: true })
  writeFileSync(
    path.join(OUT, "hono.html"),
    page("Hono JSX (generated)", honoSections)
  )
  writeFileSync(
    path.join(OUT, "react.html"),
    page("shadcn/ui (upstream React)", reactSections)
  )
  writeFileSync(
    path.join(OUT, "cases.json"),
    `${JSON.stringify(ids, null, 2)}\n`
  )
  writeFileSync(
    path.join(OUT, "input.css"),
    [
      '@import "tailwindcss";',
      '@import "../../../styles/shadcn/theme.css";',
      '@source "../../../components/ui";',
      '@source "../.upstream";',
      '@source "../cases.ts";',
      '@source "../render.ts";',
      '@source "../demos-hono.tsx";',
      '@source "../demos-react.tsx";',
      "",
    ].join("\n")
  )
  const tailwind = Bun.spawnSync(
    [
      path.join(HERE, "node_modules", ".bin", "tailwindcss"),
      "-i",
      "input.css",
      "-o",
      "style.css",
    ],
    { cwd: OUT, stdout: "pipe", stderr: "pipe" }
  )
  if (tailwind.exitCode !== 0) throw new Error(tailwind.stderr.toString())
  await renderDemoPages()
  console.log(
    `Rendered ${ids.length} cases to ${path.relative(process.cwd(), OUT)}`
  )
}

/**
 * Behavior/parity pages per modal demo: `<name>-hono.html` (server-rendered,
 * no scripts) and `<name>-react.html` (upstream, rendered in the browser).
 */
async function renderDemoPages(): Promise<void> {
  const { DEMOS, DEMO_SCRIPTS } = await import("./demos-hono")
  const build = await Bun.build({
    entrypoints: [path.join(HERE, "demos-react.tsx")],
    outdir: OUT,
    target: "browser",
    format: "iife",
    define: { "process.env.NODE_ENV": '"production"' },
  })
  if (!build.success)
    throw new AggregateError(build.logs, "demos-react build failed")
  const head = `<meta charset="utf-8"><link rel="stylesheet" href="style.css">`
  for (const [name, demo] of Object.entries(DEMOS)) {
    const scripts = (DEMO_SCRIPTS[name] ?? [])
      .map(
        (script) => `<script type="module" src="/shadcn/${script}.js"></script>`
      )
      .join("")
    writeFileSync(
      path.join(OUT, `${name}-hono.html`),
      `<!doctype html><html lang="en"><head>${head}${scripts}<title>${name} (Hono)</title></head><body>${String(await demo())}</body></html>\n`
    )
    writeFileSync(
      path.join(OUT, `${name}-react.html`),
      `<!doctype html><html lang="en"><head>${head}<title>${name} (upstream)</title></head><body><div id="root" data-demo="${name}"></div><script src="demos-react.js"></script></body></html>\n`
    )
  }
}

await main()
