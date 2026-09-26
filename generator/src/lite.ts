/**
 * Lite alternatives (docs/adr/0028): hand-written components in `lite/`
 * that approximate an upstream component without JavaScript where no port
 * exists yet. They are written in upstream's style and translated by the
 * same pipeline as ports; each records the upstream items it is based on,
 * so an upstream change stops generation until the alternative is reviewed.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { Node, Project, SyntaxKind } from "ts-morph"
import { classify } from "./analyzer/classify"
import { collectFacts } from "./analyzer/facts"
import { reasonKey } from "./analyzer/reasons"
import { type GeneratorConfig, itemUrl } from "./config"
import { formatWithBiome } from "./emit/format"
import { renderLiteHeader } from "./emit/header"
import {
  type GeneratedComponent,
  GenerationError,
  templatePath,
} from "./generate"
import { lucideVersion } from "./icons/lucide"
import { ROOT } from "./paths"
import { transformSource } from "./transformers/pipeline"
import { sha256 } from "./upstream/hash"
import type { UpstreamLock } from "./upstream/lock"
import type { UpstreamStore } from "./upstream/store"

export const LITE_DIR = "lite"

/** Reads classes of upstream components in the style being generated. */
export interface LiteParts {
  /**
   * The class tokens of the first `attribute` (a string or the first string
   * of `cn(...)`) in the function `component` of the upstream item `item`.
   */
  classes(item: string, component: string, attribute?: string): string[]
}

export interface LiteComponent {
  /**
   * Upstream items the alternative follows, with the revision over every
   * style (`liteBaseRevision`) it was last reviewed against.
   */
  basedOn: Readonly<Record<string, string>>
  /**
   * Values of the `lite:<key>` class tokens in the source, computed from the
   * upstream parts of each style so that the alternative follows the style
   * (docs/adr/0030).
   */
  classes?: (parts: LiteParts) => Readonly<Record<string, string>>
  /**
   * `approximate`: compared with upstream in tests/visual at a looser
   * tolerance; `not-compared`: no upstream rendering to compare with.
   */
  visualParity: "approximate" | "not-compared"
  /** User-visible differences from the upstream component (Markdown). */
  notes: readonly string[]
}

const join = (tokens: readonly string[]) => tokens.join(" ")

function token(tokens: readonly string[], pattern: RegExp, what: string) {
  const found = tokens.find((t) => pattern.test(t))
  if (!found) throw new GenerationError(`upstream ${what} has no ${pattern}`)
  return found
}

/**
 * InputOTPLite from upstream's InputOTP, InputOTPGroup and InputOTPSlot: the
 * active slot's ring becomes a ring around the group while the input is
 * focused, the slots' active border follows the group's focus, and their
 * invalid state follows the group's. One input spans the slots, its
 * characters spaced by the slot pitch (size plus the group's gap).
 */
function inputOtpClasses(parts: LiteParts): Record<string, string> {
  const container = parts.classes("input-otp", "InputOTP", "containerClassName")
  const group = parts.classes("input-otp", "InputOTPGroup")
  const slot = parts.classes("input-otp", "InputOTPSlot")
  const invalid = (t: string) => t.includes("has-aria-invalid:")
  const rounded = group.filter((t) => t.startsWith("rounded"))
  const active = "data-[active=true]:"
  const size = Number(token(slot, /^size-/, "InputOTPSlot").slice(5))
  const gap = Number(group.find((t) => /^gap-/.test(t))?.slice(4) ?? 0)
  if (Number.isNaN(size) || Number.isNaN(gap)) {
    throw new GenerationError("upstream InputOTP has an unexpected size or gap")
  }
  const pitch = size + gap
  const text = token(slot, /^text-(xs|sm|base)(\/[\w.]+)?$/, "InputOTPSlot")
  return {
    root: join([
      "group/input-otp",
      "relative",
      "w-fit",
      ...container,
      ...rounded,
      ...group.filter((t) => invalid(t) && !t.includes(":border")),
      ...slot
        .filter((t) => t.startsWith(`${active}ring`))
        .map((t) => t.replace(active, "has-focus-visible:")),
    ]),
    group: join(group.filter((t) => !invalid(t))),
    slot: join(
      slot.flatMap((t) => {
        if (!t.includes(active)) {
          return [
            t.replace("aria-invalid:", "group-has-aria-invalid/input-otp:"),
          ]
        }
        const rest = t.replace(active, "")
        return rest.startsWith("border") && !rest.includes(":")
          ? [`group-has-focus-visible/input-otp:${rest}`]
          : []
      })
    ),
    clip: join(["absolute", "inset-0", "overflow-hidden", ...rounded]),
    input: join([
      "h-full",
      `w-[calc((var(--input-otp-length)+1)*--spacing(${pitch}))]`,
      "border-0",
      "bg-transparent",
      "pb-px",
      `pl-[calc((--spacing(${size})-1ch)/2)]`,
      text,
      `tracking-[calc(--spacing(${pitch})-1ch)]`,
      "text-foreground",
      "tabular-nums",
      "outline-none",
      "disabled:cursor-not-allowed",
    ]),
  }
}

