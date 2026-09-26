/**
 * Direction: upstream re-exports Base UI's `DirectionProvider` and
 * `useDirection`. They only carry the text direction through React context
 * (the provider renders no element), so the step replaces the re-export with
 * the same two exports on a Hono context. It fails when upstream changes the
 * re-export.
 */
import { TransformError, type TransformStep } from "../../transformers/context"
import type { ComponentAdapter } from "./types"

const MODULE = "@base-ui/react/direction-provider"
const EXPORTS = ["DirectionProvider", "useDirection"]

const IMPLEMENTATION = `type TextDirection = "ltr" | "rtl"

const DirectionContext = createContext<TextDirection>("ltr")

/**
 * The text direction for the components inside, like Base UI's provider (it
 * renders no element: set \`dir\` on an element as well).
 */
function DirectionProvider({
  direction = "ltr",
  children,
}: {
  direction?: TextDirection | undefined
  children?: Child
}) {
  return <DirectionContext.Provider value={direction}>{children}</DirectionContext.Provider>
}

/** The text direction set by the nearest \`DirectionProvider\` (\`ltr\` by default). */
function useDirection(): TextDirection {
  return useContext(DirectionContext)
}

export { DirectionProvider, useDirection }
`

const replaceReexport: TransformStep = {
  name: "direction:provider",
  run(ctx) {
    const declarations = ctx.sf.getExportDeclarations()
    const [reexport] = declarations
    const names = reexport?.getNamedExports().map((e) => e.getName()) ?? []
    if (
      declarations.length !== 1 ||
      !reexport ||
      reexport.getModuleSpecifierValue() !== MODULE ||
      names.join() !== EXPORTS.join()
    ) {
      throw new TransformError(
        ctx,
        this.name,
        `expected only \`export { ${EXPORTS.join(", ")} } from "${MODULE}"\`; update this adapter`
      )
    }
    reexport.replaceWithText(IMPLEMENTATION)
    ctx.honoValues.add("createContext")
    ctx.honoValues.add("useContext")
    ctx.honoTypes.add("Child")
    ctx.log.push(`${this.name}: DirectionProvider on a Hono context`)
  },
}

export const directionAdapter: ComponentAdapter = {
  kind: "custom",
  resolves: EXPORTS.map(
    (name) => `base-ui-primitive-unmapped:${MODULE}#${name}`
  ),
  notes: [
    "`DirectionProvider` carries the direction through Hono context and renders no element, like Base UI; set `dir` on an element too. The generated components follow the CSS direction, so they do not need it.",
  ],
  steps: [{ after: "remove-directives", step: replaceReexport }],
}
