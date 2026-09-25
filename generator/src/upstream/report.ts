import { createTwoFilesPatch } from "diff"
import type { ClassificationKind } from "../analyzer/classify"
import type { ItemChange, SyncResult, TextChange } from "./sync"
import type { UpstreamItem } from "./types"

export interface ClassificationChange {
  name: string
  before: ClassificationKind | null
  after: ClassificationKind | null
}

export interface ReportInput {
  style: string
  result: SyncResult
  classifications: ClassificationChange[]
  /** Items translated by the generator, highlighted in the report. */
  generated: readonly string[]
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
  return details(
    `${change.name}${mark}`,
    patch(change.name, itemText(change.before), itemText(change.after))
  )
}

function textSection(name: string, change: TextChange): string {
  return details(name, patch(name, change.before ?? "", change.after))
}

/** Markdown summary of an upstream sync, used as the upstream-check PR body. */
export function renderSyncReport(input: ReportInput): string {
  const { result, generated } = input
  const names = (changes: ItemChange[]) =>
    changes.length === 0
      ? "none"
      : changes.map((c) => `\`${c.name}\``).join(", ")
  const affected = [...result.added, ...result.changed, ...result.removed]
    .map((c) => c.name)
    .filter((name) => generated.includes(name))

  const lines = [
    `## Upstream sync: shadcn/ui ${input.style}`,
    "",
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
    "",
    "Review the diffs below. Upstream changes can alter behavior; this PR is never merged automatically.",
  ]

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
    ...[...result.changed, ...result.added, ...result.removed]
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
