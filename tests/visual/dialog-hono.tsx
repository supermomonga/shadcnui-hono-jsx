/**
 * Dialog demo rendered on the server with the generated Hono JSX components
 * (no client JavaScript). Used by dialog.spec.ts.
 */
import { Button } from "../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

export function DialogDemo() {
  return (
    <main class="flex items-center gap-4 p-8">
      <Dialog id="edit-profile">
        <DialogTrigger render={<Button variant="outline" />}>
          Edit profile
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-3">
            <Label for="name">Name</Label>
            <Input id="name" value="Pedro Duarte" />
          </div>
          <DialogFooter showCloseButton>
            <Button>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <button type="button" id="after">
        After
      </button>
    </main>
  )
}
