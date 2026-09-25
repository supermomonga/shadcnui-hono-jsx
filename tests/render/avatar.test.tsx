import { describe, expect, test } from "bun:test"
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar"
import { query, render } from "../helpers/render"

describe("Avatar (image over the fallback, /shadcn/avatar.js)", () => {
  test("renders the image over the fallback", async () => {
    const html = await render(
      <Avatar size="lg">
        <AvatarImage src="/me.png" alt="Me" />
        <AvatarFallback delay={600}>ME</AvatarFallback>
        <AvatarBadge />
      </Avatar>
    )
    const [root] = await query(html, '[data-slot="avatar"]')
    expect(root?.tag).toBe("span")
    expect(root?.attributes["data-size"]).toBe("lg")
    const [image] = await query(html, '[data-slot="avatar-image"]')
    expect(image?.attributes).toMatchObject({ src: "/me.png", alt: "Me" })
    expect(image?.attributes.style).toBe("position:absolute;inset:0")
    const [fallback] = await query(html, '[data-slot="avatar-fallback"]')
    expect(fallback?.attributes).not.toHaveProperty("delay")
    expect(fallback?.attributes).not.toHaveProperty("hidden")
  })
})
