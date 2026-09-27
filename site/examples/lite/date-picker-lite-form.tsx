import { Button } from "@/components/ui/button"
import { DatePickerLite } from "@/components/ui/date-picker-lite"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

export default function DatePickerLiteForm() {
  return (
    <form class="w-full max-w-xs" method="post">
      <FieldGroup>
        <Field>
          <FieldLabel for="start">Start date</FieldLabel>
          <DatePickerLite id="start" name="start" required />
          <FieldDescription>
            The date your subscription starts.
          </FieldDescription>
        </Field>
        <Button type="submit" class="w-fit">
          Save
        </Button>
      </FieldGroup>
    </form>
  )
}
