import type { FetchLike } from "./fetch"

/**
 * Resolves the current `main` commit of shadcn-ui/ui. Built registry JSON is
 * not tracked in git, so this is only a best-effort reference; returns null
 * on any failure.
 */
export async function resolveUpstreamHead(
  options: { fetchImpl?: FetchLike; token?: string | undefined } = {}
): Promise<string | null> {
  const fetchImpl = options.fetchImpl ?? (fetch as FetchLike)
  const headers: Record<string, string> = {
    accept: "application/vnd.github.sha",
  }
  if (options.token) headers.authorization = `Bearer ${options.token}`
  try {
    const response = await fetchImpl(
      "https://api.github.com/repos/shadcn-ui/ui/commits/main",
      { headers }
    )
    if (!response.ok) return null
    const sha = (await response.text()).trim()
    return /^[0-9a-f]{40}$/.test(sha) ? sha : null
  } catch {
    return null
  }
}
