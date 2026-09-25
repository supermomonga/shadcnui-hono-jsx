import { SyntaxKind } from "ts-morph"
import type { TransformStep } from "../context"

/** React context APIs with identical `hono/jsx` equivalents. */
export const CONTEXT_APIS = new Set(["createContext", "useContext"])

/**
 * `React.createContext`/`React.useContext` (or named imports of them) become
 * the `hono/jsx` functions of the same name, which behave the same when
 * rendering on the server.
 */
export const reactContext: TransformStep = {
  name: "react-context",
  run(ctx) {
    const refs = ctx.sf
      .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
      .filter(
        (access) =>
          access.getExpression().getText() === "React" &&
          CONTEXT_APIS.has(access.getName())
      )
    for (const access of refs.reverse()) {
      const name = access.getName()
      access.replaceWithText(name)
      ctx.honoValues.add(name)
      ctx.log.push(`react-context: React.${name}`)
    }
    for (const decl of ctx.sf.getImportDeclarations()) {
      if (decl.getModuleSpecifierValue() !== "react") continue
      for (const named of decl.getNamedImports()) {
        if (CONTEXT_APIS.has(named.getName()) && !named.getAliasNode()) {
          ctx.honoValues.add(named.getName())
          ctx.log.push(`react-context: ${named.getName()}`)
        }
      }
    }
  },
}
