import type { ComponentAdapter } from "../adapters/components"
import {
  BASE_UI_RENDER_HELPERS,
  findPrimitiveRule,
  type PrimitiveRule,
} from "../adapters/primitives/base-ui"
import type { ComponentFacts, FileFacts } from "./facts"
import { type Reason, reason, reasonKey, sortReasons } from "./reasons"

export type ClassificationKind =
  | "direct"
  | "native-adapter"
  | "custom-adapter"
  | "unsupported"

export interface Classification {
  kind: ClassificationKind
  reasons: Reason[]
}

/** React types with a deterministic Hono JSX equivalent. */
export const MAPPED_REACT_TYPES = new Set([
  "React.ComponentProps",
  "React.ComponentPropsWithoutRef",
  "React.ReactNode",
  "React.CSSProperties",
])

const PASSTHROUGH_MODULES = new Set(["cn", "class-variance-authority"])
const RENDER_HELPER_MODULES = new Set<string>(
  Object.values(BASE_UI_RENDER_HELPERS)
)

function fileReasons(file: FileFacts, primitives: PrimitiveRule[]): Reason[] {
  const reasons: Reason[] = []

  if (file.type !== "registry:ui") {
    reasons.push(reason("unsupported-file-type", file.type))
  }
  if (file.directives.includes("use client")) {
    reasons.push(reason("use-client-directive"))
  }

  for (const imp of file.imports) {
    const { module } = imp
    if (module === "react") {
      for (const named of imp.named) {
        if (!(imp.typeOnly || named.typeOnly)) {
          reasons.push(reason("react-runtime-api", named.name))
        }
      }
    } else if (PASSTHROUGH_MODULES.has(module)) {
      // Framework-neutral dependency kept as-is.
    } else if (RENDER_HELPER_MODULES.has(module)) {
      // Handled by the generic use-render transformer.
    } else if (module.startsWith("@base-ui/")) {
      for (const named of imp.named) {
        const rule = findPrimitiveRule(module, named.name)
        if (rule) {
          primitives.push(rule)
          reasons.push(
            reason("base-ui-primitive-mapped", `${module}#${named.name}`)
          )
        } else {
          reasons.push(
            reason("base-ui-primitive-unmapped", `${module}#${named.name}`)
          )
        }
      }
      if (imp.named.length === 0) {
        reasons.push(reason("base-ui-primitive-unmapped", module))
      }
    } else if (module.includes("icon-placeholder")) {
      reasons.push(reason("icon-placeholder"))
    } else if (module.startsWith("@/")) {
      reasons.push(reason("registry-import", module))
    } else {
      reasons.push(reason("unknown-import", module))
    }
  }

  for (const ref of file.reactValueRefs) {
    reasons.push(reason("react-runtime-api", ref))
  }
  for (const ref of file.reactTypeRefs) {
    reasons.push(
      MAPPED_REACT_TYPES.has(ref)
        ? reason("react-type-rewrite", ref)
        : reason("react-type-unmapped", ref)
    )
  }
  for (const hook of file.hookCalls) {
    reasons.push(reason("react-hook", hook))
  }
  if (file.useRender === "canonical") reasons.push(reason("base-ui-use-render"))
  if (file.useRender === "other")
    reasons.push(reason("use-render-noncanonical"))

  for (const element of file.jsx) {
    for (const attribute of element.attributes) {
      if (/^on[A-Z]/.test(attribute))
        reasons.push(reason("event-handler", attribute))
      if (attribute === "className") reasons.push(reason("classname-to-class"))
    }
  }
  for (const marker of file.cnMarkers) {
    reasons.push(reason("cn-marker", marker))
  }
  return reasons
}

/**
 * Classifies an upstream component. The result is deterministic for a given
 * facts/adapters input and is recorded in the compatibility manifest.
 */
export function classify(
  facts: ComponentFacts,
  adapters: Readonly<Record<string, ComponentAdapter>>
): Classification {
  const reasons: Reason[] = []
  const primitives: PrimitiveRule[] = []

  if (facts.files.length === 0) reasons.push(reason("no-files"))
  if (facts.files.length > 1) {
    reasons.push(reason("multi-file", String(facts.files.length)))
  }
  for (const dependency of facts.registryDependencies) {
    reasons.push(reason("registry-dependency", dependency))
  }
  for (const file of facts.files) {
    reasons.push(...fileReasons(file, primitives))
  }

  const sorted = sortReasons(reasons)
  const blocking = sorted.filter((r) => r.blocking)
  if (blocking.length > 0) {
    const adapter = adapters[facts.name]
    const resolved = (r: Reason) =>
      adapter?.resolves.includes(reasonKey(r)) ||
      adapter?.resolves.includes(r.code)
    const kind =
      adapter && blocking.every(resolved) ? "custom-adapter" : "unsupported"
    return { kind, reasons: sorted }
  }
  if (primitives.some((rule) => rule.kind === "native")) {
    return { kind: "native-adapter", reasons: sorted }
  }
  return { kind: "direct", reasons: sorted }
}
