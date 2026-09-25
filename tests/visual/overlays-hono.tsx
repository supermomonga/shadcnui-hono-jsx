/**
 * Overlay demos (modals and popovers) rendered on the server with the
 * generated Hono JSX components (no client JavaScript). Used by
 * modals.spec.ts and popover.spec.ts; overlays-react.tsx renders the same
 * demos with upstream shadcn/ui.
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog"
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
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../../components/ui/popover"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet"

function DialogDemo() {
  return (
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
  )
}

function AlertDialogDemo() {
  return (
    <AlertDialog id="delete-account">
      <AlertDialogTrigger render={<Button variant="outline" />}>
        Delete account
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function SheetDemo({ side }: { side: "right" | "bottom" }) {
  return (
    <Sheet id={`sheet-${side}`}>
      <SheetTrigger render={<Button variant="outline" />}>
        Open {side}
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div class="grid flex-1 auto-rows-min gap-6 px-4">
          <div class="grid gap-3">
            <Label for={`name-${side}`}>Name</Label>
            <Input id={`name-${side}`} value="Pedro Duarte" />
          </div>
        </div>
        <SheetFooter>
          <Button type="submit">Save changes</Button>
          <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function PopoverDemo() {
  return (
    <>
      <Popover id="dimensions">
        <PopoverTrigger render={<Button variant="outline" class="w-32" />}>
          Dimensions
        </PopoverTrigger>
        <PopoverContent class="w-80">
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>
              Set the dimensions for the layer.
            </PopoverDescription>
          </PopoverHeader>
          <div class="grid grid-cols-3 items-center gap-4">
            <Label for="width">Width</Label>
            <Input id="width" value="100%" class="col-span-2 h-8" />
          </div>
        </PopoverContent>
      </Popover>
      <Popover id="details">
        <PopoverTrigger render={<Button variant="outline" />}>
          Details
        </PopoverTrigger>
        <PopoverContent side="right" align="start" sideOffset={8}>
          <PopoverHeader>
            <PopoverTitle>Details</PopoverTitle>
            <PopoverDescription>Placed to the right.</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </>
  )
}

function Page({ children }: { children?: unknown }) {
  return (
    <main class="flex items-center gap-4 p-8">
      {children}
      <button type="button" id="after">
        After
      </button>
    </main>
  )
}

export const OVERLAY_DEMOS = {
  dialog: () => (
    <Page>
      <DialogDemo />
    </Page>
  ),
  "alert-dialog": () => (
    <Page>
      <AlertDialogDemo />
    </Page>
  ),
  popover: () => (
    <main class="flex min-h-96 items-center gap-24 p-8 pl-48">
      <PopoverDemo />
      <button type="button" id="after">
        After
      </button>
    </main>
  ),
  sheet: () => (
    <Page>
      <SheetDemo side="right" />
      <SheetDemo side="bottom" />
    </Page>
  ),
}
