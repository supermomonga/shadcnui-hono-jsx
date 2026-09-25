import { SyntaxKind } from "ts-morph"
import { findFamilyRule } from "../../adapters/families"
import { insertReferencedHelpers } from "../../adapters/families/util"
import type { TransformContext, TransformStep } from "../context"

/** Applies family rules (compound Base UI primitives) imported by the file. */
export const families: TransformStep = {
  name: "families",
  run(ctx) {
    let applied = false
    for (const decl of ctx.sf.getImportDeclarations()) {
      const module = decl.getModuleSpecifierValue()
      if (!module.startsWith("@base-ui/")) continue
      for (const named of decl.getNamedImports()) {
        const rule = findFamilyRule(module, named.getName())
        if (rule) {
          rule.transform(
            ctx,
            named.getAliasNode()?.getText() ?? named.getName()
          )
          applied = true
        }
      }
    }
    if (applied) {
      insertReferencedHelpers(ctx)
      pruneUnusedIcons(ctx)
    }
  },
}

/**
 * Removes inlined icons that only appeared in parts a family dropped (for
 * example a select's scroll arrows), and the shared icon helper when no icon
 * is left.
 */
function pruneUnusedIcons(ctx: TransformContext): void {
  const used = new Set(
    [
      ...ctx.sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
      ...ctx.sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
    ].map((element) => element.getTagNameNode().getText())
  )
  for (const fn of ctx.sf.getFunctions()) {
    const doc = fn.getJsDocs()[0]?.getDescription() ?? ""
    const lucide = doc.match(/^\s*Lucide `([a-z0-9-]+)` icon/)?.[1]
    const name = fn.getName()
    if (!lucide || !name || used.has(name)) continue
    fn.remove()
    ctx.icons.delete(lucide)
    ctx.log.push(`families: dropped unused icon ${name}`)
  }
  if (ctx.icons.size === 0) ctx.sf.getFunction("hasA11yProp")?.remove()
}
