/**
 * Translates the examples of the shadcn/ui website (React, Base UI styles)
 * into Hono JSX for the documentation site (docs/adr/0034). Examples use the
 * generated components through the site's installs, so only the example code
 * itself changes: import paths, `className`, React types, Next.js elements
 * and icon imports. Top-level functions that need React behavior (hooks,
 * event handlers, React-only libraries) are reported with the hash of their
 * upstream text, so hand-written overrides can replace them.
 */
import {
  type FunctionDeclaration,
  type InterfaceDeclaration,
  type JsxAttribute,
  type JsxOpeningElement,
  type JsxSelfClosingElement,
  Node,
  type SourceFile,
  SyntaxKind,
  type TypeAliasDeclaration,
  type VariableStatement,
} from "ts-morph"
import { parseSource } from "../analyzer/source"
import type { TransformContext } from "../transformers/context"
import { classAttr } from "../transformers/steps/class-attr"
import { removeDirectives } from "../transformers/steps/directives"
import { icons as iconsStep } from "../transformers/steps/icons"
import { reactTypes } from "../transformers/steps/react-types"
import { sha256 } from "../upstream/hash"

/** The shared icon module examples import icons from (site/generated/icons.tsx). */
export const ICONS_MODULE = "@/components/icons"

/** Upstream style directories → the site's install aliases. */
const UI_ALIASES: [RegExp, string][] = [
  [/^@\/styles\/base-nova\/ui\/(.+)$/, "@/components/ui/$1"],
  [/^@\/styles\/base-nova\/ui-rtl\/(.+)$/, "@/ui/nova-rtl/$1"],
  [/^@\/styles\/base-rhea\/ui\/(.+)$/, "@/ui/rhea/$1"],
  [/^@\/registry\/base-nova\/ui\/(.+)$/, "@/components/ui/$1"],
  [/^@\/registry\/base-nova\/components\/(.+)$/, "./$1"],
]

/** Modules whose imports go away: `IconPlaceholder` becomes inline icons. */
const DROPPED_MODULES = ["@/app/(create)/components/icon-placeholder"]

/** Modules examples may keep importing. */
const KEPT_MODULES = [
  "cn",
  "@hugeicons/core-free-icons",
  "@/components/language-selector",
]

/** Icon packages whose imports move to the shared icon module. */
export type IconSource = "lucide" | "tabler" | "hugeicons"
const ICON_PACKAGES: Record<string, IconSource> = {
  "lucide-react": "lucide",
  "@tabler/icons-react": "tabler",
  "@hugeicons/react": "hugeicons",
}

/**
 * Hooks a translated function may call: the site provides `useTranslation`,
 * and Combobox's anchor works on the server (`ref={anchor}` included).
 */
const SUPPORTED_HOOKS = new Set(["useTranslation", "useComboboxAnchor"])

/**
 * Props of Base UI parts the components do not have (docs/compatibility.md),
 * so a function passing them needs an override. Type checking the generated
 * examples finds any others.
 */
const UNSUPPORTED_PROPS: Record<string, string[]> = {
  Collapsible: ["render"],
  CollapsibleTrigger: ["render"],
  Drawer: ["disablePointerDismissal"],
  Select: ["multiple"],
}

/** Inputs whose `defaultValue` is their initial `value` (Hono JSX renders `defaultValue` as is). */
const VALUE_INPUTS = new Set([
  "input",
  "Input",
  "InputGroupInput",
  "SidebarInput",
])

export interface FunctionIssue {
  /** Name of the top-level function (or constant). */
  name: string
  /** SHA-256 of its upstream text, to notice upstream changes to overrides. */
  sha256: string
  reasons: string[]
}

export interface TranslatedExample {
  /** Translated, unformatted source. */
  text: string
  /** Icons imported from the shared module, by source package. */
  icons: { name: string; source: IconSource; imported: string }[]
  /** Top-level declarations that need a hand-written override. */
  issues: FunctionIssue[]
  /** SHA-256 of every top-level declaration's upstream text. */
  hashes: Map<string, string>
}

