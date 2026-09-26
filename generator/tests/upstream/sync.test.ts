import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import type { GeneratorConfig } from "../../src/config"
import type { FetchLike } from "../../src/upstream/fetch"
import { contentSha256, sha256 } from "../../src/upstream/hash"
import { UpstreamStore } from "../../src/upstream/store"
import { syncUpstream, type VendoredSource } from "../../src/upstream/sync"
import type { PresetModuleSource } from "../../src/upstream/vendored"

const BASE = "https://registry.test/r"
const THEME_URL = "https://registry.test/init"
const LICENSE_URL = "https://registry.test/LICENSE.md"
const MIT_TEXT = "MIT License\n\nCopyright (c) 2023 shadcn\n"
const HEAD = "a".repeat(40)

const config: GeneratorConfig = {
  repository: "owner/repo",
  style: "test-style",
  registryBaseUrl: BASE,
  licenseUrl: LICENSE_URL,
  trackedTypes: ["registry:ui"],
  components: ["button"],
}

const tailwindCss: VendoredSource = {
  package: "shadcn",
  version: "1.0.0",
  file: "dist/tailwind.css",
  text: "@custom-variant data-open (&[data-open]);\n",
  license: "MIT",
  licenseText: MIT_TEXT,
}

const preset: PresetModuleSource = {
  package: "shadcn",
  version: "1.0.0",
  module: "export{}\n",
  types: "export {}\n",
  named: { nova: { style: "nova" } },
}

const FONT = {
  name: "font-test",
  type: "registry:font",
  font: { family: "'Test Variable', sans-serif", variable: "--font-sans" },
}

function item(name: string, content: string) {
  return {
    name,
    type: "registry:ui",
    dependencies: ["cn"],
    files: [{ path: `registry/ui/${name}.tsx`, type: "registry:ui", content }],
  }
}

interface Resource {
  body: unknown
  etag?: string
}

/** A fake registry that honours If-None-Match and records requests. */
function fakeRegistry(
  resources: Map<string, Resource>,
  head: string | null = HEAD
) {
  const requests: { url: string; ifNoneMatch?: string }[] = []
  const fetchImpl: FetchLike = async (url, init) => {
    const ifNoneMatch = init?.headers?.["if-none-match"]
    requests.push({ url, ifNoneMatch })
    if (url.startsWith("https://api.github.com/")) {
      return head
        ? new Response(head)
        : new Response("rate limited", { status: 403 })
    }
    const resource = resources.get(url)
    if (!resource) return new Response("not found", { status: 404 })
    if (resource.etag && ifNoneMatch === resource.etag) {
      return new Response(null, { status: 304 })
    }
    const headers: Record<string, string> = {
      "last-modified": "Mon, 21 Sep 2026 10:00:00 GMT",
    }
    if (resource.etag) headers.etag = resource.etag
    const body =
      typeof resource.body === "string"
        ? resource.body
        : JSON.stringify(resource.body)
    return new Response(body, { headers })
  }
  return { fetchImpl, requests }
}

function registry(items: Record<string, { content: string; etag?: string }>) {
  const resources = new Map<string, Resource>()
  resources.set(`${BASE}/styles/test-style/registry.json`, {
    body: {
      name: "shadcn/ui",
      homepage: "https://ui.shadcn.com",
      items: [
        ...Object.keys(items).map((name) => ({ name, type: "registry:ui" })),
        { name: "button-demo", type: "registry:example" },
      ],
    },
    etag: `"index-${Object.keys(items).join(",")}"`,
  })
  for (const [name, { content, etag }] of Object.entries(items)) {
    resources.set(`${BASE}/styles/test-style/${name}.json`, {
      body: item(name, content),
      etag,
    })
  }
  resources.set(LICENSE_URL, { body: MIT_TEXT, etag: '"license"' })
  resources.set(THEME_URL, {
    body: {
      name: "test-style",
      type: "registry:base",
      registryDependencies: ["utils", "font-test"],
      cssVars: { light: { background: "oklch(1 0 0)" } },
    },
  })
  resources.set(`${BASE}/styles/test-style/font-test.json`, {
    body: FONT,
    etag: '"font"',
  })
  return resources
}

