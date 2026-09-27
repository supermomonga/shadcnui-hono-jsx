import { DatePickerLite } from "@/components/ui/date-picker-lite"
import { Field, FieldLabel } from "@/components/ui/field"

export default function DatePickerLiteMonth() {
  return (
    <Field class="w-56">
      <FieldLabel for="expiry">Card expiry</FieldLabel>
      <DatePickerLite id="expiry" name="expiry" type="month" />
    </Field>
  )
}
