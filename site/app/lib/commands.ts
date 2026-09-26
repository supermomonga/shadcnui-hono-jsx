export const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const
export type PackageManager = (typeof PACKAGE_MANAGERS)[number]

/**
 * The same command for every package manager, from its npm form, like the
 * shadcn/ui website: `npx x` runs a package, `npm install x` adds one,
 * `npm create x` scaffolds a project and `npm run x` runs a script.
 */
export function commandVariants(
  npm: string
): Record<PackageManager, string> | null {
  const forms: [string, Record<Exclude<PackageManager, "npm">, string>][] = [
    ["npm install", { pnpm: "pnpm add", yarn: "yarn add", bun: "bun add" }],
    [
      "npm create",
      { pnpm: "pnpm create", yarn: "yarn create", bun: "bun create" },
    ],
    ["npm run", { pnpm: "pnpm", yarn: "yarn", bun: "bun run" }],
    ["npx", { pnpm: "pnpm dlx", yarn: "yarn dlx", bun: "bunx" }],
  ]
  for (const [prefix, others] of forms) {
    if (npm !== prefix && !npm.startsWith(`${prefix} `)) continue
    const rest = npm.slice(prefix.length)
    return {
      pnpm: others.pnpm + rest,
      npm,
      yarn: others.yarn + rest,
      bun: others.bun + rest,
    }
  }
  return null
}
