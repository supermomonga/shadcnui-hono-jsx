import {
  type JsxOpeningElement,
  type JsxSelfClosingElement,
  Node,
  SyntaxKind,
} from "ts-morph"
import {
  findPrimitiveRule,
  type PrimitiveRule,
} from "../../adapters/primitives/base-ui"
import {
  type TransformContext,
  TransformError,
  type TransformStep,
} from "../context"

function resolvePrimitives(ctx: TransformContext): void {
  for (const decl of ctx.sf.getImportDeclarations()) {
    const module = decl.getModuleSpecifierValue()
    if (!module.startsWith("@base-ui/")) continue
    for (const named of decl.getNamedImports()) {
      const rule = findPrimitiveRule(module, named.getName())
      if (rule)
        ctx.primitives.set(
          named.getAliasNode()?.getText() ?? named.getName(),
          rule
        )
    }
  }
}

/** `<Local>.Props` -> the rule's props type. */
function rewritePropsTypes(ctx: TransformContext): void {
  const refs = ctx.sf.getDescendantsOfKind(SyntaxKind.TypeReference)
  for (const ref of refs.reverse()) {
    const typeName = ref.getTypeName()
    if (!Node.isQualifiedName(typeName)) continue
    const rule = ctx.primitives.get(typeName.getLeft().getText())
    if (!rule) continue
    if (typeName.getRight().getText() !== "Props") {
      throw new TransformError(
        ctx,
        "primitives",
        `unsupported type ${typeName.getText()}`
      )
    }
    const original = typeName.getText()
    const parent = ref.getParent()
    const bare =
      Node.isIntersectionTypeNode(parent) || Node.isParameterDeclaration(parent)
    ref.replaceWithText(bare ? rule.propsType : `(${rule.propsType})`)
    ctx.needsComponentProps = true
    ctx.log.push(`primitives: ${original} -> ${rule.propsType}`)
  }
}

function rewriteAttributes(
  ctx: TransformContext,
  element: JsxOpeningElement | JsxSelfClosingElement,
  rule: PrimitiveRule
): string {
  const pieces: string[] = []
  let spread: string | null = null
  let insertAt = -1
  const explicit = new Set<string>()
  for (const attr of element.getAttributes()) {
    if (Node.isJsxSpreadAttribute(attr)) {
      if (spread === null) {
        spread = attr.getExpression().getText()
        insertAt = pieces.length
      }
      pieces.push(attr.getText())
      continue
    }
    const name = attr.getNameNode().getText()
    explicit.add(name)
    const targets = rule.propAttrs?.[name]
    if (targets) {
      const value = attr.getInitializer()?.getText() ?? "{true}"
      for (const target of targets) pieces.push(`${target}=${value}`)
    } else {
      pieces.push(attr.getText())
    }
  }
  for (const prop of Object.keys(rule.propAttrs ?? {})) {
    if (!explicit.has(prop)) {
      throw new TransformError(
        ctx,
        "primitives",
        `${rule.exportName}: prop "${prop}" must be passed explicitly so it can be mapped to attributes`
      )
    }
  }
  const injected = Object.entries({ ...rule.staticAttrs, ...rule.defaultAttrs })
    .filter(([name]) => !explicit.has(name))
    .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
  for (const { prop, attr } of rule.stateAttrs ?? []) {
    if (explicit.has(attr)) continue
    if (spread === null) {
      throw new TransformError(
        ctx,
        "primitives",
        `${rule.exportName}: no props spread for state attribute ${attr}`
      )
    }
    injected.push(`${attr}={${spread}.${prop} ? "" : undefined}`)
  }
  // Injected attributes precede the props spread so callers can override them.
  pieces.splice(insertAt === -1 ? pieces.length : insertAt, 0, ...injected)
  return pieces.join(" ")
}

function nextPrimitiveElement(ctx: TransformContext) {
  return [
    ...ctx.sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...ctx.sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ].find((element) => ctx.primitives.has(element.getTagNameNode().getText()))
}

/** Replaces mapped Base UI primitives with intrinsic elements and their SSR attributes. */
export const primitivesStep: TransformStep = {
  name: "primitives",
  run(ctx) {
    resolvePrimitives(ctx)
    if (ctx.primitives.size === 0) return
    rewritePropsTypes(ctx)

    for (
      let element = nextPrimitiveElement(ctx);
      element;
      element = nextPrimitiveElement(ctx)
    ) {
      const local = element.getTagNameNode().getText()
      const rule = ctx.primitives.get(local) as PrimitiveRule
      const attributes = rewriteAttributes(ctx, element, rule)
      if (Node.isJsxSelfClosingElement(element)) {
        element.replaceWithText(`<${rule.tag} ${attributes} />`)
      } else {
        const parent = element.getParentIfKindOrThrow(SyntaxKind.JsxElement)
        parent.getClosingElement().replaceWithText(`</${rule.tag}>`)
        const opening = parent.getOpeningElement()
        opening.replaceWithText(`<${rule.tag} ${attributes}>`)
      }
      ctx.log.push(`primitives: <${local}> -> <${rule.tag}>`)
    }
  },
}
