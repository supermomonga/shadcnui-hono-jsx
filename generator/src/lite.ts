/**
 * Lite alternatives (docs/adr/0028): hand-written components in `lite/`
 * that approximate an upstream component without JavaScript where no port
 * exists yet. They are written in upstream's style and translated by the
 * same pipeline as ports; each records the upstream items it is based on,
 * so an upstream change stops generation until the alternative is reviewed.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
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
import type { UpstreamLock } from "./upstream/lock"

export const LITE_DIR = "lite"

export interface LiteComponent {
  /**
   * Upstream items the alternative follows, with the content hash
   * (`upstream/lock.json`) it was last reviewed against.
   */
  basedOn: Readonly<Record<string, string>>
  /**
   * `approximate`: compared with upstream in tests/visual at a looser
   * tolerance; `not-compared`: no upstream rendering to compare with.
   */
  visualParity: "approximate" | "not-compared"
  /** User-visible differences from the upstream component (Markdown). */
  notes: readonly string[]
}

export const LITE_COMPONENTS: Readonly<Record<string, LiteComponent>> = {
  "input-otp-lite": {
    basedOn: {
      "input-otp":
        "54f6dd46b5a450592778d4e3b238b92bfe5f9062b6be5ea6a28ae573a84d4d4a",
    },
    visualParity: "approximate",
    notes: [
      'A lite alternative to `input-otp` (not a port), with no JavaScript: one native text input over the slots, as in daisyUI, so typing, pasting, one-time-code autofill (`autocomplete="one-time-code"`) and form validation (`minlength`, `pattern`, `required`) come from the browser.',
      'One component with `maxLength` slots instead of `InputOTPGroup`, `InputOTPSlot` and `InputOTPSeparator`; the whole group is highlighted while focused (upstream highlights the active slot, with a blinking caret). Characters are aligned with tabular digits: set a monospace font (`class="font-mono"`) for letters.',
    ],
  },
  "date-picker-lite": {
    basedOn: {
      calendar:
        "71d0ae1a4beb00d5f0b5f6bc574e811a575f6654d727e49ad5b508867a4b1b98",
      input: "31a57ec736d9c75d16f81eb1486098944782f4f565c597f715b8a1334e28f5d0",
    },
    visualParity: "not-compared",
    notes: [
      "A lite alternative to a date picker built from `calendar` (not a port), with no JavaScript: upstream's Input as a native date input (`type` can also be `datetime-local`, `month` or `week`) with a calendar icon, submitting ISO values.",
      "The browser draws the calendar popup, which cannot be styled (it follows `color-scheme` in dark mode) and differs between browsers; the field shows the browser's date format rather than a placeholder. Date ranges and several months are not supported.",
    ],
  },
}

/** Translates one lite alternative from `lite/<name>.tsx`. */
export function generateLite(
  name: string,
  deps: { config: GeneratorConfig; lock: UpstreamLock }
): GeneratedComponent {
  const lite = LITE_COMPONENTS[name]
  if (!lite) throw new GenerationError(`${name} is not a lite alternative`)
  for (const [base, reviewed] of Object.entries(lite.basedOn)) {
    const current = deps.lock.items[base]?.contentSha256
    if (current !== reviewed) {
      throw new GenerationError(
        `${name}: upstream ${base} changed (sha256 ${current ?? "missing"}, reviewed ${reviewed}); review ${LITE_DIR}/${name}.tsx and update basedOn in generator/src/lite.ts`
      )
    }
  }
  const source = path.join(LITE_DIR, `${name}.tsx`)
  const content = readFileSync(path.join(ROOT, source), "utf8")
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
    basedOn: Object.entries(lite.basedOn).map(([base, sha256]) => ({
      name: base,
      url: itemUrl(deps.config, base),
      sha256,
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
