export type FetchLike = (
  input: string,
  init?: { headers?: Record<string, string> }
) => Promise<Response>

export type FetchResult =
  | { status: 304 }
  | {
      status: 200
      text: string
      etag: string | null
      lastModified: string | null
    }

const RETRIES = 2

/** GET `url`, sending `If-None-Match` when an ETag is known. Retries 5xx and network errors. */
export async function fetchText(
  url: string,
  options: { etag?: string | null; fetchImpl?: FetchLike } = {}
): Promise<FetchResult> {
  const fetchImpl = options.fetchImpl ?? (fetch as FetchLike)
  const headers: Record<string, string> = { accept: "application/json" }
  if (options.etag) headers["if-none-match"] = options.etag

  let lastError: unknown
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const response = await fetchImpl(url, { headers })
      if (response.status === 304) return { status: 304 }
      if (response.ok) {
        return {
          status: 200,
          text: await response.text(),
          etag: response.headers.get("etag"),
          lastModified: response.headers.get("last-modified"),
        }
      }
      lastError = new Error(`GET ${url} failed with ${response.status}`)
      if (response.status < 500) break
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}
