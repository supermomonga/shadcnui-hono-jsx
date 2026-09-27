// @ts-nocheck: a section of site/generated/create/card-example.tsx, whose constants it uses.
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Example } from "./example"

function CardCustomSpacing() {
  return (
    <Example title="Custom Spacing">
      <div class="group/card-spacing mx-auto grid w-full max-w-sm gap-4">
        <ToggleGroup
          defaultValue={["4"]}
          variant="outline"
          size="sm"
          class="justify-center"
        >
          {spacingOptions.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {/* The pressed item's spacing (spacingOptions), following the native radios with :has(). */}
        <Card class="group-has-[[value='4']:checked]/card-spacing:[--card-spacing:--spacing(4)] group-has-[[value='5']:checked]/card-spacing:[--card-spacing:--spacing(5)] group-has-[[value='6']:checked]/card-spacing:[--card-spacing:--spacing(6)] group-has-[[value='8']:checked]/card-spacing:[--card-spacing:--spacing(8)]">
          <CardHeader>
            <CardTitle>Release Health</CardTitle>
            <CardDescription>
              Track readiness across launch signals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid gap-2 rounded-lg bg-muted/50 p-3 text-sm style-lyra:rounded-none style-sera:rounded-none">
              <div class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground">Checks passed</span>
                <span class="font-medium">24 / 26</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground">Open blockers</span>
                <span class="font-medium">2</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Example>
  )
}
