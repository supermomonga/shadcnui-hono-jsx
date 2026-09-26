import { InputOTPLite } from "@/components/ui/input-otp-lite"

export default function InputOTPLitePattern() {
  return (
    <InputOTPLite
      maxLength={6}
      pattern="[A-Za-z0-9]{6}"
      inputmode="text"
      class="font-mono uppercase"
      aria-label="Invite code"
    />
  )
}
