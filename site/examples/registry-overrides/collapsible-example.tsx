// @ts-nocheck: a section of site/generated/create/collapsible-example.tsx, whose icons it uses.
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Example } from "./example"

function CollapsibleSettings() {
  return (
    <Example title="Settings" class="items-center">
      <Card class="mx-auto w-full max-w-xs" size="sm">
        <CardHeader>
          <CardTitle>Radius</CardTitle>
          <CardDescription>
            Set the corner radius of the element.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Collapsible class="flex items-start gap-2">
            <FieldGroup class="grid w-full grid-cols-2 gap-2">
              <Field>
                <FieldLabel for="radius-x" class="sr-only">
                  Radius X
                </FieldLabel>
                <Input id="radius" placeholder="0" value={0} />
              </Field>
              <Field>
                <FieldLabel for="radius-y" class="sr-only">
                  Radius Y
                </FieldLabel>
                <Input id="radius" placeholder="0" value={0} />
              </Field>
              <CollapsibleContent class="col-span-full grid grid-cols-subgrid gap-2">
                <Field>
                  <FieldLabel for="radius-x" class="sr-only">
                    Radius X
                  </FieldLabel>
                  <Input id="radius" placeholder="0" value={0} />
                </Field>
                <Field>
                  <FieldLabel for="radius-y" class="sr-only">
                    Radius Y
                  </FieldLabel>
                  <Input id="radius" placeholder="0" value={0} />
                </Field>
              </CollapsibleContent>
            </FieldGroup>
            <CollapsibleTrigger
              class={buttonVariants({ variant: "outline", size: "icon" })}
            >
              <MinimizeIcon class="hidden group-data-panel-open/button:block" />
              <MaximizeIcon class="group-data-panel-open/button:hidden" />
            </CollapsibleTrigger>
          </Collapsible>
        </CardContent>
      </Card>
    </Example>
  )
}
