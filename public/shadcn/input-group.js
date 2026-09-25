// @ts-check
/**
 * Input groups: clicking an addon (an icon, text or kbd beside the input)
 * focuses the group's input unless a button in the addon was pressed, like
 * upstream shadcn/ui.
 */
import { delegate } from "./core.js"

delegate("click", '[data-slot="input-group-addon"]', (event, addon) => {
  if (event.target instanceof Element && event.target.closest("button")) {
    return
  }
  addon.parentElement?.querySelector("input")?.focus()
})
