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
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Button, buttonVariants } from "../../components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/ui/collapsible"
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
} from "../../components/ui/combobox"
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
} from "../../components/ui/context-menu"
import { DatePickerLite } from "../../components/ui/date-picker-lite"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../../components/ui/drawer"
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
} from "../../components/ui/dropdown-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../../components/ui/hover-card"
import { Input } from "../../components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "../../components/ui/input-group"
import { InputOTPLite } from "../../components/ui/input-otp-lite"
import { Label } from "../../components/ui/label"
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
} from "../../components/ui/menubar"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "../../components/ui/navigation-menu"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../../components/ui/popover"
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area"
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
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "../../components/ui/sidebar"
import { Slider } from "../../components/ui/slider"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs"
import { Toaster } from "../../components/ui/toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip"

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
    <main class="flex items-start gap-8 p-8 ps-48">
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

function DropdownMenuDemo() {
  return (
    <main class="flex items-start gap-8 p-8 ps-48">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" class="w-24" />}>
          Open
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
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
    <main class="flex items-start gap-8 p-8">
      <ContextMenu>
        <ContextMenuTrigger class="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent class="w-52">
          <ContextMenuItem>
            Back
            <ContextMenuShortcut>⌘[</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem disabled>Forward</ContextMenuItem>
          <ContextMenuItem>Reload</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>More tools</ContextMenuSubTrigger>
            <ContextMenuSubContent class="w-44">
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
    <main class="flex flex-col items-start gap-8 p-8">
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger class="w-16 justify-center">File</MenubarTrigger>
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
          <MenubarTrigger class="w-16 justify-center">View</MenubarTrigger>
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
          <MenubarTrigger class="w-16 justify-center">Profiles</MenubarTrigger>
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
    <main class="flex items-center gap-24 p-24 ps-48">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" class="w-28" />}>
            Hover
          </TooltipTrigger>
          <TooltipContent class="w-32 justify-center">
            <p>Add to library</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <HoverCard>
        <HoverCardTrigger render={<Button variant="link" class="w-24" />}>
          @nextjs
        </HoverCardTrigger>
        <HoverCardContent class="w-80">
          <p class="text-sm font-semibold">@nextjs</p>
          <p class="text-sm">
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
        {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
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
      <ComboboxChips ref={anchor} class="w-full">
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
          {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

function ComboboxDemo() {
  return (
    <main class="flex flex-col gap-8 p-8">
      <form id="combobox-form" class="flex w-64 flex-col gap-8">
        <Combobox items={FRAMEWORKS} name="framework">
          <ComboboxInput placeholder="Select a framework" />
          <FrameworkList />
        </Combobox>
        <Combobox items={FRAMEWORKS} defaultValue="Remix" name="clearable">
          <ComboboxInput placeholder="Clearable" showClear />
          <FrameworkList />
        </Combobox>
        <div class="w-80">
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
    <main class="flex flex-col items-start gap-8 p-8">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="grid w-96 gap-1">
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
              <ul class="grid w-72 grid-cols-2 gap-1">
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
              class={navigationMenuTriggerStyle()}
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
    <main class="flex items-center gap-4 p-8">
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
    <main class="flex items-start gap-8 p-8">
      <ScrollArea class="h-40 w-48 rounded-md border">
        <div class="p-4">
          {SCROLL_ITEMS.map((item) => (
            <div key={item} class="h-6 text-sm">
              {item}
            </div>
          ))}
        </div>
      </ScrollArea>
      <ScrollArea class="w-48 rounded-md border">
        <div class="flex w-max gap-2 p-4">
          {SCROLL_TAGS.map((tag) => (
            <div key={tag} class="w-16 text-sm">
              {tag}
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <ScrollArea class="h-24 w-48 rounded-md border">
        <div class="p-4 text-sm">Short</div>
      </ScrollArea>
    </main>
  )
}

function CollapsibleDemo() {
  return (
    <main class="p-8">
      <Collapsible class="flex w-80 flex-col gap-2">
        <div class="flex items-center justify-between gap-4 px-4">
          <h4 class="text-sm font-semibold">Order #4189</h4>
          <CollapsibleTrigger
            class={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Toggle
          </CollapsibleTrigger>
        </div>
        <div class="rounded-md border px-4 py-2 text-sm">Always visible</div>
        <CollapsibleContent class="rounded-md border px-4 py-2 text-sm">
          Shipped on September 12
        </CollapsibleContent>
      </Collapsible>
    </main>
  )
}

function DrawerDemo() {
  return (
    <main class="p-8">
      <Drawer showSwipeHandle>
        <DrawerTrigger class={buttonVariants({ variant: "outline" })}>
          Open drawer
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Move goal</DrawerTitle>
            <DrawerDescription>Set your daily activity goal.</DrawerDescription>
          </DrawerHeader>
          <div class="h-32 p-4 text-sm">Goal: 350 calories</div>
          <DrawerFooter>
            <DrawerClose class={buttonVariants({ variant: "outline" })}>
              Cancel
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </main>
  )
}

function ToastDemo() {
  return (
    <main class="flex gap-2 p-8">
      <button
        type="button"
        id="plain"
        data-toast-trigger=""
        data-toast-title="Saved"
        data-toast-description="Your changes were saved."
      >
        Plain
      </button>
      <Toaster />
    </main>
  )
}

function ToastServerDemo() {
  return (
    <main class="p-8">
      <Toaster
        toasts={[
          {
            title: "Welcome back",
            description: "You have 3 new messages.",
            type: "info",
          },
        ]}
      />
    </main>
  )
}

const SIDEBAR_ITEMS = ["Inbox", "Drafts", "Sent", "Archive"]

function SidebarDemo() {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <span>Acme Inc.</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Mail</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {SIDEBAR_ITEMS.map((item) => (
                  <SidebarMenuItem key={item}>
                    <SidebarMenuButton
                      tooltip={item}
                      isActive={item === "Inbox"}
                    >
                      <span>{item}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header class="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span class="text-sm">Inbox</span>
        </header>
        <div class="p-4 text-sm">Messages</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

/** Lite alternatives (docs/adr/0028); tests/visual/lite.spec.ts. */
function LiteDemo() {
  return (
    <main class="flex flex-col items-start gap-6 p-8">
      <InputOTPLite maxLength={6} aria-label="Empty" />
      <InputOTPLite maxLength={6} value="123456" aria-label="Filled" />
      <InputOTPLite maxLength={4} value="12" aria-label="Partial" />
      <InputOTPLite
        maxLength={6}
        value="1234"
        aria-invalid="true"
        aria-label="Invalid"
      />
      <InputOTPLite maxLength={6} disabled aria-label="Disabled" />
      <form id="lite-form" class="flex w-64 flex-col gap-4">
        <InputOTPLite maxLength={6} name="code" aria-label="Code" />
        <DatePickerLite name="date" aria-label="Date" />
      </form>
    </main>
  )
}

function InputGroupDemo() {
  return (
    <main class="flex w-96 flex-col gap-6 p-8">
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
    <main class="flex flex-col gap-10 p-8 ps-24">
      <Slider
        defaultValue={[33]}
        max={100}
        step={1}
        class="w-80"
        aria-label="Volume"
      />
      <Slider
        defaultValue={[25, 75]}
        max={100}
        step={5}
        class="w-80"
        aria-label="Price"
      />
      <Slider defaultValue={[40]} disabled class="w-80" aria-label="Disabled" />
      <div class="flex h-40 gap-8">
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
    <main class="flex min-h-96 items-center gap-24 p-8 ps-48">
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
  lite: () => <LiteDemo />,
  sidebar: () => <SidebarDemo />,
  toast: () => <ToastDemo />,
  "toast-server": () => <ToastServerDemo />,
  drawer: () => <DrawerDemo />,
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

/** Client scripts (public/shadcn/) each demo page loads. */
export const DEMO_SCRIPTS: Readonly<Record<string, readonly string[]>> = {
  "context-menu": ["menu"],
  "dropdown-menu": ["menu"],
  hover: ["hover"],
  "input-group": ["input-group"],
  combobox: ["combobox", "input-group"],
  "navigation-menu": ["navigation-menu"],
  avatar: ["avatar"],
  sidebar: ["sidebar", "hover"],
  toast: ["toast"],
  "toast-server": ["toast"],
  drawer: ["drawer"],
  collapsible: ["collapsible"],
  "scroll-area": ["scroll-area"],
  menubar: ["menu"],
  slider: ["slider"],
  tabs: ["tabs"],
}
