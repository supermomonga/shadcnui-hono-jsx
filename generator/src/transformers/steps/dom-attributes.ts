import { Node, SyntaxKind } from "ts-morph"
import type { TransformStep } from "../context"

/**
 * React camelCase DOM attributes that Hono JSX renders verbatim (it only
 * normalizes className, htmlFor, crossOrigin, httpEquiv, itemProp,
 * fetchPriority, noModule and formAction).
 */
export const CAMEL_CASE_DOM_ATTRIBUTES: Readonly<Record<string, string>> = {
  accessKey: "accesskey",
  autoCapitalize: "autocapitalize",
  autoComplete: "autocomplete",
  autoFocus: "autofocus",
  colSpan: "colspan",
  contentEditable: "contenteditable",
  dateTime: "datetime",
  encType: "enctype",
  enterKeyHint: "enterkeyhint",
  formNoValidate: "formnovalidate",
  inputMode: "inputmode",
  maxLength: "maxlength",
  minLength: "minlength",
  noValidate: "novalidate",
  readOnly: "readonly",
  rowSpan: "rowspan",
  spellCheck: "spellcheck",
  srcSet: "srcset",
  tabIndex: "tabindex",
  useMap: "usemap",
}

export const domAttributes: TransformStep = {
  name: "dom-attributes",
  run(ctx) {
    const attributes = ctx.sf.getDescendantsOfKind(SyntaxKind.JsxAttribute)
    for (const attribute of attributes.reverse()) {
      const element = attribute.getParent().getParent()
      const tag =
        Node.isJsxOpeningElement(element) ||
        Node.isJsxSelfClosingElement(element)
          ? element.getTagNameNode().getText()
          : ""
      if (!/^[a-z]/.test(tag)) continue
      const name = attribute.getNameNode().getText()
      const lower = CAMEL_CASE_DOM_ATTRIBUTES[name]
      if (!lower) continue
      attribute.getNameNode().replaceWithText(lower)
      ctx.log.push(`dom-attributes: ${name} -> ${lower}`)
    }
  },
}
