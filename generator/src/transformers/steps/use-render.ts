import {
  type CallExpression,
  Node,
  type ObjectLiteralExpression,
  SyntaxKind,
} from "ts-morph"
import {
  type TransformContext,
  TransformError,
  type TransformStep,
} from "../context"

function propertyInitializer(
  ctx: TransformContext,
  object: ObjectLiteralExpression,
  name: string
): Node | undefined {
  const property = object.getProperty(name)
  if (!property) return undefined
  if (Node.isShorthandPropertyAssignment(property))
    return property.getNameNode()
  if (Node.isPropertyAssignment(property))
    return property.getInitializerOrThrow()
  throw new TransformError(ctx, "use-render", `unsupported ${name} property`)
}

function attribute(name: string, value: Node): string {
  return Node.isStringLiteral(value)
    ? `${name}=${JSON.stringify(value.getLiteralValue())}`
    : `${name}={${value.getText()}}`
}

/** Attributes for the object literals and spreads passed to `mergeProps(...)`. */
function mergePropsAttributes(ctx: TransformContext, call: Node): string[] {
  if (
    !Node.isCallExpression(call) ||
    call.getExpression().getText() !== "mergeProps"
  ) {
    throw new TransformError(
      ctx,
      "use-render",
      "props must be a mergeProps(...) call"
    )
  }
  const attributes: string[] = []
  for (const arg of call.getArguments()) {
    if (!Node.isObjectLiteralExpression(arg)) {
      attributes.push(`{...${arg.getText()}}`)
      continue
    }
    for (const property of arg.getProperties()) {
      if (Node.isPropertyAssignment(property)) {
        attributes.push(
          attribute(property.getName(), property.getInitializerOrThrow())
        )
      } else if (Node.isShorthandPropertyAssignment(property)) {
        attributes.push(`${property.getName()}={${property.getName()}}`)
      } else if (Node.isSpreadAssignment(property)) {
        attributes.push(`{...${property.getExpression().getText()}}`)
      } else {
        throw new TransformError(
          ctx,
          "use-render",
          `unsupported props member ${property.getText()}`
        )
      }
    }
  }
  return attributes
}

/**
 * `useRender({ defaultTagName, props: mergeProps(...), render, state })` becomes
 * a plain intrinsic element. Base UI renders each state entry as a
 * `data-<key>` attribute; state values are assumed to be strings. The `render`
 * prop (element replacement) is not supported and is dropped.
 */
function toJsx(ctx: TransformContext, call: CallExpression): string {
  const [options] = call.getArguments()
  if (!options || !Node.isObjectLiteralExpression(options)) {
    throw new TransformError(ctx, "use-render", "expected an options object")
  }
  const tag = propertyInitializer(ctx, options, "defaultTagName")
  if (!tag || !Node.isStringLiteral(tag)) {
    throw new TransformError(
      ctx,
      "use-render",
      "defaultTagName must be a string literal"
    )
  }
  const attributes: string[] = []
  const state = propertyInitializer(ctx, options, "state")
  if (state) {
    if (!Node.isObjectLiteralExpression(state)) {
      throw new TransformError(
        ctx,
        "use-render",
        "state must be an object literal"
      )
    }
    for (const property of state.getProperties()) {
      if (
        !Node.isPropertyAssignment(property) &&
        !Node.isShorthandPropertyAssignment(property)
      ) {
        throw new TransformError(
          ctx,
          "use-render",
          `unsupported state member ${property.getText()}`
        )
      }
      const value = Node.isPropertyAssignment(property)
        ? property.getInitializerOrThrow()
        : property.getNameNode()
      attributes.push(
        attribute(`data-${property.getName().toLowerCase()}`, value)
      )
    }
  }
  const props = propertyInitializer(ctx, options, "props")
  if (props) attributes.push(...mergePropsAttributes(ctx, props))
  return `<${tag.getLiteralValue()} ${attributes.join(" ")} />`
}

export const useRenderStep: TransformStep = {
  name: "use-render",
  run(ctx) {
    const calls = ctx.sf
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter((call) => call.getExpression().getText() === "useRender")
    for (const call of calls.reverse()) {
      const jsx = toJsx(ctx, call)
      ctx.log.push(`use-render: ${jsx}`)
      call.replaceWithText(jsx)
    }
  },
}
