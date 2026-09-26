import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { InputOTPLite } from "@/components/ui/input-otp-lite"

export default function InputOTPLiteForm() {
  return (
    <form class="w-full max-w-xs" method="post">
      <FieldGroup>
        <Field>
          <FieldLabel for="otp">One-Time Password</FieldLabel>
          <InputOTPLite
            id="otp"
            name="otp"
            maxLength={6}
            pattern="[0-9]{6}"
            required
          />
          <FieldDescription>
            Enter the 6-digit code sent to your phone.
          </FieldDescription>
        </Field>
        <Button type="submit" class="w-fit">
          Verify
        </Button>
      </FieldGroup>
    </form>
  )
}
