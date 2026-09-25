import { Button, buttonVariants } from "../../components/ui/button"
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
// DialogTrigger supports Base UI's render prop, like upstream.
export const asButton = (
  <Dialog>
    <DialogTrigger render={<Button variant="outline" />}>Open</DialogTrigger>
  </Dialog>
)
// @ts-expect-error className is not accepted.
export const e3 = <DialogContent className="x" />
