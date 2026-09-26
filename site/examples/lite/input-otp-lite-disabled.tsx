import { InputOTPLite } from "@/components/ui/input-otp-lite"

export default function InputOTPLiteDisabled() {
  return (
    <InputOTPLite maxLength={6} value="123456" disabled aria-label="Code" />
  )
}
