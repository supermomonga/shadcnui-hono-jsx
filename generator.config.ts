import type { GeneratorConfig } from "./generator/src/config"

export const config: GeneratorConfig = {
  repository: "supermomonga/shadcnui-hono-jsx",
  style: "base-nova",
  registryBaseUrl: "https://ui.shadcn.com/r",
  themeUrl:
    "https://ui.shadcn.com/init?base=base&style=nova&baseColor=neutral&theme=neutral&iconLibrary=lucide&font=geist&rtl=false&menuAccent=subtle&menuColor=default&radius=default",
  licenseUrl: "https://raw.githubusercontent.com/shadcn-ui/ui/main/LICENSE.md",
  trackedTypes: ["registry:ui"],
  components: [
    "alert",
    "aspect-ratio",
    "badge",
    "bubble",
    "button",
    "card",
    "empty",
    "input",
    "kbd",
    "label",
    "marker",
    "message",
    "separator",
    "skeleton",
    "table",
    "textarea",
  ],
}
