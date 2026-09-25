import { findFamilyRule } from "../../adapters/families"
import type { TransformStep } from "../context"

/** Applies family rules (compound Base UI primitives) imported by the file. */
export const families: TransformStep = {
  name: "families",
  run(ctx) {
    for (const decl of ctx.sf.getImportDeclarations()) {
      const module = decl.getModuleSpecifierValue()
      if (!module.startsWith("@base-ui/")) continue
      for (const named of decl.getNamedImports()) {
        const rule = findFamilyRule(module, named.getName())
        if (rule)
          rule.transform(
            ctx,
            named.getAliasNode()?.getText() ?? named.getName()
          )
      }
    }
  },
}
