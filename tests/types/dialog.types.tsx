import { buttonVariants } from "../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"

export const valid = [
  <Dialog id="settings">
    <DialogTrigger class={buttonVariants()}>Open</DialogTrigger>
    <DialogContent showCloseButton={false} class="sm:max-w-lg">
      <DialogTitle>Settings</DialogTitle>
      <DialogFooter showCloseButton />
    </DialogContent>
  </Dialog>,
]

// @ts-expect-error controlled state is not supported (no JavaScript).
export const e1 = <Dialog open />
// @ts-expect-error render (element replacement) is not supported.
export const e2 = <DialogTrigger render={<button type="button" />} />
// @ts-expect-error className is not accepted.
export const e3 = <DialogContent className="x" />