let root: string
let store: UpstreamStore
let clock: number

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "shj-sync-"))
  store = new UpstreamStore(root, "test-style")
  clock = Date.UTC(2026, 8, 25)
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

const run = (fetchImpl: FetchLike) =>
  syncUpstream({
    config,
    store,
    themeUrl: THEME_URL,
    preset,
    tailwindCss,
    fetchImpl,
    now: () => {
      clock += 1000
      return new Date(clock)
    },
  })

describe("syncUpstream", () => {
  test("snapshots tracked items, theme and vendored CSS on first run", async () => {
    const { fetchImpl } = fakeRegistry(
      registry({
        button: { content: "button v1", etag: '"b1"' },
        card: { content: "card v1" },
      })
    )
    const result = await run(fetchImpl)

    expect(result.added.map((c) => c.name)).toEqual(["button", "card"])
    expect(
      result.indexChanged && result.themeChanged && result.tailwindCssChanged
    ).toBe(true)
    expect(store.readIndex().items).toEqual([
      { name: "button", type: "registry:ui" },
      { name: "card", type: "registry:ui" },
    ])
    expect(store.readItem("button").files?.[0]?.content).toBe("button v1")
    expect(store.readTailwindCss()).toBe(tailwindCss.text)

    const lock = store.readLock()
    expect(lock?.items.button).toMatchObject({
      url: `${BASE}/styles/test-style/button.json`,
      etag: '"b1"',
      contentSha256: contentSha256(item("button", "button v1")),
      upstreamCommit: HEAD,
    })
    expect(lock?.tailwindCss).toEqual({
      package: "shadcn",
      version: "1.0.0",
      file: "dist/tailwind.css",
      sha256: sha256(tailwindCss.text),
      license: "MIT",
      licenseSha256: sha256(MIT_TEXT),
    })
    expect(lock?.license?.sha256).toBe(sha256(MIT_TEXT))
    expect(store.readOptional(store.licenseFile)).toBe(MIT_TEXT)
    expect(store.readOptional(store.packageLicenseFile)).toBe(MIT_TEXT)

    expect(result.fontsChanged).toEqual(["font-test"])
    expect(store.readFont("font-test")).toEqual(FONT)
    expect(lock?.fonts["font-test"]?.url).toBe(
      `${BASE}/styles/test-style/font-test.json`
    )
    expect(result.presetChanged).toBe(true)
    expect(store.readOptional(store.presetModuleFile)).toBe(preset.module)
    expect(store.readNamedPresets()).toEqual(preset.named)
    expect(lock?.preset).toMatchObject({ package: "shadcn", version: "1.0.0" })
  })

  test("records a new theme URL even when the theme content is the same", async () => {
    const resources = registry({ button: { content: "button v1" } })
    await run(fakeRegistry(resources).fetchImpl)
    const moved = `${THEME_URL}?preset=b0`
    resources.set(moved, resources.get(THEME_URL) as Resource)
    const result = await syncUpstream({
      config,
      store,
      themeUrl: moved,
      tailwindCss,
      fetchImpl: fakeRegistry(resources).fetchImpl,
    })
    expect(result.themeChanged).toBe(false)
    expect(store.readLock()?.theme?.url).toBe(moved)
  })

  test("drops fonts the theme no longer depends on", async () => {
    const resources = registry({ button: { content: "button v1" } })
    await run(fakeRegistry(resources).fetchImpl)
    const theme = resources.get(THEME_URL) as Resource
    resources.set(THEME_URL, {
      body: { ...(theme.body as object), registryDependencies: ["utils"] },
    })
    const result = await run(fakeRegistry(resources).fetchImpl)
    expect(result.fontsChanged).toEqual(["font-test"])
    expect(existsSync(store.fontFile("font-test"))).toBe(false)
    expect(store.readLock()?.fonts).toEqual({})
  })

  test("is idempotent: a second run without upstream changes writes nothing", async () => {
    const { fetchImpl, requests } = fakeRegistry(
      registry({
        button: { content: "button v1", etag: '"b1"' },
        card: { content: "card v1" },
      })
    )
    await run(fetchImpl)
    const lockBefore = readFileSync(store.lockFile, "utf8")
    requests.length = 0

    const result = await run(fetchImpl)

    expect(result.added).toEqual([])
    expect(result.changed).toEqual([])
    expect(result.unchanged).toEqual(["button", "card"])
    expect(result.lockChanged).toBe(false)
    expect(result.fontsChanged).toEqual([])
    expect(result.presetChanged).toBe(false)
    expect(readFileSync(store.lockFile, "utf8")).toBe(lockBefore)
    // Conditional requests are sent for resources with an ETag.
    expect(
      requests.find((r) => r.url.endsWith("/button.json"))?.ifNoneMatch
    ).toBe('"b1"')
  })

  test("ignores ETag churn when the content is identical", async () => {
    await run(
      fakeRegistry(registry({ button: { content: "v1", etag: '"e1"' } }))
        .fetchImpl
    )
    const lockBefore = readFileSync(store.lockFile, "utf8")
    const result = await run(
      fakeRegistry(registry({ button: { content: "v1", etag: '"e2"' } }))
        .fetchImpl
    )
    expect(result.unchanged).toEqual(["button"])
    expect(readFileSync(store.lockFile, "utf8")).toBe(lockBefore)
  })

  test("reports changed, added and removed items with before/after", async () => {
    await run(
      fakeRegistry(
        registry({
          button: { content: "button v1" },
          card: { content: "card v1" },
        })
      ).fetchImpl
    )
    const result = await run(
      fakeRegistry(
        registry({
          button: { content: "button v2" },
          dialog: { content: "dialog v1" },
        })
      ).fetchImpl
    )

    expect(result.changed).toHaveLength(1)
    expect(result.changed[0]?.before?.files?.[0]?.content).toBe("button v1")
    expect(result.changed[0]?.after?.files?.[0]?.content).toBe("button v2")
    expect(result.added.map((c) => c.name)).toEqual(["dialog"])
    expect(result.removed.map((c) => c.name)).toEqual(["card"])
    expect(existsSync(store.itemFile("card"))).toBe(false)
    expect(Object.keys(store.readLock()?.items ?? {})).toEqual([
      "button",
      "dialog",
    ])
  })

  test("records a null upstream commit when GitHub is unavailable", async () => {
    const { fetchImpl } = fakeRegistry(
      registry({ button: { content: "v1" } }),
      null
    )
    await run(fetchImpl)
    expect(store.readLock()?.items.button?.upstreamCommit).toBeNull()
  })

  test("accepts placeholder items without files", async () => {
    const resources = registry({ form: { content: "" } })
    resources.set(`${BASE}/styles/test-style/form.json`, {
      body: { name: "form", type: "registry:ui" },
    })
    const result = await run(fakeRegistry(resources).fetchImpl)
    expect(result.added.map((c) => c.name)).toEqual(["form"])
    expect(store.readItem("form").files).toBeUndefined()
  })

  test("rejects malformed items", async () => {
    const resources = registry({ button: { content: "v1" } })
    resources.set(`${BASE}/styles/test-style/button.json`, {
      body: { name: "button" },
    })
    await expect(run(fakeRegistry(resources).fetchImpl)).rejects.toThrow(
      /missing type/
    )
  })

  test("snapshots upstream license changes for review", async () => {
    await run(fakeRegistry(registry({ button: { content: "v1" } })).fetchImpl)
    const resources = registry({ button: { content: "v1" } })
    resources.set(LICENSE_URL, { body: "Business Source License\n" })
    const result = await syncUpstream({
      config,
      store,
      themeUrl: THEME_URL,
      tailwindCss: {
        ...tailwindCss,
        license: "BUSL-1.1",
        licenseText: "BUSL\n",
      },
      fetchImpl: fakeRegistry(resources).fetchImpl,
    })
    expect(result.license).toEqual({
      before: MIT_TEXT,
      after: "Business Source License\n",
    })
    expect(result.packageLicense).toMatchObject({
      before: MIT_TEXT,
      after: "BUSL\n",
      fromLicense: "MIT",
      toLicense: "BUSL-1.1",
    })
    expect(store.readLock()?.tailwindCss?.license).toBe("BUSL-1.1")
  })
})
