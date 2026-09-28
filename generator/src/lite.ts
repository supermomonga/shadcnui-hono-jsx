/**
 * Lite alternatives (docs/adr/0028): hand-written components in `lite/`
 * that approximate an upstream component without JavaScript where no port
 * exists yet, or serve another use beside a port (docs/adr/0036). They are
 * written in upstream's style and translated by the same pipeline as ports;
 * each records the upstream items it is based on, so an upstream change
 * stops generation until the alternative is reviewed.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import {
  Node,
  type ObjectLiteralExpression,
  Project,
  type StringLiteral,
  SyntaxKind,
} from "ts-morph"
import { type Variant, variantDir } from "../../cli/src/variants"
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

/** Base and variant class tokens of a `cva(...)` definition. */
export interface LiteVariants {
  base: string[]
  /** Tokens by variant and value, e.g. `variants.variant.line`. */
  variants: Record<string, Record<string, string[]>>
}

/** Reads classes of upstream components in the style being generated. */
export interface LiteParts {
  /**
   * The class tokens of the first `attribute` in the function `component` of
   * the upstream item `item`: a string, or every string of `cn(...)` in
   * order, whose only other argument may be the passed-through `attribute`.
   */
  classes(item: string, component: string, attribute?: string): string[]
  /** The tokens of `const name = cva(base, { variants })` in the upstream item `item`. */
  variants(item: string, name: string): LiteVariants
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
      // Pinned to the start: the input is a slot wider than the group (for
      // the caret) and overflows at the end in either direction.
      "absolute",
      "top-0",
      "start-0",
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
      // In right-to-left text upstream fills the slots from the right; the
      // characters of one input follow that order only when overridden, and
      // Chromium adds letter spacing to the right of each character, before
      // the first one too.
      "rtl:[unicode-bidi:bidi-override]",
      `rtl:translate-x-[calc(--spacing(${pitch})-1ch)]`,
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

/**
 * The state attributes TabsLite renders (data-orientation on every part, the
 * list's data-variant, a trigger's data-active, data-disabled and
 * aria-disabled, and an icon's data-icon) as Tailwind variants.
 */
const TABS_LITE_CONDITIONS = new Set([
  "data-horizontal",
  "data-vertical",
  "group-data-horizontal/tabs",
  "group-data-vertical/tabs",
  "data-[variant=default]",
  "data-[variant=line]",
  "group-data-[variant=default]/tabs-list",
  "group-data-[variant=line]/tabs-list",
  "data-active",
  "data-disabled",
  "aria-disabled",
  "has-data-[icon=inline-start]",
  "has-data-[icon=inline-end]",
])

/** The variants of a class token that select on a data or ARIA attribute. */
function attributeConditions(token: string): string[] {
  const segments: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < token.length; i++) {
    const c = token[i]
    if (c === "[" || c === "(") depth++
    else if (c === "]" || c === ")") depth--
    else if (c === ":" && depth === 0) {
      segments.push(token.slice(start, i))
      start = i + 1
    }
  }
  return segments.filter((s) => /(^|[^a-z])(data|aria)-/.test(s))
}

/**
 * TabsLite from upstream's Tabs, TabsList (tabsListVariants), TabsTrigger and
 * TabsContent, whose classes apply unchanged: the lite parts render the same
 * groups and state attributes. Generation stops when upstream selects on a
 * state they do not render or adds a list variant.
 */
