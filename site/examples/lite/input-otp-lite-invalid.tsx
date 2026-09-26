import { InputOTPLite } from "@/components/ui/input-otp-lite"

export default function InputOTPLiteInvalid() {
  return (
    <InputOTPLite maxLength={6} value="000000" aria-invalid aria-label="Code" />
  )
}
