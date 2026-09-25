import { SyntaxKind } from "ts-morph"
import { TransformError, type TransformStep } from "../context"

const COMPONENT_PROPS = new Set([
  "React.ComponentProps",
  "React.ComponentPropsWithoutRef",
  "useRender.ComponentProps",
])

/** Rewrites React type references (including the global `React` namespace) to Hono JSX types. */
export const reactTypes: TransformStep = {
  name: "react-types",
  run(ctx) {
    const refs = ctx.sf.getDescendantsOfKind(SyntaxKind.TypeReference)
    for (const ref of refs.reverse()) {
      const name = ref.getTypeName().getText()
      if (COMPONENT_PROPS.has(name)) {
        const args = ref.getTypeArguments()
        if (
          args.length !== 1 ||
          args[0]?.getKind() !== SyntaxKind.LiteralType
        ) {
          throw new TransformError(
            ctx,
            "react-types",
            `${ref.getText()} needs one intrinsic tag argument`
          )
        }
        ref.getTypeName().replaceWithText("ComponentProps")
        ctx.needsComponentProps = true
      } else if (name === "React.ReactNode") {
        ref.replaceWithText("Child")
        ctx.honoTypes.add("Child")
      } else if (name === "React.CSSProperties") {
        ref.replaceWithText("CSSProperties")
        ctx.honoTypes.add("CSSProperties")
      } else if (name.startsWith("React.")) {
        throw new TransformError(
          ctx,
          "react-types",
          `no Hono JSX equivalent for ${name}`
        )
      } else {
        continue
      }
      ctx.log.push(`react-types: ${name}`)
    }
  },
}
