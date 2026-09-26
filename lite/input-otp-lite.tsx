import { cn } from "cn"
import type * as React from "react"

/**
 * A lite alternative to shadcn/ui's InputOTP that needs no JavaScript, in the
 * way of daisyUI's OTP: one native text input lies over the slot boxes, its
 * characters spaced to one per box. The browser handles typing, pasting,
 * one-time-code autofill and form validation. The whole group is highlighted
 * while focused (upstream highlights the active slot).
 *
 * `lite:<key>` class tokens are computed per style from upstream's InputOTP,
 * InputOTPGroup and InputOTPSlot (inputOtpClasses in generator/src/lite.ts).
 */
function InputOTPLite({
  maxLength = 6,
  className,
  containerClassName,
  style,
  ...props
}: React.ComponentProps<"input"> & {
  /** Number of characters, and of slots. */
  maxLength?: number
  containerClassName?: string
}) {
  return (
    <div
      data-slot="input-otp-lite"
      className={cn("lite:root", containerClassName)}
      style={
        {
          "--input-otp-length": maxLength,
        } as React.CSSProperties
      }
    >
      <div
        aria-hidden="true"
        data-slot="input-otp-group"
        className="lite:group"
      >
        {Array.from({ length: maxLength }, (_, index) => (
          <div key={index} data-slot="input-otp-slot" className="lite:slot" />
        ))}
      </div>
      {/*
        Clips the input's spare width (and the caret after the last slot).
        Tabular digits are 1ch wide: the spacing and padding center one per
        slot, and pb-px lines the text up with upstream's slots.
      */}
      <div className="lite:clip">
        <input
          data-slot="input-otp-lite-input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          spellCheck={false}
          maxLength={maxLength}
          minLength={maxLength}
          className={cn("lite:input", className)}
          style={style}
          {...props}
        />
      </div>
    </div>
  )
}

export { InputOTPLite }
