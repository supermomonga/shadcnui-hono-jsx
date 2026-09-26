import { cn } from "cn"
import { ChevronDownIcon } from "@/components/icons"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function CollapsibleBasic() {
  return (
    <Card class="mx-auto w-full max-w-sm">
      <CardContent>
        {/* The trigger comes first, so the collapsible is a native <details>: open: variants style its state. */}
        <Collapsible class="group/collapsible rounded-md open:bg-muted">
          <CollapsibleTrigger
            class={cn(buttonVariants({ variant: "ghost", class: "w-full" }))}
          >
            Product details
            <ChevronDownIcon class="ml-auto group-open/collapsible:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent class="flex flex-col items-start gap-2 p-2.5 pt-0 text-sm">
            <div>
              This panel can be expanded or collapsed to reveal additional
              content.
            </div>
            <Button size="xs">Learn More</Button>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
