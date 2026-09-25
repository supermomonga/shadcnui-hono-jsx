import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import type { VendoredSource } from "./sync"

/** Reads `tailwind.css` and its licensing from the installed (pinned) `shadcn` package. */
export function readShadcnTailwindCss(root: string): VendoredSource {
  const dir = path.join(root, "node_modules", "shadcn")
  const pkg = JSON.parse(
    readFileSync(path.join(dir, "package.json"), "utf8")
  ) as {
    version: string
    license?: string
  }
  const file = "dist/tailwind.css"
  const licensePath = path.join(dir, "LICENSE.md")
  return {
    package: "shadcn",
    version: pkg.version,
    file,
    text: readFileSync(path.join(dir, file), "utf8"),
    license: pkg.license ?? null,
    licenseText: existsSync(licensePath)
      ? readFileSync(licensePath, "utf8")
      : null,
  }
}