/** DatePickerLite: the calendar icon sits in upstream Input's inline padding. */
function datePickerClasses(parts: LiteParts): Record<string, string> {
  const padding = token(parts.classes("input", "Input"), /^px-/, "Input")
  const inset = Number(padding.slice("px-".length))
  if (Number.isNaN(inset)) {
    throw new GenerationError(`upstream Input has an unexpected ${padding}`)
  }
  // The icon (size-4) plus a gap of 1.5 before the text.
  return { "icon-inset": `left-${inset}`, "text-inset": `pl-${inset + 5.5}` }
}

export const LITE_COMPONENTS: Readonly<Record<string, LiteComponent>> = {
  "input-otp-lite": {
    basedOn: {
      "input-otp":
        "7a3862c3defe6ee3f4bbf245e78f252ece22f09c41df6e2e50c16904ea9feea4",
    },
    classes: inputOtpClasses,
    visualParity: "approximate",
    notes: [
      'A lite alternative to `input-otp` (not a port), with no JavaScript: one native text input over the slots, as in daisyUI, so typing, pasting, one-time-code autofill (`autocomplete="one-time-code"`) and form validation (`minlength`, `pattern`, `required`) come from the browser.',
      'One component with `maxLength` slots instead of `InputOTPGroup`, `InputOTPSlot` and `InputOTPSeparator`; the whole group is highlighted while focused (upstream highlights the active slot, with a blinking caret). Characters are aligned with tabular digits: set a monospace font (`class="font-mono"`) for letters.',
    ],
  },
  "date-picker-lite": {
    basedOn: {
      calendar:
        "cd8e16afe351f60f76c59620fe5695869c6f2e5d66d078f68197589dbe189726",
      input: "bb21d2cffdf31492bb4b2e681bd4d5b385ece08af6b395b1bd598a0b99823d65",
    },
    classes: datePickerClasses,
    visualParity: "not-compared",
    notes: [
      "A lite alternative to a date picker built from `calendar` (not a port), with no JavaScript: upstream's Input as a native date input (`type` can also be `datetime-local`, `month` or `week`) with a calendar icon, submitting ISO values.",
      "The browser draws the calendar popup, which cannot be styled (it follows `color-scheme` in dark mode) and differs between browsers; the field shows the browser's date format rather than a placeholder. Date ranges and several months are not supported.",
    ],
  },
}

/**
 * Revision of an upstream item across styles: the sha256 of its content
 * hashes in every style, in the configured order. It changes when the item
 * changes in any style.
 */
export function liteBaseRevision(
  lock: UpstreamLock,
  styles: readonly string[],
  name: string
): string | null {
  const hashes = styles.map(
    (style) => lock.styles[style]?.items[name]?.contentSha256
  )
  if (hashes.some((hash) => hash === undefined)) return null
  return sha256(styles.map((style, i) => `${style}\0${hashes[i]}\n`).join(""))
}

