/**
 * Interactive demos rendered on the server with the generated Hono JSX
 * components, for the behavior specs (modals, popover, select, tabs).
 * demos-react.tsx renders the same demos with upstream shadcn/ui. Pages load
 * only the client scripts listed in DEMO_SCRIPTS.
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs"

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

function SelectDemo() {
  return (
    <main class="flex items-start gap-8 p-8 pl-48">
      <Select name="fruit">
        <SelectTrigger id="fruit" class="w-45">
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
      <Select name="size" defaultValue="medium">
        <SelectTrigger id="size" size="sm" class="w-32">
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
    <main class="flex flex-col gap-10 p-8">
      <Tabs defaultValue="account" class="w-96">
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
      <Tabs defaultValue="overview" orientation="vertical" class="w-96">
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

export const DEMOS = {
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
  select: () => <SelectDemo />,
  tabs: () => <TabsDemo />,
  sheet: () => (
    <Page>
      <SheetDemo side="right" />
      <SheetDemo side="bottom" />
    </Page>
  ),
}

/** Client scripts (public/shadcn/) each demo page loads. */
export const DEMO_SCRIPTS: Readonly<Record<string, readonly string[]>> = {
  tabs: ["tabs"],
}
