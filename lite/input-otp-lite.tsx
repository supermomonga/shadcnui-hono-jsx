import { cn } from "cn"
import type * as React from "react"

/**
 * A lite alternative to shadcn/ui's InputOTP that needs no JavaScript, in the
 * way of daisyUI's OTP: one native text input lies over the slot boxes, its
 * characters spaced to one per box. The browser handles typing, pasting,
 * one-time-code autofill and form validation. The slot and group classes
 * follow upstream's InputOTPGroup and InputOTPSlot; the whole group is
 * highlighted while focused (upstream highlights the active slot).
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
      className={cn(
        "group/input-otp relative flex w-fit items-center rounded-lg has-disabled:opacity-50 has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 dark:has-aria-invalid:ring-destructive/40",
        containerClassName
      )}
      style={
        {
          "--input-otp-length": maxLength,
        } as React.CSSProperties
      }
    >
      <div
        aria-hidden="true"
        data-slot="input-otp-group"
        className="flex items-center rounded-lg"
      >
        {Array.from({ length: maxLength }, (_, index) => (
          <div
            key={index}
            data-slot="input-otp-slot"
            className="relative flex size-8 items-center justify-center border-y border-r border-input text-sm transition-all outline-none first:rounded-l-lg first:border-l last:rounded-r-lg group-has-focus-visible/input-otp:border-ring group-has-aria-invalid/input-otp:border-destructive dark:bg-input/30"
          />
        ))}
      </div>
      {/*
        Clips the input's spare width (and the caret after the last slot).
        Tabular digits are 1ch wide: the spacing and padding center one per
        slot, and pb-px lines the text up with upstream's slots.
      */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <input
          data-slot="input-otp-lite-input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          spellCheck={false}
          maxLength={maxLength}
          minLength={maxLength}
          className={cn(
            "h-full w-[calc((var(--input-otp-length)+1)*--spacing(8))] border-0 bg-transparent pb-px pl-[calc((--spacing(8)-1ch)/2)] text-sm tracking-[calc(--spacing(8)-1ch)] text-foreground tabular-nums outline-none disabled:cursor-not-allowed",
            className
          )}
          style={style}
          {...props}
        />
      </div>
    </div>
  )
}

export { InputOTPLite }
