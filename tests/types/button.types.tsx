import { Button, buttonVariants } from "../../components/ui/button"

export const valid = [
  <Button>Save</Button>,
  <Button
    type="submit"
    disabled
    variant="outline"
    size="icon-sm"
    class="w-full"
    id="save"
    aria-label="Save"
    data-icon="inline-end"
  >
    <span>Save</span>
  </Button>,
  <Button variant={undefined} size={undefined} />,
]

export const classes: string = buttonVariants({ variant: "ghost", size: "lg" })

// @ts-expect-error React's className is not accepted; use class.
export const e1 = <Button className="x" />
// @ts-expect-error class must be a string (Hono's Promise<string> is not supported).
export const e2 = <Button class={Promise.resolve("x")} />
// @ts-expect-error render (element replacement) is not supported.
export const e3 = <Button render={<a href="/" />} />
// @ts-expect-error asChild is not supported.
export const e4 = <Button asChild />
// @ts-expect-error unknown variant.
export const e5 = <Button variant="primary" />
// @ts-expect-error unknown size.
export const e6 = <Button size="xl" />
// @ts-expect-error invalid button type.
export const e7 = <Button type="link" />
