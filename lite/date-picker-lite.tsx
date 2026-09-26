import { cn } from "cn"
import type * as React from "react"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"
import { Input } from "@/registry/base-nova/ui/input"

/**
 * A lite alternative to a shadcn/ui date picker (a Popover with a Calendar)
 * that needs no JavaScript: upstream's Input as a native date input, with a
 * calendar icon. The browser draws and positions the calendar popup (it
 * cannot be styled, but follows `color-scheme` in dark mode), handles the
 * keyboard and submits an ISO date (`2026-09-26`).
 */
function DatePickerLite({
  className,
  containerClassName,
  type = "date",
  ...props
}: React.ComponentProps<typeof Input> & {
  /** The native input type: a date, a date and time, a month or a week. */
  type?: "date" | "datetime-local" | "month" | "week"
  containerClassName?: string
}) {
  return (
    <div
      data-slot="date-picker-lite"
      className={cn("relative w-full", containerClassName)}
    >
      <IconPlaceholder
        lucide="CalendarIcon"
        tabler="IconCalendar"
        hugeicons="Calendar03Icon"
        phosphor="CalendarBlankIcon"
        remixicon="RiCalendarLine"
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type={type}
        className={cn(
          "pl-8 scheme-light dark:scheme-dark [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100",
          className
        )}
        {...props}
      />
    </div>
  )
}

export { DatePickerLite }
