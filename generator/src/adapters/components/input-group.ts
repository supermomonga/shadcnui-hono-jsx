/**
 * InputGroup: the addon's `onClick` (focus the input unless a button was
 * pressed) becomes the client script `public/shadcn/input-group.js`
 * (docs/adr/0025). The step fails when upstream changes the handler, so the
 * script is reviewed together with it.
 */
import { SyntaxKind } from "ts-morph"
import { TransformError, type TransformStep } from "../../transformers/context"
import type { ComponentAdapter } from "./types"

/** The upstream handler the script reproduces, whitespace removed. */
const ADDON_CLICK =
  'onClick={(e)=>{if((e.targetasHTMLElement).closest("button")){return}e.currentTarget.parentElement?.querySelector("input")?.focus()}}'

const dropAddonClick: TransformStep = {
  name: "input-group:addon-click",
  run(ctx) {
    const addon = ctx.sf.getFunction("InputGroupAddon")
    const handlers =
      addon
        ?.getDescendantsOfKind(SyntaxKind.JsxAttribute)
        .filter((a) => a.getNameNode().getText() === "onClick") ?? []
    const [handler] = handlers
    if (
      handlers.length !== 1 ||
      !handler ||
      handler.getText().replace(/\s+/g, "") !== ADDON_CLICK
    ) {
      throw new TransformError(
        ctx,
        this.name,
        "InputGroupAddon's onClick changed upstream; update public/shadcn/input-group.js and this adapter"
      )
    }
    handler.remove()
    ctx.log.push(
      `${this.name}: InputGroupAddon onClick -> /shadcn/input-group.js`
    )
  },
}

export const inputGroupAdapter: ComponentAdapter = {
  kind: "script",
  behaviors: ["input-group"],
  resolves: ["event-handler:onClick"],
  notes: [
    'Clicking an addon focuses the input with the client script `/shadcn/input-group.js` (`<script type="module" src="/shadcn/input-group.js">`); without it the addon is not clickable.',
  ],
  steps: [{ after: "remove-directives", step: dropAddonClick }],
}