function tabsClasses(parts: LiteParts): Record<string, string> {
  const root = parts.classes("tabs", "Tabs")
  const list = parts.variants("tabs", "tabsListVariants")
  const trigger = parts.classes("tabs", "TabsTrigger")
  const content = parts.classes("tabs", "TabsContent")
  const variant = list.variants.variant ?? {}
  const { default: listDefault, line: listLine } = variant
  if (!listDefault || !listLine || Object.keys(variant).length !== 2) {
    throw new GenerationError(
      `upstream tabsListVariants has the variants ${Object.keys(variant).join(", ")}; TabsLiteList offers default and line`
    )
  }
  token(root, /^group\/tabs$/, "Tabs")
  token(list.base, /^group\/tabs-list$/, "tabsListVariants")
  token(trigger, /(^|:)data-active:/, "TabsTrigger")
  const tokens = [root, list.base, listDefault, listLine, trigger, content]
  for (const t of tokens.flat()) {
    for (const condition of attributeConditions(t)) {
      if (!TABS_LITE_CONDITIONS.has(condition)) {
        throw new GenerationError(
          `upstream tabs selects on ${condition} (${t}), which tabs-lite does not render`
        )
      }
    }
  }
  return {
    root: join(root),
    list: join(list.base),
    "list-default": join(listDefault),
    "list-line": join(listLine),
    trigger: join(trigger),
    content: join(content),
  }
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
  "tabs-lite": {
    basedOn: {
      tabs: "dbf0db185f928f26ebc4dca6db7cbb23588251c8df107806063426b28fa640bd",
    },
    classes: tabsClasses,
    visualParity: "approximate",
    notes: [
      "A lite alternative to `tabs` (not a port) for multi-page apps, with no JavaScript: the triggers are links (`<a href>`) in a `<nav>`, each to its tab's page, and the server renders only the current page's content. The trigger whose `value` matches `TabsLite`'s `value` gets `aria-current=\"page\"` and upstream's active style. Use the `tabs` port to switch panels within one page.",
      'Links rather than the ARIA tabs pattern: there are no `tablist`, `tab` or `tabpanel` roles, every link is a tab stop (the arrow keys do not move between them), and a disabled trigger renders without `href` (`role="link"` with `aria-disabled`). There is no `defaultValue` or `activateOnFocus`, and `TabsLiteContent` takes no `value`.',
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

const tokensOf = (literal: StringLiteral) =>
  literal.getLiteralValue().split(/\s+/).filter(Boolean)

/** `LiteParts` over the snapshot of one style. */
export function liteParts(store: UpstreamStore): LiteParts {
  const project = new Project({ useInMemoryFileSystem: true })
  const source = (item: string) =>
    project.getSourceFile(`${item}.tsx`) ??
    project.createSourceFile(
      `${item}.tsx`,
      store.readItem(item).files?.[0]?.content ?? ""
    )
  return {
    classes(item, component, attribute = "className") {
      const fail = (): never => {
        throw new GenerationError(
          `upstream ${store.style}/${item} has no ${attribute} in ${component}`
        )
      }
      const fn = source(item).getFunction(component) ?? fail()
      const attr =
        fn
          .getDescendantsOfKind(SyntaxKind.JsxAttribute)
          .find((a) => a.getNameNode().getText() === attribute) ?? fail()
      const init = attr.getInitializer()
      const expression = Node.isJsxExpression(init)
        ? init.getExpression()
        : init
      if (Node.isStringLiteral(expression)) return tokensOf(expression)
      if (
        !Node.isCallExpression(expression) ||
        expression.getExpression().getText() !== "cn"
      ) {
        return fail()
      }
      return expression.getArguments().flatMap((argument) => {
        if (Node.isStringLiteral(argument)) return tokensOf(argument)
        if (Node.isIdentifier(argument) && argument.getText() === attribute) {
          return []
        }
        throw new GenerationError(
          `upstream ${store.style}/${item} passes ${argument.getText()} to cn in the ${attribute} of ${component}`
        )
      })
    },
    variants(item, name) {
      const fail = (what: string): never => {
        throw new GenerationError(
          `upstream ${store.style}/${item} has no ${what} in ${name}`
        )
      }
      const call = source(item)
        .getVariableDeclaration(name)
        ?.getInitializerIfKind(SyntaxKind.CallExpression)
      if (call?.getExpression().getText() !== "cva") return fail("cva(...)")
      const [base, options] = call.getArguments()
      if (!Node.isStringLiteral(base)) return fail("base string")
      const variants = Node.isObjectLiteralExpression(options)
        ? options
            .getProperty("variants")
            ?.asKind(SyntaxKind.PropertyAssignment)
            ?.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression)
        : undefined
      if (!variants) return fail("variants object")
      const entries = (object: ObjectLiteralExpression) =>
        object.getProperties().map((property) => {
          if (!Node.isPropertyAssignment(property)) {
            return fail(`plain property ${property.getText()}`)
          }
          const key = property.getNameNode()
          return [
            Node.isStringLiteral(key) ? key.getLiteralValue() : key.getText(),
            property.getInitializerOrThrow(),
          ] as const
        })
      return {
        base: tokensOf(base),
        variants: Object.fromEntries(
          entries(variants).map(([variant, values]) => {
            if (!Node.isObjectLiteralExpression(values)) {
              return fail(`values object for ${variant}`)
            }
            return [
              variant,
              Object.fromEntries(
                entries(values).map(([value, classes]) => {
                  if (!Node.isStringLiteral(classes)) {
                    return fail(`string for ${variant}.${value}`)
                  }
                  return [value, tokensOf(classes)]
                })
              ),
            ]
          })
        ),
      }
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

/** The source of a lite alternative with its `lite:<key>` tokens resolved for `store.style`. */
export function liteSource(name: string, store: UpstreamStore): string {
  const lite = LITE_COMPONENTS[name]
  if (!lite) throw new GenerationError(`${name} is not a lite alternative`)
  return resolveLiteClasses(
    name,
    readFileSync(path.join(ROOT, LITE_DIR, `${name}.tsx`), "utf8"),
    lite.classes?.(liteParts(store)) ?? {}
  )
}

/**
 * Translates one lite alternative from `lite/<name>.tsx` for `config.style`.
 * For a variant, `source` is `liteSource` transformed for it (`applyVariant`).
 */
export function generateLite(
  name: string,
  deps: { config: GeneratorConfig; lock: UpstreamLock; store: UpstreamStore },
  variant?: { variant: Variant; source: string }
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
  const content = variant?.source ?? liteSource(name, deps.store)
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
    variant: variant ? variantDir(variant.variant) : undefined,
  })
  const file = templatePath(deps.config.style, name, variant?.variant)
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
