import type { GeneratorConfig } from "./generator/src/config"

export const config: GeneratorConfig = {
  repository: "supermomonga/shadcnui-hono-jsx",
  style: "base-nova",
  registryBaseUrl: "https://ui.shadcn.com/r",
  themeUrl:
    "https://ui.shadcn.com/init?base=base&style=nova&baseColor=neutral&theme=neutral&iconLibrary=lucide&font=geist&rtl=false&menuAccent=subtle&menuColor=default&radius=default",
  trackedTypes: ["registry:ui"],
  components: ["button"],
}
