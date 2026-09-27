import { DatePickerLite } from "@/components/ui/date-picker-lite"
import { Field, FieldLabel } from "@/components/ui/field"

export default function DatePickerLiteTime() {
  return (
    <Field class="w-64">
      <FieldLabel for="meeting">Meeting</FieldLabel>
      <DatePickerLite id="meeting" name="meeting" type="datetime-local" />
    </Field>
  )
}
