/** @jsxImportSource react */
/**
 * The interactive demos of demos-hono.tsx with upstream shadcn/ui (Base UI)
 * components, rendered in the browser. Bundled by render.ts; the page picks a
 * demo with `<div id="root" data-demo="…">`.
 */
import type { ReactNode } from "react"
import { createRoot } from "react-dom/client"
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
} from "./.upstream/alert-dialog"
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./.upstream/dropdown-menu"
import { Input } from "./.upstream/input"
import { Label } from "./.upstream/label"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./.upstream/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./.upstream/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./.upstream/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./.upstream/tabs"

function DialogDemo() {
  return (
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
  )
}

function AlertDialogDemo() {
  return (
    <AlertDialog>
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
    <Sheet>
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
        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <div className="grid gap-3">
            <Label htmlFor={`name-${side}`}>Name</Label>
            <Input id={`name-${side}`} defaultValue="Pedro Duarte" />
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
      <Popover>
        <PopoverTrigger render={<Button variant="outline" className="w-32" />}>
          Dimensions
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>
              Set the dimensions for the layer.
            </PopoverDescription>
          </PopoverHeader>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="width">Width</Label>
            <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
          </div>
        </PopoverContent>
      </Popover>
      <Popover>
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

const FRUITS = {
  apple: "Apple",
  banana: "Banana",
  blueberry: "Blueberry",
  carrot: "Carrot",
  leek: "Leek",
}
const SIZES = { small: "Small", medium: "Medium", large: "Large" }

function SelectDemo() {
  return (
    <main className="flex items-start gap-8 p-8 pl-48">
      <Select name="fruit" items={FRUITS}>
        <SelectTrigger id="fruit" className="w-45">
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="blueberry">Blueberry</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Vegetables</SelectLabel>
            <SelectItem value="carrot">Carrot</SelectItem>
            <SelectItem value="leek" disabled>
              Leek
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select name="size" defaultValue="medium" items={SIZES}>
        <SelectTrigger id="size" size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="small">Small</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="large">Large</SelectItem>
        </SelectContent>
      </Select>
      <button type="button" id="after">
        After
      </button>
    </main>
  )
}

function TabsDemo() {
  return (
    <main className="flex flex-col gap-10 p-8">
      <Tabs defaultValue="account" className="w-96">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="billing" disabled>
            Billing
          </TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          Make changes to your account here.
        </TabsContent>
        <TabsContent value="password">Change your password here.</TabsContent>
        <TabsContent value="billing">Billing is disabled.</TabsContent>
        <TabsContent value="team">Invite your team.</TabsContent>
      </Tabs>
      <Tabs defaultValue="overview" orientation="vertical" className="w-96">
        <TabsList variant="line" activateOnFocus>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview of your project.</TabsContent>
        <TabsContent value="analytics">Traffic and conversions.</TabsContent>
        <TabsContent value="reports">Monthly reports.</TabsContent>
      </Tabs>
      <button type="button" id="after">
        After
      </button>
    </main>
  )
}

function DropdownMenuDemo() {
  return (
    <main className="flex items-start gap-8 p-8 pl-48">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" className="w-24" />}
        >
          Open
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem>
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem disabled>Settings</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <DropdownMenuCheckboxItem defaultChecked>
              Status bar
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>Activity bar</DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup defaultValue="bottom">
            <DropdownMenuLabel>Panel position</DropdownMenuLabel>
            <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Email</DropdownMenuItem>
              <DropdownMenuItem>Message</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button type="button" id="after">
        After
      </button>
    </main>
  )
}

function Page({ children }: { children: ReactNode }) {
  return (
    <main className="flex items-center gap-4 p-8">
      {children}
      <button type="button" id="after">
        After
      </button>
    </main>
  )
}

const DEMOS: Record<string, () => ReactNode> = {
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
    <main className="flex min-h-96 items-center gap-24 p-8 pl-48">
      <PopoverDemo />
      <button type="button" id="after">
        After
      </button>
    </main>
  ),
  select: () => <SelectDemo />,
  "dropdown-menu": () => <DropdownMenuDemo />,
  tabs: () => <TabsDemo />,
  sheet: () => (
    <Page>
      <SheetDemo side="right" />
      <SheetDemo side="bottom" />
    </Page>
  ),
}

const root = document.getElementById("root")
const demo = DEMOS[root?.dataset.demo ?? ""]
if (root && demo) createRoot(root).render(demo())
