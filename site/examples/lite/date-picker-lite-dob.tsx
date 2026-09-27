import { DatePickerLite } from "@/components/ui/date-picker-lite"
import { Field, FieldLabel } from "@/components/ui/field"

export default function DatePickerLiteDob() {
  return (
    <Field class="w-56">
      <FieldLabel for="dob">Date of birth</FieldLabel>
      <DatePickerLite id="dob" name="dob" min="1900-01-01" max="2026-12-31" />
    </Field>
  )
}