type Element = JsxOpeningElement | JsxSelfClosingElement

function elements(sf: SourceFile): Element[] {
  return [
    ...sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ]
}

function attributesOf(element: Element): JsxAttribute[] {
  return element.getAttributes().filter(Node.isJsxAttribute)
}

type Unit =
  | FunctionDeclaration
  | VariableStatement
  | TypeAliasDeclaration
  | InterfaceDeclaration

/** Top-level functions, constants and types by name. */
function topLevel(sf: SourceFile): Map<string, Unit> {
  const units = new Map<string, Unit>()
  for (const statement of sf.getStatements()) {
    if (
      Node.isFunctionDeclaration(statement) ||
      Node.isTypeAliasDeclaration(statement) ||
      Node.isInterfaceDeclaration(statement)
    ) {
      const name = statement.getName()
      if (name) units.set(name, statement)
    } else if (Node.isVariableStatement(statement)) {
      for (const declaration of statement.getDeclarations()) {
        units.set(declaration.getName(), statement)
      }
    }
  }
  return units
}

/** SHA-256 of each top-level function or constant of the upstream source. */
export function upstreamHashes(source: string): Map<string, string> {
  const sf = parseSource(source, "example.tsx")
  return new Map(
    [...topLevel(sf)].map(([name, node]) => [name, sha256(node.getText())])
  )
}

function context(sf: SourceFile, name: string): TransformContext {
  return {
    sf,
    name,
    facts: undefined as never,
    primitives: new Map(),
    adapter: undefined,
    honoTypes: new Set(),
    needsComponentProps: false,
    icons: new Set(),
    honoValues: new Set(),
    needsRender: false,
    log: [],
  }
}

