import { createTwoFilesPatch } from "diff"
import type { ClassificationKind } from "../analyzer/classify"
import type { ItemChange, SyncResult, TextChange } from "./sync"
import type { UpstreamItem } from "./types"

export interface ClassificationChange {
  /** `<style>/<name>`. */
  name: string
  before: ClassificationKind | null
  after: ClassificationKind | null
}

export interface ReportInput {
  /** The default style, whose item diffs are shown in full. */
  style: string
  /** Every synced style. */
  styles: readonly string[]
  result: SyncResult
  classifications: ClassificationChange[]
  /** Items translated by the generator, highlighted in the report. */
  generated: readonly string[]
  /** Differences from the reviewed upstream licensing (see generator/src/licenses.ts). */
  licenseProblems?: readonly string[]
}

/** GitHub rejects PR bodies above 65,536 characters. */
export const MAX_REPORT_LENGTH = 60_000

function itemText(item: UpstreamItem | null): string {
  if (!item) return ""
  return (item.files ?? []).map((f) => `// ${f.path}\n${f.content}`).join("\n")
}

function patch(name: string, before: string, after: string): string {
  return createTwoFilesPatch(`a/${name}`, `b/${name}`, before, after, "", "", {
    context: 3,
  })
    .split("\n")
    .slice(2) // drop the "====" header lines
    .join("\n")
    .trimEnd()
}

function details(summary: string, body: string): string {
  return [
    "<details>",
    `<summary>${summary}</summary>`,
    "",
    "```diff",
    body,
    "```",
    "",
    "</details>",
  ].join("\n")
}

function itemSection(change: ItemChange, generated: readonly string[]): string {
  const mark = generated.includes(change.name) ? " (generated)" : ""
  const label = `${change.style}/${change.name}`
  return details(
    `${label}${mark}`,
    patch(label, itemText(change.before), itemText(change.after))
  )
}

/**
 * Component names, each with the styles it changed in when that is not every
 * style: `` `button` ``, `` `card` (base-lyra, base-mira) ``.
 */
function changedNames(
  changes: readonly ItemChange[],
  styles: readonly string[]
): string {
  const byName = new Map<string, string[]>()
  for (const change of changes) {
    byName.set(change.name, [...(byName.get(change.name) ?? []), change.style])
  }
  if (byName.size === 0) return "none"
  return [...byName]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, changed]) =>
      styles.every((style) => changed.includes(style))
        ? `\`${name}\``
        : `\`${name}\` (${changed.join(", ")})`
    )
    .join(", ")
}

function textSection(name: string, change: TextChange): string {
  return details(name, patch(name, change.before ?? "", change.after))
}

/** Markdown summary of an upstream sync, used as the upstream-check PR body. */
export function renderSyncReport(input: ReportInput): string {
  const { result, generated } = input
  const names = (changes: ItemChange[]) => changedNames(changes, input.styles)
  const affected = [
    ...new Set(
      [...result.added, ...result.changed, ...result.removed]
        .map((c) => c.name)
        .filter((name) => generated.includes(name))
    ),
  ].sort()

  const licenseProblems = input.licenseProblems ?? []
  const lines = [`## Upstream sync: shadcn/ui ${input.styles.join(", ")}`, ""]
  if (licenseProblems.length > 0) {
    lines.push(
      "> [!CAUTION]",
      "> **Upstream licensing changed. Do not merge until a maintainer has reviewed whether and how the code may still be redistributed.**",
      ">",
      ...licenseProblems.map((problem) => `> - ${problem}`),
      ">",
      "> Generation stays blocked until `ACCEPTED_UPSTREAM_LICENSE` and the notice in `generator/src/licenses.ts` are updated after review (docs/adr/0013). The license diffs are listed first below.",
      ""
    )
  }
  lines.push(
    `- Added: ${names(result.added)}`,
    `- Changed: ${names(result.changed)}`,
    `- Removed: ${names(result.removed)}`,
    `- Generated components affected: ${affected.length === 0 ? "none" : affected.map((n) => `\`${n}\``).join(", ")}`,
    `- Theme changed: ${result.themeChanged ? "yes" : "no"}`,
    `- Vendored tailwind.css: ${
      result.tailwindCss
        ? `${result.tailwindCss.fromVersion ?? "none"} -> ${result.tailwindCss.toVersion}`
        : "unchanged"
    }`,
    `- Upstream license: ${result.license || result.packageLicense || result.iconLicense ? "changed" : "unchanged"}`,
    "",
    `Review the diffs below (of ${input.style}, and of other styles where only they changed). Upstream changes can alter behavior; this PR is never merged automatically.`
  )

  const reclassified = input.classifications.filter((c) => c.before !== c.after)
  if (reclassified.length > 0) {
    lines.push(
      "",
      "### Classification changes",
      "",
      "| Component | Before | After |",
      "| --- | --- | --- |",
      ...reclassified.map(
        (c) => `| ${c.name} | ${c.before ?? "-"} | ${c.after ?? "-"} |`
      )
    )
  }

  const sections = [
    ...(result.license
      ? [textSection("LICENSE.md (shadcn-ui/ui)", result.license)]
      : []),
    ...(result.packageLicense
      ? [
          textSection(
            `LICENSE.md (shadcn package; license field ${result.packageLicense.fromLicense ?? "none"} -> ${result.packageLicense.toLicense ?? "none"})`,
            result.packageLicense
          ),
        ]
      : []),
    ...(result.iconLicense
      ? [
          textSection(
            `LICENSE (lucide; license field ${result.iconLicense.fromLicense ?? "none"} -> ${result.iconLicense.toLicense ?? "none"})`,
            result.iconLicense
          ),
        ]
      : []),
    ...[...result.changed, ...result.added, ...result.removed]
      .filter((change) => {
        const all = [...result.changed, ...result.added, ...result.removed]
        return (
          change.style === input.style ||
          !all.some((c) => c.name === change.name && c.style === input.style)
        )
      })
      .sort(
        (a, b) =>
          Number(generated.includes(b.name)) -
          Number(generated.includes(a.name))
      )
      .map((change) => itemSection(change, generated)),
    ...(result.theme ? [textSection("theme.json", result.theme)] : []),
    ...(result.tailwindCss
      ? [textSection("shadcn-tailwind.css", result.tailwindCss)]
      : []),
  ]
  if (sections.length > 0) lines.push("", "### Upstream diffs", "")

  let text = lines.join("\n")
  let omitted = 0
  for (const section of sections) {
    if (text.length + section.length + 2 > MAX_REPORT_LENGTH) {
      omitted++
      continue
    }
    text += `\n${section}\n`
  }
  if (omitted > 0) {
    text += `\n_${omitted} diff section(s) omitted for length; see the commit diff under \`upstream/\`._\n`
  }
  return `${text.trimEnd()}\n`
}
