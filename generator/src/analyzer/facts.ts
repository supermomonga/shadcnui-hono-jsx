import { Node, type SourceFile, SyntaxKind } from "ts-morph"
import type { UpstreamItem } from "../upstream/types"
import { parseSource } from "./source"

export interface ImportFact {
  module: string
  defaultName: string | null
  namespace: string | null
  named: { name: string; alias: string | null; typeOnly: boolean }[]
  typeOnly: boolean
}

export interface JsxFact {
  tag: string
  intrinsic: boolean
  attributes: string[]
}

/** Everything the classifier and transformers need to know about one upstream source file. */
export interface FileFacts {
  path: string
  type: string
  imports: ImportFact[]
  directives: string[]
  exports: string[]
  /** Qualified type names rooted at `React` (e.g. `React.ComponentProps`). */
  reactTypeRefs: string[]
  /** Runtime uses of the React namespace (e.g. `React.useState`). */
  reactValueRefs: string[]
  /** Calls to `use*` hooks other than a canonical `useRender`. */
  hookCalls: string[]
  useRender: "canonical" | "other" | null
  jsx: JsxFact[]
  /** `cn-*` placeholder classes found in string literals. */
  cnMarkers: string[]
}

export interface ComponentFacts {
  name: string
  type: string
  registryDependencies: string[]
  files: FileFacts[]
}

const uniqueSorted = (values: Iterable<string>) => [...new Set(values)].sort()

function collectImports(sf: SourceFile): ImportFact[] {
  const imports: ImportFact[] = sf.getImportDeclarations().map((decl) => ({
    module: decl.getModuleSpecifierValue(),
    defaultName: decl.getDefaultImport()?.getText() ?? null,
    namespace: decl.getNamespaceImport()?.getText() ?? null,
    named: decl.getNamedImports().map((n) => ({
      name: n.getName(),
      alias: n.getAliasNode()?.getText() ?? null,
      typeOnly: n.isTypeOnly(),
    })),
    typeOnly: decl.isTypeOnly(),
  }))
  // Re-exports (`export { X } from "m"`) depend on the module just like imports.
  for (const decl of sf.getExportDeclarations()) {
    const module = decl.getModuleSpecifierValue()
    if (module === undefined) continue
    imports.push({
      module,
      defaultName: null,
      namespace: decl.getNamespaceExport()?.getName() ?? null,
      named: decl.getNamedExports().map((n) => ({
        name: n.getName(),
        alias: n.getAliasNode()?.getText() ?? null,
        typeOnly: n.isTypeOnly(),
      })),
      typeOnly: decl.isTypeOnly(),
    })
  }
  return imports
}

function collectDirectives(sf: SourceFile): string[] {
  const directives: string[] = []
  for (const statement of sf.getStatements()) {
    if (!Node.isExpressionStatement(statement)) break
    const expression = statement.getExpression()
    if (!Node.isStringLiteral(expression)) break
    directives.push(expression.getLiteralValue())
  }
  return directives
}

function isTypePosition(node: Node): boolean {
  return node.getFirstAncestor((a) => Node.isTypeNode(a)) !== undefined
}

/**
 * `return useRender({ defaultTagName: "x", props: mergeProps(...), render, state: {...} })`
 * is the only supported shape.
 */
function useRenderShape(call: Node): "canonical" | "other" {
  if (!Node.isCallExpression(call)) return "other"
  if (!Node.isReturnStatement(call.getParent())) return "other"
  const [arg, ...rest] = call.getArguments()
  if (!arg || rest.length > 0 || !Node.isObjectLiteralExpression(arg))
    return "other"
  const allowed = new Set(["defaultTagName", "props", "render", "state"])
  for (const property of arg.getProperties()) {
    const name =
      Node.isPropertyAssignment(property) ||
      Node.isShorthandPropertyAssignment(property)
        ? property.getName()
        : null
    if (!name || !allowed.has(name)) return "other"
    if (Node.isPropertyAssignment(property)) {
      const value = property.getInitializerOrThrow()
      if (name === "defaultTagName" && !Node.isStringLiteral(value))
        return "other"
      if (name === "state" && !Node.isObjectLiteralExpression(value))
        return "other"
      if (name === "props") {
        if (
          !Node.isCallExpression(value) ||
          value.getExpression().getText() !== "mergeProps"
        ) {
          return "other"
        }
      }
    }
  }
  const tag = arg.getProperty("defaultTagName")
  return tag ? "canonical" : "other"
}

function collectFileFacts(path: string, type: string, text: string): FileFacts {
  const sf = parseSource(text, path.split("/").pop() ?? "component.tsx")
  const imports = collectImports(sf)
  const reactNamespace =
    imports.find((i) => i.module === "react")?.namespace ??
    imports.find((i) => i.module === "react")?.defaultName ??
    "React"

  const reactTypeRefs: string[] = []
  const reactValueRefs: string[] = []
  for (const node of sf.getDescendantsOfKind(SyntaxKind.QualifiedName)) {
    if (node.getLeft().getText() === reactNamespace)
      reactTypeRefs.push(node.getText())
  }
  for (const node of sf.getDescendantsOfKind(
    SyntaxKind.PropertyAccessExpression
  )) {
    if (node.getExpression().getText() !== reactNamespace) continue
    if (isTypePosition(node)) reactTypeRefs.push(node.getText())
    else reactValueRefs.push(node.getText())
  }

  const hookCalls: string[] = []
  let useRender: FileFacts["useRender"] = null
  for (const call of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const callee = call.getExpression().getText()
    const name = callee.startsWith(`${reactNamespace}.`)
      ? callee.slice(reactNamespace.length + 1)
      : callee
    if (!/^use[A-Z]/.test(name)) continue
    if (name === "useRender" && callee === "useRender") {
      const shape = useRenderShape(call)
      useRender = useRender === "other" ? "other" : shape
      continue
    }
    hookCalls.push(name)
  }

  const jsx: JsxFact[] = []
  for (const element of [
    ...sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ]) {
    const tag = element.getTagNameNode().getText()
    jsx.push({
      tag,
      intrinsic: /^[a-z]/.test(tag) && !tag.includes("."),
      attributes: element
        .getAttributes()
        .filter(Node.isJsxAttribute)
        .map((a) => a.getNameNode().getText()),
    })
  }

  const cnMarkers: string[] = []
  for (const literal of [
    ...sf.getDescendantsOfKind(SyntaxKind.StringLiteral),
    ...sf.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral),
  ]) {
    if (literal.getFirstAncestorByKind(SyntaxKind.ImportDeclaration)) continue
    for (const token of literal.getLiteralText().split(/\s+/)) {
      if (/^cn-[a-z-]+$/.test(token)) cnMarkers.push(token)
    }
  }

  return {
    path,
    type,
    imports,
    directives: collectDirectives(sf),
    exports: [...sf.getExportedDeclarations().keys()].sort(),
    reactTypeRefs: uniqueSorted(reactTypeRefs),
    reactValueRefs: uniqueSorted(reactValueRefs),
    hookCalls: uniqueSorted(hookCalls),
    useRender,
    jsx,
    cnMarkers: uniqueSorted(cnMarkers),
  }
}

export function collectFacts(item: UpstreamItem): ComponentFacts {
  return {
    name: item.name,
    type: item.type,
    registryDependencies: [...(item.registryDependencies ?? [])].sort(),
    files: (item.files ?? []).map((f) =>
      collectFileFacts(f.path, f.type, f.content)
    ),
  }
}
