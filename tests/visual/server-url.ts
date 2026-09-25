/** Where serve.ts serves the rendered pages during the Playwright run. */
export const SERVER_PORT = 4173
export const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`

/** URL of a rendered page in .output/. */
export const pageUrl = (file: string) => `${SERVER_URL}/${file}`
