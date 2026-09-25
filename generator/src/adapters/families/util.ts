import {
  type JsxOpeningElement,
  type JsxSelfClosingElement,
  Node,
  type ParameterDeclaration,
  SyntaxKind,
} from "ts-morph"
import { parseSource } from "../../analyzer/source"
import {
  type TransformContext,
  TransformError,
} from "../../transformers/context"

export interface PartElement {
  part: string
  /** Attribute texts, in order, minus any names passed to `without`. */
  attributes(without?: readonly string[]): string[]
  /** Initializer text of an attribute (`{expr}` without braces, or a quoted string). */
  attribute(name: string): string | null
  /** Text of the JSX children (empty for self-closing elements). */
  children: string
  /** Text of the only child when it is a single element (ignoring whitespace), else null. */
  soleElementChild: string | null
  /** Name of the enclosing function component. */
  component: string
  /** Replaces the whole element; non-JSX text is wrapped in `{}` among JSX children. */
  replace(text: string): void
  /** The `className` string, or the first string passed to `cn(...)` in it; null if neither. */
  classes(): string | null
  /**
   * Rewrites that string with \`map\` and, for \`cn(...)\`, inserts \`prepend\`
   * strings before it. Must be called before \`attributes()\`.
   */
  mapClasses(
    map: (classes: string) => string,
    prepend?: readonly string[]
  ): void
}

function classCall(element: JsxOpeningElement | JsxSelfClosingElement) {
  const attr = element
    .getAttributes()
    .find(
      (a) => Node.isJsxAttribute(a) && a.getNameNode().getText() === "className"
    )
  if (!attr || !Node.isJsxAttribute(attr)) return null
  const value = attr.getInitializer()
  if (Node.isStringLiteral(value)) return { call: undefined, first: value }
  const call = Node.isJsxExpression(value) ? value.getExpression() : undefined
  if (
    !call ||
    !Node.isCallExpression(call) ||
    call.getExpression().getText() !== "cn"
  ) {
    return null
  }
  const [first] = call.getArguments()
  return first && Node.isStringLiteral(first) ? { call, first } : null
}

/** Splits `a:b:[c:d]` into variants and utility, ignoring `:` inside brackets. */
export function splitVariants(token: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ""
  for (const char of token) {
    if (char === "[" || char === "(") depth++
    if (char === "]" || char === ")") depth--
    if (char === ":" && depth === 0) {
      parts.push(current)
      current = ""
    } else {
      current += char
    }
  }
  parts.push(current)
  return parts
}

function tagOf(element: JsxOpeningElement | JsxSelfClosingElement): string {
  return element.getTagNameNode().getText()
}

/** The first `cn(...)` string of every `<local.Part>` element, in document order. */
export function partClasses(
  ctx: TransformContext,
  local: string,
  part: string
): string[] {
  return ctx.sf
    .getDescendants()
    .filter(
      (n): n is JsxOpeningElement | JsxSelfClosingElement =>
        (Node.isJsxOpeningElement(n) || Node.isJsxSelfClosingElement(n)) &&
        tagOf(n) === `${local}.${part}`
    )
    .map((e) => classCall(e)?.first.getLiteralValue())
    .filter((c) => c !== undefined)
}

/**
 * Rewrites every class string in the file: `className="..."` attributes,
 * string arguments of `cn(...)`, and strings inside `cva(...)` definitions.
 */
export function mapFileClasses(
  ctx: TransformContext,
  map: (classes: string) => string
): void {
  const literals = ctx.sf
    .getDescendantsOfKind(SyntaxKind.StringLiteral)
    .filter((literal) => {
      const parent = literal.getParent()
      if (Node.isJsxAttribute(parent)) {
        return parent.getNameNode().getText() === "className"
      }
      if (
        Node.isCallExpression(parent) &&
        parent.getExpression().getText() === "cn"
      ) {
        return true
      }
      const call = literal.getFirstAncestorByKind(SyntaxKind.CallExpression)
      return call?.getExpression().getText() === "cva"
    })
  for (const literal of literals.reverse()) {
    literal.setLiteralValue(map(literal.getLiteralValue()))
  }
}

