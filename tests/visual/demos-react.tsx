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
import { Avatar, AvatarFallback, AvatarImage } from "./.upstream/avatar"
import { Button, buttonVariants } from "./.upstream/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./.upstream/collapsible"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "./.upstream/combobox"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./.upstream/context-menu"
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./.upstream/hover-card"
import { Input } from "./.upstream/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./.upstream/input-group"
import { Label } from "./.upstream/label"
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "./.upstream/menubar"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./.upstream/navigation-menu"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./.upstream/popover"
import { ScrollArea, ScrollBar } from "./.upstream/scroll-area"
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
import { Slider } from "./.upstream/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./.upstream/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./.upstream/tooltip"

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

function ContextMenuDemo() {
  return (
    <main className="flex items-start gap-8 p-8">
      <ContextMenu>
        <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <ContextMenuItem>
            Back
            <ContextMenuShortcut>⌘[</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem disabled>Forward</ContextMenuItem>
          <ContextMenuItem>Reload</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>More tools</ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-44">
              <ContextMenuItem>Save page</ContextMenuItem>
              <ContextMenuItem>Developer tools</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem defaultChecked>
            Show bookmarks
          </ContextMenuCheckboxItem>
          <ContextMenuRadioGroup defaultValue="pedro">
            <ContextMenuLabel inset>People</ContextMenuLabel>
            <ContextMenuRadioItem value="pedro">Pedro</ContextMenuRadioItem>
            <ContextMenuRadioItem value="colm">Colm</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
      <button type="button" id="after">
        After
      </button>
    </main>
  )
}

function MenubarDemo() {
  return (
    <main className="flex flex-col items-start gap-8 p-8">
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger className="w-16 justify-center">File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              New Tab <MenubarShortcut>⌘T</MenubarShortcut>
            </MenubarItem>
            <MenubarItem disabled>New Incognito Window</MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>Share</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Email link</MenubarItem>
                <MenubarItem>Messages</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem>Print</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="w-16 justify-center">View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem defaultChecked>
              Always Show Bookmarks Bar
            </MenubarCheckboxItem>
            <MenubarCheckboxItem>Always Show Full URLs</MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarItem inset>Reload</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="w-16 justify-center">
            Profiles
          </MenubarTrigger>
          <MenubarContent>
            <MenubarRadioGroup defaultValue="benoit">
              <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
              <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <button type="button" id="after">
        After
      </button>
    </main>
  )
}

function HoverDemo() {
  return (
    <main className="flex items-center gap-24 p-24 pl-48">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={<Button variant="outline" className="w-28" />}
          >
            Hover
          </TooltipTrigger>
          <TooltipContent className="w-32 justify-center">
            <p>Add to library</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <HoverCard>
        <HoverCardTrigger render={<Button variant="link" className="w-24" />}>
          @nextjs
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <p className="text-sm font-semibold">@nextjs</p>
          <p className="text-sm">
            The React Framework created and maintained by @vercel.
          </p>
        </HoverCardContent>
      </HoverCard>
      <button type="button" id="after">
        After
      </button>
    </main>
  )
}

const FRAMEWORKS = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"]

function FrameworkList() {
  return (
    <ComboboxContent>
      <ComboboxEmpty>No items found.</ComboboxEmpty>
      <ComboboxList>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  )
}

function ComboboxChipsDemo() {
  const anchor = useComboboxAnchor()
  return (
    <Combobox
      multiple
      autoHighlight
      items={FRAMEWORKS}
      defaultValue={["Next.js"]}
      name="stack"
    >
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(values: string[]) => (
            <>
              {values.map((value) => (
                <ComboboxChip key={value}>{value}</ComboboxChip>
              ))}
              <ComboboxChipsInput />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

function ComboboxDemo() {
  return (
    <main className="flex flex-col gap-8 p-8">
      <form id="combobox-form" className="flex w-64 flex-col gap-8">
        <Combobox items={FRAMEWORKS} name="framework">
          <ComboboxInput placeholder="Select a framework" />
          <FrameworkList />
        </Combobox>
        <Combobox items={FRAMEWORKS} defaultValue="Remix" name="clearable">
          <ComboboxInput placeholder="Clearable" showClear />
          <FrameworkList />
        </Combobox>
        <div className="w-80">
          <ComboboxChipsDemo />
        </div>
      </form>
      <button type="button" id="after">
        After
      </button>
    </main>
  )
}

function NavigationMenuDemo() {
  return (
    <main className="flex flex-col items-start gap-8 p-8">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-96 gap-1">
                <li>
                  <NavigationMenuLink href="#intro">
                    Introduction
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#install">
                    Installation
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Components</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-72 grid-cols-2 gap-1">
                <li>
                  <NavigationMenuLink href="#alert">Alert</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#button" active>
                    Button
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#card">Card</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="#docs"
              className={navigationMenuTriggerStyle()}
            >
              Docs
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <button type="button" id="after">
        After
      </button>
    </main>
  )
}

const AVATAR_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#e11d48"/></svg>'
)}`

function AvatarDemo() {
  return (
    <main className="flex items-center gap-4 p-8">
      <Avatar>
        <AvatarImage src={AVATAR_IMAGE} alt="Loaded" />
        <AvatarFallback>LD</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarImage src="/missing-avatar.png" alt="Broken" />
        <AvatarFallback>BR</AvatarFallback>
      </Avatar>
      <Avatar size="sm">
        <AvatarFallback>FB</AvatarFallback>
      </Avatar>
    </main>
  )
}

const SCROLL_ITEMS = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`)
const SCROLL_TAGS = Array.from({ length: 12 }, (_, i) => `Tag ${i + 1}`)

function ScrollAreaDemo() {
  return (
    <main className="flex items-start gap-8 p-8">
      <ScrollArea className="h-40 w-48 rounded-md border">
        <div className="p-4">
          {SCROLL_ITEMS.map((item) => (
            <div key={item} className="h-6 text-sm">
              {item}
            </div>
          ))}
        </div>
      </ScrollArea>
      <ScrollArea className="w-48 rounded-md border">
        <div className="flex w-max gap-2 p-4">
          {SCROLL_TAGS.map((tag) => (
            <div key={tag} className="w-16 text-sm">
              {tag}
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <ScrollArea className="h-24 w-48 rounded-md border">
        <div className="p-4 text-sm">Short</div>
      </ScrollArea>
    </main>
  )
}

function CollapsibleDemo() {
  return (
    <main className="p-8">
      <Collapsible className="flex w-80 flex-col gap-2">
        <div className="flex items-center justify-between gap-4 px-4">
          <h4 className="text-sm font-semibold">Order #4189</h4>
          <CollapsibleTrigger
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Toggle
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border px-4 py-2 text-sm">
          Always visible
        </div>
        <CollapsibleContent className="rounded-md border px-4 py-2 text-sm">
          Shipped on September 12
        </CollapsibleContent>
      </Collapsible>
    </main>
  )
}

function InputGroupDemo() {
  return (
    <main className="flex w-96 flex-col gap-6 p-8">
      <InputGroup>
        <InputGroupInput placeholder="example.com" />
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="Search" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton>Clear</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupTextarea placeholder="Message" />
        <InputGroupAddon align="block-end">
          <InputGroupText>0/280</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </main>
  )
}

function SliderDemo() {
  return (
    <main className="flex flex-col gap-10 p-8 pl-24">
      <Slider
        defaultValue={[33]}
        max={100}
        step={1}
        className="w-80"
        aria-label="Volume"
      />
      <Slider
        defaultValue={[25, 75]}
        max={100}
        step={5}
        className="w-80"
        aria-label="Price"
      />
      <Slider
        defaultValue={[40]}
        disabled
        className="w-80"
        aria-label="Disabled"
      />
      <div className="flex h-40 gap-8">
        <Slider
          defaultValue={[60]}
          orientation="vertical"
          aria-label="Vertical"
        />
      </div>
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
  slider: () => <SliderDemo />,
  "input-group": () => <InputGroupDemo />,
  combobox: () => <ComboboxDemo />,
  "navigation-menu": () => <NavigationMenuDemo />,
  avatar: () => <AvatarDemo />,
  collapsible: () => <CollapsibleDemo />,
  "scroll-area": () => <ScrollAreaDemo />,
  hover: () => <HoverDemo />,
  menubar: () => <MenubarDemo />,
  "context-menu": () => <ContextMenuDemo />,
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
