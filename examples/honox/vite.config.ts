import path from "node:path"
import build from "@hono/vite-build/bun"
import adapter from "@hono/vite-dev-server/bun"
import tailwindcss from "@tailwindcss/vite"
import honox from "honox/vite"
import { defineConfig } from "vite"

const repositoryRoot = path.resolve(import.meta.dirname, "../..")

export default defineConfig({
  plugins: [
    honox({
      devServer: { adapter },
      client: { input: ["/app/client.ts", "/app/style.css"] },
    }),
    tailwindcss(),
    build(),
  ],
  resolve: {
    // In a real project the CLI installs components into ./components/ui.
    alias: { "@/components": path.join(repositoryRoot, "components") },
  },
  server: { fs: { allow: [repositoryRoot] } },
  // The CLI installs client scripts into ./public/shadcn; this example
  // serves the repository's copy.
  publicDir: path.join(repositoryRoot, "public"),
})