/** `LiteParts` over the snapshot of one style. */
export function liteParts(store: UpstreamStore): LiteParts {
  return {
    classes(item, component, attribute = "className") {
      const content = store.readItem(item).files?.[0]?.content ?? ""
      const sf = new Project({ useInMemoryFileSystem: true }).createSourceFile(
        `${item}.tsx`,
        content
      )
      const fail = (): never => {
        throw new GenerationError(
          `upstream ${store.style}/${item} has no ${attribute} in ${component}`
        )
      }
      const fn = sf.getFunction(component) ?? fail()
      const attr =
        fn
          .getDescendantsOfKind(SyntaxKind.JsxAttribute)
          .find((a) => a.getNameNode().getText() === attribute) ?? fail()
      const init = attr.getInitializer()
      const expression = Node.isJsxExpression(init)
        ? init.getExpression()
        : init
      const literal = Node.isCallExpression(expression)
        ? expression.getArguments()[0]
        : expression
      if (!Node.isStringLiteral(literal)) return fail()
      return literal.getLiteralValue().split(/\s+/).filter(Boolean)
    },
  }
}

const LITE_TOKEN = /\blite:([a-z-]+)\b/g

/** Replaces the `lite:<key>` class tokens of a lite source. */
export function resolveLiteClasses(
  name: string,
  content: string,
  values: Readonly<Record<string, string>>
): string {
  const used = new Set<string>()
  const resolved = content.replace(LITE_TOKEN, (_, key: string) => {
    const value = values[key]
    if (value === undefined) {
      throw new GenerationError(`${name}: no value for lite:${key}`)
    }
    used.add(key)
    return value
  })
  const unused = Object.keys(values).filter((key) => !used.has(key))
  if (unused.length > 0) {
    throw new GenerationError(`${name}: lite:${unused.join(", lite:")} unused`)
  }
  return resolved
}

/** Translates one lite alternative from `lite/<name>.tsx` for `config.style`. */
export function generateLite(
  name: string,
  deps: { config: GeneratorConfig; lock: UpstreamLock; store: UpstreamStore }
): GeneratedComponent {
  const lite = LITE_COMPONENTS[name]
  if (!lite) throw new GenerationError(`${name} is not a lite alternative`)
  for (const [base, reviewed] of Object.entries(lite.basedOn)) {
    const current = liteBaseRevision(deps.lock, deps.config.styles, base)
    if (current !== reviewed) {
      throw new GenerationError(
        `${name}: upstream ${base} changed (revision ${current ?? "missing"}, reviewed ${reviewed}); review ${LITE_DIR}/${name}.tsx against it in every style and update basedOn in generator/src/lite.ts`
      )
    }
  }
  const source = path.join(LITE_DIR, `${name}.tsx`)
  const content = resolveLiteClasses(
    name,
    readFileSync(path.join(ROOT, source), "utf8"),
    lite.classes?.(liteParts(deps.store)) ?? {}
  )
  const facts = collectFacts({
    name,
    type: "registry:ui",
    files: [{ path: source, type: "registry:ui", content }],
  })
  const classification = classify(
    facts,
    {},
    {
      available: new Set(deps.config.components),
    }
  )
  if (classification.kind === "unsupported") {
    const blocking = classification.reasons
      .filter((r) => r.blocking)
      .map(reasonKey)
    throw new GenerationError(
      `${name} cannot be translated: ${blocking.join(", ")}`
    )
  }
  const [fileFacts] = facts.files
  if (!fileFacts) throw new GenerationError(`${name} has no source`)
  const output = transformSource({ name, source: content, facts: fileFacts })
  const header = renderLiteHeader({
    name,
    source,
    style: deps.config.style,
    basedOn: Object.keys(lite.basedOn).map((base) => ({
      name: base,
      url: itemUrl(deps.config, base),
      sha256:
        deps.lock.styles[deps.config.style]?.items[base]?.contentSha256 ??
        "unknown",
    })),
    icons: { names: output.icons, version: lucideVersion() },
  })
  const file = templatePath(deps.config.style, name)
  return {
    name,
    classification,
    mode: "lite",
    file: {
      path: file,
      text: formatWithBiome(`${header}\n${output.text}`, file),
    },
    log: output.log,
  }
}
