// @ts-nocheck: a section of site/generated/create/slider-example.tsx, which provides ./example.
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Example } from "./example"

function SliderControlled() {
  const value = [0.3, 0.7]

  return (
    <Example title="Controlled">
      <div class="grid w-full gap-3">
        <div class="flex items-center justify-between gap-2">
          <Label for="slider-demo-temperature">Temperature</Label>
          <span class="text-sm text-muted-foreground">{value.join(", ")}</span>
        </div>
        <Slider
          id="slider-demo-temperature"
          defaultValue={value}
          min={0}
          max={1}
          step={0.1}
        />
      </div>
    </Example>
  )
}
