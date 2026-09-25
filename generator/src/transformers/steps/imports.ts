import type { TransformStep } from "../context"

/** Drops React and Base UI imports and adds the required `hono/jsx` type imports. */
export const imports: TransformStep = {
  name: "imports",
  run(ctx) {
    for (const decl of ctx.sf.getImportDeclarations()) {
      const module = decl.getModuleSpecifierValue()
      if (
        module === "react" ||
        module.startsWith("@base-ui/") ||
        module.includes("icon-placeholder")
      ) {
        ctx.log.push(`imports: remove ${module}`)
        decl.remove()
      }
    }
    if (ctx.honoValues.size > 0) {
      const existing = ctx.sf
        .getImportDeclarations()
        .find(
          (d) => d.getModuleSpecifierValue() === "hono/jsx" && !d.isTypeOnly()
        )
      const names = [...ctx.honoValues].sort()
      if (existing) {
        const present = new Set(
          existing.getNamedImports().map((n) => n.getName())
        )
        existing.addNamedImports(names.filter((n) => !present.has(n)))
      } else {
        ctx.sf.insertImportDeclaration(0, {
          moduleSpecifier: "hono/jsx",
          namedImports: names,
        })
      }
      ctx.log.push(`imports: hono/jsx values ${names.join(", ")}`)
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
