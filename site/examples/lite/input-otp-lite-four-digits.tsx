import { InputOTPLite } from "@/components/ui/input-otp-lite"

export default function InputOTPLiteFourDigits() {
  return <InputOTPLite maxLength={4} pattern="[0-9]{4}" aria-label="PIN" />
}
