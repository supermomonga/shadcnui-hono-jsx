// @ts-nocheck: a section of site/generated/create/demo.tsx, whose icons it uses.
import type { CSSProperties } from "hono/jsx"
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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldGroup } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export function Demo() {
  return (
    <div class="flex min-h-screen w-full flex-col items-center justify-center bg-muted p-4 sm:p-6 lg:p-12 dark:bg-background">
      <div class="grid max-w-3xl gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Style Overview</CardTitle>
              <CardDescription class="line-clamp-2">
                Designers love packing quirky glyphs into test phrases. This is
                a preview of the typography styles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-6 gap-3">
                {[
                  "--background",
                  "--foreground",
                  "--primary",
                  "--secondary",
                  "--muted",
                  "--accent",
                  "--border",
                  "--chart-1",
                  "--chart-2",
                  "--chart-3",
                  "--chart-4",
                  "--chart-5",
                ].map((variant) => (
                  <div
                    key={variant}
                    class="flex flex-col flex-wrap items-center gap-2"
                  >
                    <div
                      class="relative aspect-square w-full rounded-lg bg-(--color) after:absolute after:inset-0 after:rounded-lg after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten"
                      style={
                        {
                          "--color": `var(${variant})`,
                        } as CSSProperties
                      }
                    />
                    <div class="hidden max-w-14 truncate font-mono text-[0.60rem] md:block">
                      {variant}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div class="grid grid-cols-8 place-items-center gap-4">
                <Card class="flex size-8 items-center justify-center p-0 shadow-none *:[svg]:size-4">
                  <CopyIcon />
                </Card>
                <Card class="flex size-8 items-center justify-center p-0 shadow-none *:[svg]:size-4">
                  <CircleAlertIcon />
                </Card>
                <Card class="flex size-8 items-center justify-center p-0 shadow-none *:[svg]:size-4">
                  <TrashIcon />
                </Card>
                <Card class="flex size-8 items-center justify-center p-0 shadow-none *:[svg]:size-4">
                  <ShareIcon />
                </Card>
                <Card class="flex size-8 items-center justify-center p-0 shadow-none *:[svg]:size-4">
                  <ShoppingBagIcon />
                </Card>
                <Card class="flex size-8 items-center justify-center p-0 shadow-none *:[svg]:size-4">
                  <MoreHorizontalIcon />
                </Card>
                <Card class="flex size-8 items-center justify-center p-0 shadow-none *:[svg]:size-4">
                  <Loader2Icon />
                </Card>
                <Card class="flex size-8 items-center justify-center p-0 shadow-none *:[svg]:size-4">
                  <PlusIcon />
                </Card>
                <Card class="flex size-8 items-center justify-center p-0 shadow-none *:[svg]:size-4">
                  <MinusIcon />
                </Card>
                <Card class="flex size-8 items-center justify-center p-0 shadow-none *:[svg]:size-4">
                  <ArrowLeftIcon />
                </Card>
                <Card class="flex size-8 items-center justify-center p-0 shadow-none *:[svg]:size-4">
                  <ArrowRightIcon />
                </Card>
                <Card class="flex size-8 items-center justify-center p-0 shadow-none *:[svg]:size-4">
                  <CheckIcon />
                </Card>
                <Card class="flex size-8 items-center justify-center p-0 shadow-none *:[svg]:size-4">
                  <ChevronDownIcon />
                </Card>
                <Card class="flex size-8 items-center justify-center p-0 shadow-none *:[svg]:size-4">
                  <ChevronRightIcon />
                </Card>
                <Card class="flex size-8 items-center justify-center p-0 shadow-none *:[svg]:size-4">
                  <SearchIcon />
                </Card>
                <Card class="flex size-8 items-center justify-center p-0 shadow-none *:[svg]:size-4">
                  <SettingsIcon />
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
        <div class="flex flex-col gap-4">
          <Card class="w-full">
            <CardContent class="flex flex-col gap-6">
              <div class="flex flex-col gap-4">
                <div class="flex flex-wrap gap-2">
                  <Button>Button</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
                <Item variant="outline">
                  <ItemContent>
                    <ItemTitle>Two-factor authentication</ItemTitle>
                    <ItemDescription class="text-pretty xl:hidden 2xl:block">
                      Verify via email or phone number.
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions class="hidden md:flex">
                    <Button size="sm" variant="secondary">
                      Enable
                    </Button>
                  </ItemActions>
                </Item>
              </div>
              <Slider
                defaultValue={[500]}
                max={1000}
                min={0}
                step={10}
                class="flex-1"
                aria-label="Slider"
              />
              <FieldGroup>
                <Field>
                  <InputGroup>
                    <InputGroupInput placeholder="Name" />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>
                        <SearchIcon />
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field class="flex-1">
                  <Textarea placeholder="Message" class="resize-none" />
                </Field>
              </FieldGroup>
              <div class="flex items-center gap-2">
                <div class="flex gap-2">
                  <Badge>Badge</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
                <RadioGroup
                  defaultValue="apple"
                  class="ml-auto flex w-fit gap-3"
                >
                  <RadioGroupItem value="apple" />
                  <RadioGroupItem value="banana" />
                </RadioGroup>
                <div class="flex gap-3">
                  <Checkbox defaultChecked />
                  <Checkbox />
                </div>
              </div>
              <div class="flex items-center gap-4">
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="outline" />}>
                    <span class="hidden md:block">Alert Dialog</span>
                    <span class="block md:hidden">Dialog</span>
                  </AlertDialogTrigger>
                  <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Allow accessory to connect?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Do you want to allow the USB accessory to connect to
                        this device and your data?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Don&apos;t allow</AlertDialogCancel>
                      <AlertDialogAction>Allow</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <ButtonGroup>
                  <Button variant="outline">Button Group</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="outline" size="icon" />}
                    >
                      <ChevronUpIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" class="w-fit">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Mute Conversation</DropdownMenuItem>
                        <DropdownMenuItem>Mark as Read</DropdownMenuItem>
                        <DropdownMenuItem>Block User</DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Conversation</DropdownMenuLabel>
                        <DropdownMenuItem>Share Conversation</DropdownMenuItem>
                        <DropdownMenuItem>Copy Conversation</DropdownMenuItem>
                        <DropdownMenuItem>Report Conversation</DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem variant="destructive">
                          Delete Conversation
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </ButtonGroup>
                <Switch defaultChecked class="ml-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
