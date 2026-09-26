import { describe, expect, test } from "bun:test"
import { transformDocs } from "../../src/site/docs"
import { previewNames } from "../../src/upstream/site-sources"

const context = {
  components: new Set(["button", "spinner"]),
  pages: new Set(["rtl", "installation"]),
}

const upstream = `---
title: Button
description: Displays a button.
base: base
component: true
links:
  doc: https://base-ui.com/react/components/button
  api: https://base-ui.com/react/components/button#api-reference
---

import { InfoIcon } from "lucide-react"

<ComponentPreview
  styleName="base-nova"
  name="button-demo"
  className="w-full"
/>

## Installation

<CodeTabs>
\`\`\`bash
npx shadcn@latest add button
\`\`\`
</CodeTabs>

## Usage

\`\`\`tsx
import { ArrowUpIcon } from "lucide-react"
<Button className="w-full">Button</Button>
\`\`\`

See [Spinner](/docs/components/base/spinner), [Chart](/docs/components/base/chart), the [RTL guide](/docs/rtl) and [forms](/docs/forms/react-hook-form).

<Button asChild size="sm">
  <a href="/view/base-nova/sidebar-rtl">View <InfoIcon /></a>
</Button>

## API Reference

| Prop | Type |
| --- | --- |
| \`render\` | \`React.ReactElement\` |

## Changelog

Removed.
`

describe("transformDocs", () => {
  const { text, icons } = transformDocs("button", upstream, context)

  test("keeps the title and description, and links upstream", () => {
    expect(text).toStartWith(`---
title: Button
description: Displays a button.
upstream: https://ui.shadcn.com/docs/components/base/button
api: https://base-ui.com/react/components/button#api-reference
---`)
  })

  test("installs with this project's CLI and adds notes", () => {
    expect(text).toContain(
      '## Installation\n\n<ComponentInstall name="button" />'
    )
    expect(text).not.toContain("npx shadcn@latest")
    expect(text).toContain(
      '## Notes\n\n<ComponentNotes name="button" />\n\n## API Reference'
    )
    expect(text).not.toContain("## Changelog")
  })

  test("translates previews, snippets, links and asChild buttons", () => {
    expect(text).toContain(
      '<ComponentPreview\n  name="button-demo"\n  class="w-full"\n/>'
    )
    expect(text).toContain('<Button class="w-full">Button</Button>')
    expect(text).toContain('import { ArrowUpIcon } from "@/components/icons"')
    expect(text).toContain("[Spinner](/docs/components/spinner)")
    expect(text).toContain(
      "[Chart](https://ui.shadcn.com/docs/components/base/chart)"
    )
    expect(text).toContain("[RTL guide](/docs/rtl)")
    expect(text).toContain(
      "[forms](https://ui.shadcn.com/docs/forms/react-hook-form)"
    )
    expect(text).toContain(
      '<Button size="sm" render={<a href="https://ui.shadcn.com/view/base-nova/sidebar-rtl" />}>View <InfoIcon /></Button>'
    )
    expect(text).toContain("`JSX element`")
    expect(icons).toEqual([{ name: "InfoIcon", source: "lucide" }])
  })
})

test("previewNames lists the examples of a page once, in order", () => {
  expect(
    previewNames(`<ComponentPreview styleName="x" name="a" />
<ComponentPreview
  name="b"
  direction="rtl"
/>
<ComponentPreview name="a" />`)
  ).toEqual(["a", "b"])
})
