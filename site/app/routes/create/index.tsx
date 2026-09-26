import { createRoute } from "honox/factory"
import { Copy, Dices, FolderOpen, RotateCcw, Terminal } from "lucide"
import { Picker } from "@/components/create/picker"
import { Icon } from "@/components/icon"
import { SiteScript } from "@/components/site-script"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PACKAGE_MANAGERS } from "@/lib/commands"
import { CREATE_ITEMS, DEFAULT_ITEM } from "@/lib/create-items"
import { DEFAULT_CONFIG, OPTIONS, PICKERS } from "@/lib/create-options"
import { manifest } from "@/lib/examples"
import { encodePreset } from "../../../../cli/generated/shadcn-preset.js"

const description =
  "Customize everything. Pick a style, colors, fonts, icons and radius, preview them, and get the command that installs them in your Hono project."

const APPLY_MODES = [
  {
    value: "full",
    title: "Full preset",
    description: "The theme, the fonts and the components' style.",
  },
  {
    value: "theme",
    title: "Theme only",
    description: "Colors, radius and menu accent. Components stay as they are.",
  },
  {
    value: "font",
    title: "Fonts only",
    description:
      "The fonts for body and headings. Components stay as they are.",
  },
] as const

/** A command in every package manager; app/create.ts writes the text. */
function Commands({ name }: { name: string }) {
  return (
    <figure data-code-figure="" data-not-typeset="" class="m-0!">
      <Tabs defaultValue="pnpm" class="gap-0" data-pm-tabs="">
        <div class="flex items-center gap-2 border-b border-border/50 px-3 py-1">
          <div class="flex size-4 items-center justify-center rounded-[1px] bg-foreground opacity-70">
            <Icon icon={Terminal} class="size-3 text-code" />
          </div>
          <TabsList class="rounded-none bg-transparent p-0">
            {PACKAGE_MANAGERS.map((pm) => (
              <TabsTrigger
                value={pm}
                data-pm={pm}
                class="h-7 border border-transparent pt-0.5 shadow-none! data-active:border-input data-active:bg-background!"
              >
                {pm}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {PACKAGE_MANAGERS.map((pm) => (
          <TabsContent value={pm} class="mt-0 px-4 py-3.5">
            <pre class="no-scrollbar overflow-x-auto">
              <code
                class="font-mono text-sm leading-relaxed"
                data-command={name}
                data-command-pm={pm}
              />
            </pre>
          </TabsContent>
        ))}
      </Tabs>
      <Button
        data-slot="copy-button"
        data-copy=""
        size="icon"
        variant="ghost"
        class="group/copy absolute top-2 right-2 z-10 size-7"
      >
        <span class="sr-only">Copy</span>
        <Icon icon={Copy} />
      </Button>
    </figure>
  )
}

/** Opens a dialog of this page by id with an Invoker Command. */
function OpenDialog({
  target,
  ...props
}: { target: string } & Parameters<typeof Button>[0]) {
  return (
    <Button {...props} {...{ command: "show-modal", commandfor: target }} />
  )
}

/** Outside the customizer, which is always dark. */
function GetCodeDialog() {
  return (
    <Dialog id="get-code">
      <DialogContent class="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Get Code</DialogTitle>
          <DialogDescription>
            Run it in the root of your Hono project with Tailwind CSS v4. See{" "}
            <a href="/docs/installation" class="underline underline-offset-4">
              Installation
            </a>{" "}
            to set one up.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="init" class="min-w-0">
          <TabsList class="w-full">
            <TabsTrigger value="init">New setup</TabsTrigger>
            <TabsTrigger value="apply">Existing setup</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
          </TabsList>
          <TabsContent value="init" class="flex min-w-0 flex-col gap-4 pt-2">
            <p class="text-sm text-muted-foreground">
              Writes the theme for this preset, then add components with{" "}
              <code>add</code>.
            </p>
            <Commands name="init" />
          </TabsContent>
          <TabsContent value="apply" class="flex min-w-0 flex-col gap-4 pt-2">
            <RadioGroup name="apply-mode" defaultValue="full" class="gap-2">
              {APPLY_MODES.map((mode) => (
                <FieldLabel for={`apply-${mode.value}`}>
                  <Field orientation="horizontal">
                    <div class="flex flex-1 flex-col gap-0.5">
                      <span class="text-sm font-medium">{mode.title}</span>
                      <span class="text-xs text-muted-foreground">
                        {mode.description}
                      </span>
                    </div>
                    <RadioGroupItem
                      id={`apply-${mode.value}`}
                      value={mode.value}
                      data-apply-mode=""
                    />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
            <Commands name="apply" />
          </TabsContent>
          <TabsContent value="theme" class="min-w-0 pt-2">
            <figure
              data-code-figure=""
              data-not-typeset=""
              class="m-0! max-h-80 overflow-auto"
            >
              <pre class="px-4 py-3.5">
                <code class="font-mono text-xs" data-theme-css="">
                  Loading…
                </code>
              </pre>
              <Button
                data-slot="copy-button"
                data-copy-theme=""
                size="icon"
                variant="ghost"
                class="absolute top-2 right-2 z-10 size-7"
              >
                <span class="sr-only">Copy</span>
                <Icon icon={Copy} />
              </Button>
            </figure>
          </TabsContent>
        </Tabs>
        <FieldGroup class="gap-3 border-t pt-4">
          <Field orientation="horizontal">
            <FieldLabel for="flag-rtl" class="flex-1 font-normal">
              Right-to-left (<code>--rtl</code>)
            </FieldLabel>
            <Switch id="flag-rtl" data-flag="rtl" />
          </Field>
          <Field orientation="horizontal">
            <FieldLabel for="flag-pointer" class="flex-1 font-normal">
              Pointer cursor on buttons (<code>--pointer</code>)
            </FieldLabel>
            <Switch id="flag-pointer" data-flag="pointer" />
          </Field>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  )
}

function OpenPresetDialog() {
  return (
    <Dialog id="open-preset">
      <DialogContent class="sm:max-w-md">
        <form method="dialog" data-open-preset="" class="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Open Preset</DialogTitle>
            <DialogDescription>
              Paste a preset code, or a link from ui.shadcn.com/create or this
              page.
            </DialogDescription>
          </DialogHeader>
          <Input
            name="preset"
            placeholder="b0 or https://ui.shadcn.com/create?preset=b0"
            autocomplete="off"
            required
          />
          <p class="text-sm text-destructive" data-open-preset-error="" hidden>
            That is not a preset code.
          </p>
          <DialogFooter>
            <Button type="submit">Open</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Customizer() {
  return (
    <Card
      class="dark top-24 right-12 isolate z-10 max-h-full min-h-0 w-full self-start rounded-2xl bg-card/90 backdrop-blur-xl md:w-(--customizer-width)"
      size="sm"
      data-customizer=""
    >
      <CardHeader class="hidden items-center border-b md:flex">
        <Picker
          param="item"
          title="Preview"
          options={CREATE_ITEMS}
          value={DEFAULT_ITEM}
        />
      </CardHeader>
      <CardContent class="no-scrollbar min-h-0 flex-1 overflow-x-auto overflow-y-hidden md:overflow-y-auto">
        <FieldGroup class="flex-row gap-2.5 py-px **:data-[slot=field-separator]:-mx-4 **:data-[slot=field-separator]:w-auto md:flex-col md:gap-3.25">
          {PICKERS.map((picker) => (
            <>
              <Picker
                param={picker.param}
                title={picker.title}
                options={OPTIONS[picker.param]}
                value={String(DEFAULT_CONFIG[picker.param] ?? "")}
              />
              {picker.separator && (
                <Separator class="-mx-4 hidden w-auto! md:block" />
              )}
            </>
          ))}
        </FieldGroup>
      </CardContent>
      <CardFooter class="flex min-w-0 gap-2 md:flex-col md:rounded-b-none md:**:[button,a]:w-full">
        <Button
          variant="outline"
          class="min-w-0 flex-1 justify-between font-mono md:flex-none"
          data-copy-preset=""
          title="Copy the preset code"
        >
          <span data-preset-code="">{encodePreset(DEFAULT_CONFIG)}</span>
          <Icon icon={Copy} />
        </Button>
        <OpenDialog
          target="open-preset"
          variant="outline"
          class="min-w-0 flex-1 md:flex-none"
        >
          <Icon icon={FolderOpen} />
          <span class="hidden sm:inline">Open Preset</span>
        </OpenDialog>
        <div class="flex min-w-0 flex-1 gap-2 md:w-full">
          <Button
            variant="outline"
            class="min-w-0 flex-1"
            data-random=""
            title="Shuffle"
          >
            <Icon icon={Dices} />
            <span class="hidden sm:inline">Shuffle</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            class="md:w-auto!"
            data-reset=""
            title="Reset"
          >
            <Icon icon={RotateCcw} />
            <span class="sr-only">Reset</span>
          </Button>
        </div>
      </CardFooter>
      <CardFooter class="-mt-3 hidden min-w-0 gap-2 md:flex md:flex-col md:**:[button,a]:w-full">
        <OpenDialog target="get-code" class="w-full">
          Get Code
        </OpenDialog>
      </CardFooter>
    </Card>
  )
}

export default createRoute((c) =>
  c.render(
    <div class="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden section-soft [--customizer-width:--spacing(48)] [--gap:--spacing(4)] md:[--gap:--spacing(6)] 2xl:[--customizer-width:--spacing(56)]">
      <div
        data-slot="designer"
        class="flex min-h-0 flex-1 flex-col gap-(--gap) p-(--gap) pt-[calc(var(--gap)*0.25)] md:flex-row-reverse"
      >
        <div class="relative flex min-h-[70svh] flex-1 flex-col justify-center overflow-hidden rounded-2xl ring ring-foreground/10 md:min-h-0 md:ring-muted dark:ring-foreground/10">
          <div class="relative z-0 mx-auto flex w-full flex-1 flex-col overflow-hidden">
            <div class="absolute inset-0 bg-muted dark:bg-muted/30" />
            <iframe
              data-preview-frame=""
              data-item={DEFAULT_ITEM}
              src={`/previews/${DEFAULT_CONFIG.style}-${DEFAULT_CONFIG.menuColor}/${DEFAULT_ITEM}.html`}
              class="z-10 size-full flex-1"
              title="Preview"
            />
          </div>
        </div>
        <Customizer />
      </div>
      <GetCodeDialog />
      <OpenPresetDialog />
      <script
        type="application/json"
        id="create-data"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            items: manifest.create.map((item) => item.name),
          }).replace(/</g, "\\u003c"),
        }}
      />
      <SiteScript src="/app/create.ts" />
    </div>,
    { title: "Create", description }
  )
)
