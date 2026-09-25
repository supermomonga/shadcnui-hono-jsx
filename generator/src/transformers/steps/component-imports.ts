import { REGISTRY_UI_IMPORT } from "../../analyzer/classify"
import type { TransformStep } from "../context"

/**
 * Imports of other upstream components (`@/registry/<style>/ui/<name>`) become
 * `./<name>`: every generated component installs into the same directory, and
 * universal registry items are not rewritten by the shadcn CLI.
 */
export const componentImports: TransformStep = {
  name: "component-imports",
  run(ctx) {
    for (const decl of ctx.sf.getImportDeclarations()) {
      const name = decl.getModuleSpecifierValue().match(REGISTRY_UI_IMPORT)?.[1]
      if (!name) continue
      decl.setModuleSpecifier(`./${name}`)
      ctx.log.push(`component-imports: ${name}`)
    }
  },
}