export function translateExample(
  name: string,
  source: string
): TranslatedExample {
  const hashes = upstreamHashes(source)
  const sf = parseSource(source, `${name}.tsx`)
  const ctx = context(sf, name)
  removeDirectives.run(ctx)
  // Registry examples (the create page) use IconPlaceholder, which becomes an
  // inline Lucide icon marked with every library's name, as in components.
  const placeholders = sf
    .getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    .some((element) => element.getTagNameNode().getText() === "IconPlaceholder")
  if (placeholders) iconsStep.run(ctx)

  const icons: TranslatedExample["icons"] = []
  /** Local names imported from modules the site cannot provide. */
  const unsupported = new Map<string, string>()
  const renames = new Map<string, string>()
  for (const declaration of sf.getImportDeclarations()) {
    const module = declaration.getModuleSpecifierValue()
    if (DROPPED_MODULES.includes(module)) {
      declaration.remove()
      continue
    }
    const alias = UI_ALIASES.find(([pattern]) => pattern.test(module))
    if (alias) {
      declaration.setModuleSpecifier(module.replace(alias[0], alias[1]))
      continue
    }
    const iconSource = ICON_PACKAGES[module]
    if (iconSource) {
      for (const specifier of declaration.getNamedImports()) {
        // `type LucideIcon`: an icon component, a Hono JSX component here.
        if (specifier.isTypeOnly() || specifier.getName() === "LucideIcon") {
          const local =
            specifier.getAliasNode()?.getText() ?? specifier.getName()
          for (const ref of sf.getDescendantsOfKind(SyntaxKind.TypeReference)) {
            if (ref.getTypeName().getText() === local) ref.replaceWithText("FC")
          }
          ctx.honoTypes.add("FC" as never)
          specifier.remove()
          continue
        }
        icons.push({
          name: specifier.getName(),
          source: iconSource,
          imported: specifier.getName(),
        })
      }
      declaration.setModuleSpecifier(ICONS_MODULE)
      continue
    }
    if (KEPT_MODULES.includes(module) || module.startsWith("./")) continue
    const locals = [
      declaration.getDefaultImport()?.getText(),
      declaration.getNamespaceImport()?.getText(),
      ...declaration
        .getNamedImports()
        .map((s) => s.getAliasNode()?.getText() ?? s.getName()),
    ].filter((local): local is string => local !== undefined)
    if (module === "next/link") {
      for (const local of locals) renames.set(local, "a")
    } else if (module === "next/image") {
      for (const local of locals) renames.set(local, "img")
    } else if (module === "react") {
      // Types go through react-types; values (hooks) are unsupported.
      for (const specifier of declaration.getNamedImports()) {
        if (!specifier.isTypeOnly() && !declaration.isTypeOnly()) {
          unsupported.set(specifier.getName(), module)
        }
      }
    } else {
      for (const local of locals) unsupported.set(local, module)
    }
    declaration.remove()
  }

  // Issues are found on the translated tree, before JSX attributes change.
  const issues: FunctionIssue[] = []
  for (const [unit, node] of topLevel(sf)) {
    const reasons = new Set<string>()
    for (const call of node.getDescendantsOfKind(SyntaxKind.CallExpression)) {
      const callee = call.getExpression().getText()
      const hook = callee.replace(/^React\./, "")
      if (/^use[A-Z]/.test(hook) && !SUPPORTED_HOOKS.has(hook)) {
        reasons.add(`calls ${callee}`)
      }
    }
    // Combobox's anchor (`const anchor = useComboboxAnchor()`, `ref={anchor}`).
    const anchors = new Set(
      node
        .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
        .filter((declaration) =>
          /^useComboboxAnchor\(/.test(
            declaration.getInitializer()?.getText() ?? ""
          )
        )
        .map((declaration) => declaration.getName())
    )
    for (const attribute of node.getDescendantsOfKind(
      SyntaxKind.JsxAttribute
    )) {
      const attributeName = attribute.getNameNode().getText()
      if (/^on[A-Z]/.test(attributeName)) {
        reasons.add(`handles ${attributeName}`)
      }
      const value = attribute.getInitializer()?.getText() ?? ""
      if (attributeName === "ref" && !anchors.has(value.slice(1, -1))) {
        reasons.add("uses a ref")
      }
      const tag = (attribute.getParent().getParent() as Element)
        .getTagNameNode()
        .getText()
      if (UNSUPPORTED_PROPS[tag]?.includes(attributeName)) {
        reasons.add(`passes ${attributeName} to ${tag}`)
      }
    }
    for (const identifier of node.getDescendantsOfKind(SyntaxKind.Identifier)) {
      const module = unsupported.get(identifier.getText())
      if (module && !Node.isImportSpecifier(identifier.getParent())) {
        reasons.add(`uses ${identifier.getText()} from ${module}`)
      }
    }
    if (reasons.size > 0) {
      issues.push({
        name: unit,
        sha256: hashes.get(unit) ?? "",
        reasons: [...reasons].sort(),
      })
    }
  }

  // `React.ElementType` (icons passed as data) is a Hono JSX component here,
  // and React's synthetic events are DOM events.
  for (const ref of sf
    .getDescendantsOfKind(SyntaxKind.TypeReference)
    .reverse()) {
    const typeName = ref.getTypeName().getText()
    if (typeName === "React.ElementType") {
      ref.replaceWithText("FC")
      ctx.honoTypes.add("FC" as never)
    } else if (/^React\.\w*Event$/.test(typeName)) {
      ref.replaceWithText("Event")
    }
  }
  reactTypes.run(ctx)
  if (ctx.needsComponentProps) {
    sf.addStatements(
      `type ComponentProps<T extends keyof JSX.IntrinsicElements | "svg"> = (T extends keyof JSX.IntrinsicElements ? JSX.IntrinsicElements[T] : Record<string, unknown>) & { class?: string | undefined }`
    )
    ctx.honoTypes.add("JSX")
  }
  // Components defined in the example take `class` like the generated ones.
  classAttr.run(ctx)
  for (const signature of sf.getDescendantsOfKind(
    SyntaxKind.PropertySignature
  )) {
    if (
      signature.getName() === "className" &&
      signature.getFirstAncestorByKind(SyntaxKind.Parameter)
    ) {
      signature.getNameNode().replaceWithText("class")
    }
  }
  // `<React.Fragment>` (with a key) is Hono JSX's `Fragment`.
  let fragment = false
  for (const element of elements(sf)) {
    if (element.getTagNameNode().getText() !== "React.Fragment") continue
    element.getTagNameNode().replaceWithText("Fragment")
    if (Node.isJsxOpeningElement(element)) {
      element
        .getParentIfKind(SyntaxKind.JsxElement)
        ?.getClosingElement()
        .getTagNameNode()
        .replaceWithText("Fragment")
    }
    fragment = true
  }
  if (fragment) sf.insertStatements(0, 'import { Fragment } from "hono/jsx"')
  if (placeholders && !sf.getImportDeclaration("cn")) {
    sf.insertStatements(0, 'import { cn } from "cn"')
  }
  if (ctx.honoTypes.size > 0) {
    sf.insertStatements(
      0,
      `import type { ${[...ctx.honoTypes].sort().join(", ")} } from "hono/jsx"`
    )
  }

  for (const element of elements(sf)) {
    const tagNode = element.getTagNameNode()
    const tag = tagNode.getText()
    const renamed = renames.get(tag)
    if (renamed) {
      tagNode.replaceWithText(renamed)
      if (Node.isJsxOpeningElement(element)) {
        const closing = element
          .getParentIfKind(SyntaxKind.JsxElement)
          ?.getClosingElement()
        closing?.getTagNameNode().replaceWithText(renamed)
      }
    }
    for (const attribute of attributesOf(element)) {
      const attributeName = attribute.getNameNode().getText()
      if (attributeName === "className") attribute.setName("class")
      else if (attributeName === "htmlFor") attribute.setName("for")
      else if (attributeName === "defaultValue" && VALUE_INPUTS.has(tag)) {
        attribute.setName("value")
      } else if (attributeName === "items" && tag === "Select") {
        // Base UI's labels for the value: the native select shows its option.
        attribute.remove()
      } else if (
        attributeName === "defaultValue" &&
        tag === "Select" &&
        attribute.getInitializer()?.getText() === "{null}"
      ) {
        // Base UI's empty value, which is the default.
        attribute.remove()
      }
    }
    // next/image `fill`: what Next.js renders for it.
    if (renamed === "img") {
      const fill = attributesOf(element).find(
        (a) => a.getNameNode().getText() === "fill"
      )
      if (fill) {
        fill.remove()
        const classAttribute = attributesOf(element).find(
          (a) => a.getNameNode().getText() === "class"
        )
        const initializer = classAttribute?.getInitializer()
        const fillClasses = "absolute inset-0 size-full"
        if (classAttribute && Node.isStringLiteral(initializer)) {
          initializer.setLiteralValue(
            `${fillClasses} ${initializer.getLiteralValue()}`
          )
        } else if (!classAttribute) {
          element.addAttribute({
            name: "class",
            initializer: `"${fillClasses}"`,
          })
        }
      }
    }
  }

  return { text: sf.getFullText(), icons, issues, hashes }
}

/**
 * Replaces top-level functions of `translated` with those of `override`, a
 * hand-written Hono JSX module, and adds its imports and other declarations.
 */
export function applyOverride(
  translated: string,
  override: string,
  names: readonly string[]
): string {
  const sf = parseSource(translated, "translated.tsx")
  const replacement = parseSource(override, "override.tsx")
  const replacements = topLevel(replacement)
  const units = topLevel(sf)
  for (const name of names) {
    const node = units.get(name)
    const next = replacements.get(name)
    if (!node || !next) {
      throw new Error(`the override has no ${name}`)
    }
    node.replaceWithText(next.getText())
  }
  const present = new Set(topLevel(sf).keys())
  for (const [name, node] of replacements) {
    if (!present.has(name) && !names.includes(name)) {
      sf.addStatements(node.getText())
      present.add(name)
    }
  }
  for (const declaration of replacement.getImportDeclarations()) {
    sf.insertStatements(0, declaration.getText())
  }
  return sf.getFullText()
}

/** Removes unused imports and merges imports of the same module. */
export function tidyImports(text: string): string {
  const sf = parseSource(text, "tidy.tsx")
  // Identifiers of the code, so comments and attribute names such as
  // `data-toast-trigger` do not keep an import (`toast`).
  const identifiers = new Set(
    sf
      .getStatements()
      .filter((statement) => !Node.isImportDeclaration(statement))
      .flatMap((statement) =>
        statement.getDescendantsOfKind(SyntaxKind.Identifier)
      )
      .map((identifier) => identifier.getText())
  )
  const used = (local: string) => identifiers.has(local)
  const byModule = new Map<
    string,
    {
      default?: string
      namespace?: string
      named: Set<string>
      typeOnly: boolean
    }
  >()
  for (const declaration of sf.getImportDeclarations()) {
    const module = declaration.getModuleSpecifierValue()
    const entry = byModule.get(module) ?? {
      named: new Set<string>(),
      typeOnly: declaration.isTypeOnly(),
    }
    entry.typeOnly &&= declaration.isTypeOnly()
    const defaultImport = declaration.getDefaultImport()?.getText()
    if (defaultImport && used(defaultImport)) entry.default = defaultImport
    const namespace = declaration.getNamespaceImport()?.getText()
    if (namespace && used(namespace)) entry.namespace = namespace
    for (const specifier of declaration.getNamedImports()) {
      const local = specifier.getAliasNode()?.getText() ?? specifier.getName()
      if (used(local)) entry.named.add(specifier.getText())
    }
    byModule.set(module, entry)
    declaration.remove()
  }
  const imports = [...byModule]
    .filter(([, e]) => e.default || e.namespace || e.named.size > 0)
    .map(([module, e]) => {
      const parts = [
        e.default,
        e.namespace ? `* as ${e.namespace}` : undefined,
        e.named.size > 0 ? `{ ${[...e.named].join(", ")} }` : undefined,
      ].filter(Boolean)
      return `import ${e.typeOnly ? "type " : ""}${parts.join(", ")} from ${JSON.stringify(module)}`
    })
  return `${imports.join("\n")}\n\n${sf.getFullText().trimStart()}`
}

/**
 * Removes top-level functions and where other functions render them
 * (`<Name />`): the sections of a registry example that need React.
 */
export function dropFunctions(text: string, names: readonly string[]): string {
  const sf = parseSource(text, "drop.tsx")
  const dropped = new Set(names)
  // Also drop what uses a dropped declaration other than by rendering it.
  for (let changed = true; changed; ) {
    changed = false
    for (const [name, node] of topLevel(sf)) {
      if (dropped.has(name)) continue
      const uses = node
        .getDescendantsOfKind(SyntaxKind.Identifier)
        .some((identifier) => {
          if (!dropped.has(identifier.getText())) return false
          const parent = identifier.getParent()
          return !(
            Node.isJsxSelfClosingElement(parent) &&
            parent.getTagNameNode() === identifier
          )
        })
      if (uses) {
        dropped.add(name)
        changed = true
      }
    }
  }
  for (const element of sf
    .getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    .reverse()) {
    if (dropped.has(element.getTagNameNode().getText())) {
      element.replaceWithText("{null}")
    }
  }
  for (const [name, node] of topLevel(sf)) {
    if (dropped.has(name) && !node.wasForgotten()) node.remove()
  }
  return sf.getFullText()
}
