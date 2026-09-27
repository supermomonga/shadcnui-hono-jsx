/**
 * Records the latest release of the CLI on npm and the items it can install
 * (site/.cache/release.json), so that pages mark items that main has but the
 * published CLI does not. Without network access the file is removed and no
 * item is marked.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"

const file = path.resolve(import.meta.dirname, "../.cache/release.json")

async function json(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!response.ok) throw new Error(`GET ${url} failed with ${response.status}`)
  return response.json()
}

try {
  const latest = (await json(
    "https://registry.npmjs.org/shadcnui-hono-jsx/latest"
  )) as { version: string }
  const catalog = (await json(
    `https://cdn.jsdelivr.net/npm/shadcnui-hono-jsx@${latest.version}/generated/catalog.json`
  )) as { items: { name: string }[] }
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(
    file,
    `${JSON.stringify({ version: latest.version, items: catalog.items.map((item) => item.name) }, null, 2)}\n`
  )
  console.log(
    `Latest release: ${latest.version} (${catalog.items.length} items).`
  )
} catch (error) {
  rmSync(file, { force: true })
  console.warn(
    `Could not read the latest release from npm (${error instanceof Error ? error.message : error}); no item is marked unreleased.`
  )
}
