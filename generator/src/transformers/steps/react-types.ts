import { Node, SyntaxKind, type TypeNode } from "ts-morph"
import {
  type TransformContext,
  TransformError,
  type TransformStep,
} from "../context"

// Refs are not supported (docs/adr/0007), so the `WithRef` variant maps the same way.
const COMPONENT_PROPS = new Set([
  "React.ComponentProps",
  "React.ComponentPropsWithoutRef",
  "React.ComponentPropsWithRef",
  "useRender.ComponentProps",
])

/** Tags of the `useRender.ComponentProps<"x">` members of an intersection. */
function renderTags(members: TypeNode[]): Set<string> {
  const tags = new Set<string>()
  for (const member of members) {
    if (
      Node.isTypeReference(member) &&
      member.getTypeName().getText() === "useRender.ComponentProps"
    ) {
      const tag = member.getTypeArguments()[0]?.getText()
      if (tag) tags.add(tag)
    }
  }
  return tags
}

/** `React.ComponentProps<"x">` next to `useRender.ComponentProps<"x">`. */
function isRedundant(member: TypeNode, tags: Set<string>): boolean {
  return (
    Node.isTypeReference(member) &&
    member.getTypeName().getText() === "React.ComponentProps" &&
    tags.has(member.getTypeArguments()[0]?.getText() ?? "")
  )
}

/**
 * Drops `React.ComponentProps<"x">` next to `useRender.ComponentProps<"x">`
 * (upstream's Sidebar parts). It adds nothing, and translated it would forbid
 * the `render` prop that the other one allows.
 */
function dropRedundantComponentProps(ctx: TransformContext): void {
  for (;;) {
    const intersection = ctx.sf
      .getDescendantsOfKind(SyntaxKind.IntersectionType)
      .find((node) => {
        const members = node.getTypeNodes()
        const tags = renderTags(members)
        return members.some((member) => isRedundant(member, tags))
      })
    if (!intersection) return
    const members = intersection.getTypeNodes()
    const tags = renderTags(members)
    intersection.replaceWithText(
      members
        .filter((member) => !isRedundant(member, tags))
        .map((member) => member.getText())
        .join(" & ")
    )
    ctx.log.push("react-types: dropped React.ComponentProps next to useRender")
  }
}

/** Rewrites React type references (including the global `React` namespace) to Hono JSX types. */
export const reactTypes: TransformStep = {
  name: "react-types",
  run(ctx) {
    dropRedundantComponentProps(ctx)
    const refs = ctx.sf.getDescendantsOfKind(SyntaxKind.TypeReference)
    for (const ref of refs.reverse()) {
      const name = ref.getTypeName().getText()
      if (COMPONENT_PROPS.has(name)) {
        const args = ref.getTypeArguments()
        const [arg] = args
        // Props of another component: generated components are plain functions.
        if (args.length === 1 && arg?.getKind() === SyntaxKind.TypeQuery) {
          const query = arg.getText()
          ref.replaceWithText(`Parameters<${query}>[0]`)
          ctx.log.push(`react-types: ${name}<${query}>`)
          continue
        }
        if (args.length !== 1 || arg?.getKind() !== SyntaxKind.LiteralType) {
          throw new TransformError(
            ctx,
            "react-types",
            `${ref.getText()} needs one intrinsic tag argument`
          )
        }
        if (name === "useRender.ComponentProps") {
          // Base UI's render prop is supported (docs/adr/0018).
          ref.replaceWithText(`ComponentProps<${arg.getText()}, RenderProp>`)
          ctx.needsRender = true
        } else {
          ref.getTypeName().replaceWithText("ComponentProps")
        }
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