/** Visits `<local.Part>` elements one at a time (re-querying after each replacement). */
export function forEachPart(
  ctx: TransformContext,
  local: string,
  visit: (element: PartElement) => void
): void {
  const find = () =>
    [
      ...ctx.sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
      ...ctx.sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ].find((e) => tagOf(e) === local || tagOf(e).startsWith(`${local}.`))
  for (let element = find(); element; element = find()) {
    // "" for the local itself (`<RadioGroup>`), else the part name.
    const part = tagOf(element).slice(local.length + 1)
    const node: Node = Node.isJsxOpeningElement(element)
      ? element.getParentIfKindOrThrow(SyntaxKind.JsxElement)
      : element
    const opening = element
    const children = Node.isJsxElement(node)
      ? node
          .getJsxChildren()
          .map((c) => c.getText())
          .join("")
      : ""
    const meaningful = Node.isJsxElement(node)
      ? node
          .getJsxChildren()
          .filter(
            (c) => !(Node.isJsxText(c) && c.containsOnlyTriviaWhiteSpaces())
          )
      : []
    const [only] = meaningful
    const soleElementChild =
      meaningful.length === 1 &&
      only &&
      (Node.isJsxElement(only) || Node.isJsxSelfClosingElement(only))
        ? only.getText()
        : null
    const fn = node.getFirstAncestor(
      (a) => Node.isFunctionDeclaration(a) || Node.isArrowFunction(a)
    )
    const component =
      fn && Node.isFunctionDeclaration(fn)
        ? (fn.getName() ?? "anonymous")
        : "anonymous"
    visit({
      part,
      children,
      soleElementChild,
      component,
      attributes: (without = []) =>
        opening
          .getAttributes()
          .filter(
            (a) =>
              !(
                Node.isJsxAttribute(a) &&
                without.includes(a.getNameNode().getText())
              )
          )
          .map((a) => a.getText()),
      attribute: (name) => {
        const attr = opening
          .getAttributes()
          .find(
            (a) => Node.isJsxAttribute(a) && a.getNameNode().getText() === name
          )
        if (!attr || !Node.isJsxAttribute(attr)) return null
        const value = attr.getInitializer()
        if (!value) return "true"
        if (Node.isJsxExpression(value))
          return value.getExpression()?.getText() ?? null
        return value.getText()
      },
      classes: () => classCall(opening)?.first.getLiteralValue() ?? null,
      mapClasses: (map, prepend = []) => {
        const found = classCall(opening)
        if (!found || (prepend.length > 0 && !found.call))
          throw new TransformError(
            ctx,
            "families",
            `<${local}.${part}> has no ${prepend.length > 0 ? 'cn("...")' : "string"} className`
          )
        const index = found.first.getChildIndex()
        found.first.setLiteralValue(map(found.first.getLiteralValue()))
        if (found.call && prepend.length > 0)
          found.call.insertArguments(
            index,
            prepend.map((p) => JSON.stringify(p))
          )
      },
      replace: (text) => {
        const container = node.getParent()
        const wrapped =
          (Node.isJsxElement(container) || Node.isJsxFragment(container)) &&
          !text.startsWith("<")
            ? `{${text}}`
            : text
        node.replaceWithText(wrapped)
      },
    })
  }
}

/**
 * Rewrites `local.Part.Props` and `React.ComponentProps<typeof local.Part>`
 * types using `types[Part]`; unknown parts fail the build.
 */
export function replacePartTypes(
  ctx: TransformContext,
  step: string,
  local: string,
  types: Readonly<Record<string, string>>
): void {
  const refs = ctx.sf.getDescendantsOfKind(SyntaxKind.TypeReference)
  for (const ref of refs.reverse()) {
    const name = ref.getTypeName().getText()
    let part: string | undefined
    if (name === `${local}.Props`) {
      part = ""
    } else if (name.startsWith(`${local}.`) && name.endsWith(".Props")) {
      part = name.slice(local.length + 1, -".Props".length)
    } else if (
      name === "React.ComponentProps" ||
      name === "React.ComponentPropsWithRef"
    ) {
      const [arg] = ref.getTypeArguments()
      const query = arg?.isKind(SyntaxKind.TypeQuery)
        ? arg.getExprName().getText()
        : ""
      if (query === local) part = ""
      else if (query.startsWith(`${local}.`))
        part = query.slice(local.length + 1)
    }
    if (part === undefined) continue
    const type = types[part]
    if (!type)
      throw new TransformError(
        ctx,
        step,
        `no type mapping for ${local}.${part}`
      )
    const parent = ref.getParent()
    // `React.ComponentPropsWithRef<typeof P.X> & P.X.Props` maps to one type.
    if (
      Node.isIntersectionTypeNode(parent) &&
      parent
        .getTypeNodes()
        .some((node) => node !== ref && node.getText() === type)
    ) {
      parent.replaceWithText(
        parent
          .getTypeNodes()
          .filter((node) => node !== ref)
          .map((node) => node.getText())
          .join(" & ")
      )
      continue
    }
    ref.replaceWithText(type)
  }
}

