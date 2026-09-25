import { describe, expect, test } from "bun:test"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumb"
import {
  NativeSelect,
  NativeSelectOption,
} from "../../components/ui/native-select"
import { Spinner } from "../../components/ui/spinner"
import { query, render, renderOne } from "../helpers/render"

describe("inline Lucide icons", () => {
  test("decorative icons are hidden from assistive technology", async () => {
    const html = await render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>Home</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    const svgs = await query(html, "svg")
    expect(svgs.map((svg) => svg.attributes.class)).toEqual([
      "lucide lucide-chevron-right",
      "lucide lucide-ellipsis lucide-more-horizontal",
    ])
    for (const svg of svgs) {
      expect(svg.attributes).toMatchObject({
        "aria-hidden": "true",
        stroke: "currentColor",
      })
    }
    // HTMLRewriter lowercases attribute names, so check the markup itself.
    expect(html).toContain('viewBox="0 0 24 24"')
  })

  test("labelled icons stay visible to assistive technology", async () => {
    const spinner = await renderOne(<Spinner />, "svg")
    expect(spinner.attributes).toMatchObject({
      role: "status",
      "aria-label": "Loading",
      "data-slot": "spinner",
    })
    expect(spinner.attributes).not.toHaveProperty("aria-hidden")
    expect(spinner.classes).toEqual(
      expect.arrayContaining(["lucide", "lucide-loader-circle", "animate-spin"])
    )
  })

  test("native select renders a select with a chevron", async () => {
    const html = await render(
      <NativeSelect name="fruit">
        <NativeSelectOption value="apple">Apple</NativeSelectOption>
      </NativeSelect>
    )
    const [select] = await query(html, "select")
    expect(select?.attributes).toMatchObject({
      name: "fruit",
      "data-slot": "native-select",
    })
    const [chevron] = await query(html, "svg")
    expect(chevron?.classes).toContain("lucide-chevron-down")
  })
})
