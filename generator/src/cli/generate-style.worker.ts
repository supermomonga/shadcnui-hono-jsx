/** Worker for `bun run generate`: the templates of one style. */
import { generateStyle, type StyleRequest } from "../generate-style"

declare const self: Worker

self.onmessage = async (event: MessageEvent<StyleRequest>) => {
  self.postMessage(await generateStyle(event.data))
}