/** Adds missing bindings before the rest element of the component's props pattern. */
export function ensureBindings(
  ctx: TransformContext,
  step: string,
  component: string,
  bindings: readonly [prop: string, text: string][]
): void {
  const fn = ctx.sf.getFunction(component)
  const param = fn?.getParameters()[0] as ParameterDeclaration | undefined
  const pattern = param?.getNameNode()
  if (!pattern || !Node.isObjectBindingPattern(pattern)) {
    throw new TransformError(
      ctx,
      step,
      `${component} must destructure its props`
    )
  }
  const elements = pattern.getElements()
  const present = new Set(
    elements.map((e) => e.getPropertyNameNode()?.getText() ?? e.getName())
  )
  const added = bindings
    .filter(([prop]) => !present.has(prop))
    .map(([, text]) => text)
  if (added.length === 0) return
  const rest = elements
    .filter((e) => e.getDotDotDotToken())
    .map((e) => e.getText())
  const kept = elements
    .filter((e) => !e.getDotDotDotToken())
    .map((e) => e.getText())
  pattern.replaceWithText(`{ ${[...kept, ...added, ...rest].join(", ")} }`)
}

/** Inserts file-local helper statements after the imports. */
export function insertHelpers(ctx: TransformContext, text: string): void {
  const imports = ctx.sf.getImportDeclarations()
  const last = imports[imports.length - 1]
  ctx.sf.insertStatements(last ? last.getChildIndex() + 1 : 0, text)
}

/** A named file-local helper (type, function or constant) a family may need. */
export interface HelperEntry {
  id: string
  text: string
}

/**
 * Splits helper source into one entry per top-level declaration (with its
 * leading comment), named after the declaration.
 */
export function helperEntries(text: string): HelperEntry[] {
  return parseSource(text, "helpers.tsx")
    .getStatements()
    .map((statement) => {
      const name = Node.isVariableStatement(statement)
        ? statement.getDeclarations()[0]?.getName()
        : Node.isFunctionDeclaration(statement) ||
            Node.isInterfaceDeclaration(statement) ||
            Node.isTypeAliasDeclaration(statement)
          ? statement.getName()
          : undefined
      if (!name)
        throw new Error(`helper without a name: ${statement.getText()}`)
      return { id: name, text: statement.getFullText().trim() }
    })
}

/** Offers helpers to the file; `insertReferencedHelpers` adds those it uses. */
export function registerHelpers(
  ctx: TransformContext,
  entries: readonly HelperEntry[]
): void {
  ctx.helperEntries ??= []
  for (const entry of entries) {
    if (!ctx.helperEntries.some((e) => e.id === entry.id)) {
      ctx.helperEntries.push(entry)
    }
  }
}

/** \`hono/jsx\` exports helpers may use. */
const HONO_VALUES = [
  "createContext",
  "useContext",
  "useId",
  "isValidElement",
  "cloneElement",
]
const HONO_TYPES = ["Child", "JSX", "JSXNode", "Context"] as const

/**
 * Inserts the registered helpers the file references, transitively, in
 * registration order, and the \`hono/jsx\` imports they need. Unused helpers
 * are left out, so generated files have no unused declarations.
 */
export function insertReferencedHelpers(ctx: TransformContext): void {
  const entries = ctx.helperEntries ?? []
  const refers = (text: string, id: string) =>
    new RegExp(`(^|[^\\w$])${id.replace(/\$/g, "\\$")}([^\\w$]|$)`).test(text)
  const included = new Set<string>()
  let corpus = ctx.sf.getFullText()
  for (let changed = true; changed; ) {
    changed = false
    for (const entry of entries) {
      if (included.has(entry.id) || !refers(corpus, entry.id)) continue
      included.add(entry.id)
      corpus += `\n${entry.text}`
      changed = true
    }
  }
  const texts = entries.filter((e) => included.has(e.id)).map((e) => e.text)
  if (texts.length === 0) return
  insertHelpers(ctx, texts.join("\n\n"))
  const inserted = texts.join("\n")
  for (const value of HONO_VALUES) {
    if (new RegExp(`\\b${value}\\s*[<(]`).test(inserted))
      ctx.honoValues.add(value)
  }
  for (const type of HONO_TYPES) {
    if (new RegExp(`\\b${type}\\b`).test(inserted)) ctx.honoTypes.add(type)
  }
  ctx.helperEntries = []
}
