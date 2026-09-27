// @ts-nocheck: a section of site/generated/create/select-example.tsx, whose plans and SelectPlanItem it uses.
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Example } from "./example"

function SelectPlan() {
  return (
    <Example title="Subscription Plan">
      <Select defaultValue={plans[0].name}>
        <SelectTrigger class="h-auto! w-72">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {plans.map((plan) => (
              <SelectItem key={plan.name} value={plan.name}>
                <SelectPlanItem plan={plan} />
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Example>
  )
}
