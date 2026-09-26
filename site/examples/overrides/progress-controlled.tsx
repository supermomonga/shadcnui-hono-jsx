import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"

export function ProgressControlled() {
  const value = 50

  return (
    <div class="flex w-full max-w-sm flex-col gap-4">
      <Progress value={value} class="w-full" />
      <Slider defaultValue={value} min={0} max={100} step={1} />
    </div>
  )
}
