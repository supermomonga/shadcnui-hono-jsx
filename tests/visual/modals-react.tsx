/** @jsxImportSource react */
/**
 * The same dialog with upstream shadcn/ui (Base UI) components, rendered in
 * the browser. Bundled by render.ts for dialog.spec.ts.
 */
import { createRoot } from "react-dom/client"
import { Button } from "./.upstream/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./.upstream/dialog"
import { Input } from "./.upstream/input"
import { Label } from "./.upstream/label"

function DialogDemo() {
  return (
    <main className="flex items-center gap-4 p-8">
      <Dialog>
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
          <div className="grid gap-3">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="Pedro Duarte" />
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

const root = document.getElementById("root")
if (root) createRoot(root).render(<DialogDemo />)
