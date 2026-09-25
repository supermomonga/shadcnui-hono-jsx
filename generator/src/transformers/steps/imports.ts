import type { TransformStep } from "../context"

/** Drops React and Base UI imports and adds the required `hono/jsx` type imports. */
export const imports: TransformStep = {
  name: "imports",
  run(ctx) {
    for (const decl of ctx.sf.getImportDeclarations()) {
      const module = decl.getModuleSpecifierValue()
      if (module === "react" || module.startsWith("@base-ui/")) {
        ctx.log.push(`imports: remove ${module}`)
        decl.remove()
      }
    }
    if (ctx.honoTypes.size > 0) {
      ctx.sf.insertImportDeclaration(0, {
        isTypeOnly: true,
        moduleSpecifier: "hono/jsx",
        namedImports: [...ctx.honoTypes].sort(),
      })
      ctx.log.push(`imports: hono/jsx ${[...ctx.honoTypes].sort().join(", ")}`)
    }
  },
}
