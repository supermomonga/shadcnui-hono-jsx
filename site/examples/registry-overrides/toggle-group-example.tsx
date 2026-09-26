// @ts-nocheck: a section of site/generated/create/toggle-group-example.tsx, which provides ./example.
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Example } from "./example"

function ToggleGroupFontWeightSelector() {
  return (
    <Example title="Font Weight Selector">
      <Field>
        <FieldLabel>Font Weight</FieldLabel>
        <ToggleGroup
          defaultValue={["normal"]}
          variant="outline"
          spacing={2}
          size="lg"
        >
          <ToggleGroupItem
            value="light"
            aria-label="Light"
            class="flex size-16 flex-col items-center justify-center rounded-xl"
          >
            <span class="text-2xl leading-none font-light">Aa</span>
            <span class="text-xs text-muted-foreground">Light</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="normal"
            aria-label="Normal"
            class="flex size-16 flex-col items-center justify-center rounded-xl"
          >
            <span class="text-2xl leading-none font-normal">Aa</span>
            <span class="text-xs text-muted-foreground">Normal</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="medium"
            aria-label="Medium"
            class="flex size-16 flex-col items-center justify-center rounded-xl"
          >
            <span class="text-2xl leading-none font-medium">Aa</span>
            <span class="text-xs text-muted-foreground">Medium</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="bold"
            aria-label="Bold"
            class="flex size-16 flex-col items-center justify-center rounded-xl"
          >
            <span class="text-2xl leading-none font-bold">Aa</span>
            <span class="text-xs text-muted-foreground">Bold</span>
          </ToggleGroupItem>
        </ToggleGroup>
        <FieldDescription>
          Use{" "}
          {/* The pressed item's weight, following the native radios with :has(). */}
          <code class="rounded-md bg-muted px-1 py-0.5 font-mono">
            font-
            <span class="hidden group-has-[[value=light]:checked]/field:inline">
              light
            </span>
            <span class="hidden group-has-[[value=normal]:checked]/field:inline">
              normal
            </span>
            <span class="hidden group-has-[[value=medium]:checked]/field:inline">
              medium
            </span>
            <span class="hidden group-has-[[value=bold]:checked]/field:inline">
              bold
            </span>
          </code>{" "}
          to set the font weight.
        </FieldDescription>
      </Field>
    </Example>
  )
}

function ToggleGroupWithInputAndSelect() {
  const items = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Archived", value: "archived" },
  ]
  return (
    <Example title="With Input and Select">
      <div class="flex items-center gap-2">
        <Input type="search" placeholder="Search..." class="flex-1" />
        <Select defaultValue={items[0].value}>
          <SelectTrigger class="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <ToggleGroup defaultValue={["grid"]} variant="outline">
          <ToggleGroupItem value="grid" aria-label="Grid view">
            Grid
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            List
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </Example>
  )
}
