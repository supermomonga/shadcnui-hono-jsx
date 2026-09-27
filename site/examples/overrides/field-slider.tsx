import { Field, FieldDescription, FieldTitle } from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"

export default function FieldSlider() {
  return (
    <Field class="w-full max-w-xs">
      <FieldTitle>Price Range</FieldTitle>
      <FieldDescription>
        Set your budget range ($
        <span class="font-medium tabular-nums">200</span> -{" "}
        <span class="font-medium tabular-nums">800</span>).
      </FieldDescription>
      <Slider
        defaultValue={[200, 800]}
        max={1000}
        min={0}
        step={10}
        class="mt-2 w-full"
        aria-label="Price Range"
      />
    </Field>
  )
}
