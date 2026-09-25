const build = await Bun.build({
  entrypoints: [`${import.meta.dir}/main.tsx`],
  outdir: import.meta.dir,
  target: "browser",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
})
if (!build.success) console.log(build.logs)
