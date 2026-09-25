import { Node, SyntaxKind } from "ts-morph"
import { isProhibitedModule } from "../../policy"
import { TransformError, type TransformStep } from "../context"

/** Fails loudly when translation left React or Base UI constructs behind. */
export const guard: TransformStep = {
  name: "guard",
  run(ctx) {
    const fail = (message: string): never => {
      throw new TransformError(ctx, "guard", message)
    }
    const imported: string[] = []
    for (const decl of ctx.sf.getImportDeclarations()) {
      const module = decl.getModuleSpecifierValue()
      if (isProhibitedModule(module)) fail(`prohibited import ${module}`)
      if (module.startsWith("@/")) fail(`unresolved alias import ${module}`)
      if (module.startsWith(".")) {
        if (!/^\.\/[a-z0-9-]+$/.test(module))
          fail(`unexpected relative import ${module}`)
        imported.push(
          ...decl
            .getNamedImports()
            .map((n) => n.getAliasNode()?.getText() ?? n.getName())
        )
      }
    }
    for (const statement of ctx.sf.getStatements()) {
      if (!Node.isExpressionStatement(statement)) break
      if (Node.isStringLiteral(statement.getExpression()))
        fail("directive left behind")
    }
    for (const id of ctx.sf.getDescendantsOfKind(SyntaxKind.Identifier)) {
      const text = id.getText()
      if (text === "React") fail("React reference left behind")
      if (text === "useRender" || text === "mergeProps")
        fail(`${text} left behind`)
    }
    for (const attr of ctx.sf.getDescendantsOfKind(SyntaxKind.JsxAttribute)) {
      if (attr.getNameNode().getText() === "className")
        fail("className attribute left behind")
    }
    const declared = new Set([
      ...imported,
      ...ctx.sf.getFunctions().map((f) => f.getName()),
      ...ctx.sf.getVariableDeclarations().map((v) => v.getName()),
    ])
    for (const element of [
      ...ctx.sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
      ...ctx.sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
    ]) {
      const tag = element.getTagNameNode().getText()
      // `Context.Provider` resolves through its object (`Context`).
      const root = tag.split(".")[0] ?? tag
      if (!/^[a-z]/.test(tag) && !declared.has(root))
        fail(`unresolved JSX element <${tag}>`)
    }
    const exported = [...ctx.sf.getExportedDeclarations().keys()].sort()
    if (exported.join() !== ctx.facts.exports.join()) {
      fail(
        `exports changed: ${ctx.facts.exports.join(", ")} -> ${exported.join(", ")}`
      )
    }
  },
}
