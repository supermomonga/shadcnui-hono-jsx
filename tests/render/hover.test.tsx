import { describe, expect, test } from "bun:test"
import { Button } from "../../components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../../components/ui/hover-card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip"
import { query, render } from "../helpers/render"

describe("Tooltip and HoverCard (manual popovers opened by /shadcn/hover.js)", () => {
  test("a tooltip describes its trigger and takes the provider's delay", async () => {
    const html = await render(
      <TooltipProvider>
        <Tooltip id="tip">
          <TooltipTrigger render={<Button variant="outline" />}>
            Save
          </TooltipTrigger>
          <TooltipContent>Saves the file</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    const [trigger] = await query(html, '[data-slot="tooltip-trigger"]')
    expect(trigger?.attributes).toMatchObject({
      "aria-describedby": "tip",
      "data-hover-popup": "tip",
      "data-delay": "0",
      "data-close-delay": "0",
      style: "anchor-name:--tip",
    })
    const [popup] = await query(html, '[data-slot="tooltip-content"]')
    expect(popup?.attributes).toMatchObject({
      id: "tip",
      popover: "manual",
      role: "tooltip",
      "data-side": "top",
    })
    const [arrow] = await query(
      html,
      '[data-slot="tooltip-content"] > [aria-hidden="true"]'
    )
    expect(arrow?.attributes.style).toContain(
      "position:absolute;left:0;right:0;margin-inline:auto"
    )
  })

  test("a hover card trigger is a link with Base UI's default delays", async () => {
    const html = await render(
      <HoverCard id="card">
        <HoverCardTrigger href="/users/nextjs">@nextjs</HoverCardTrigger>
        <HoverCardContent>Profile</HoverCardContent>
      </HoverCard>
    )
    const [trigger] = await query(html, '[data-slot="hover-card-trigger"]')
    expect(trigger?.tag).toBe("a")
    expect(trigger?.attributes).toMatchObject({
      href: "/users/nextjs",
      "data-delay": "600",
      "data-close-delay": "300",
    })
    const [popup] = await query(html, '[data-slot="hover-card-content"]')
    expect(popup?.attributes).not.toHaveProperty("role")
    // align="center" with alignOffset 4 shifts the whole card.
    expect(popup?.attributes.style).toContain("translate:4px 0")
  })
})
