import { cn } from "cn"
import { Check } from "lucide"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Option } from "@/lib/create-options"
import { Icon } from "../icon"

/**
 * A choice of the customizer, as on ui.shadcn.com/create: a trigger showing
 * the value, and a popover listing the options. app/create.ts keeps the
 * value, the swatch and the checked option in sync with the state.
 */
export function Picker({
  param,
  title,
  options,
  value,
}: {
  param: string
  title: string
  options: readonly Option[]
  value: string
}) {
  const current = options.find((option) => option.value === value)
  const swatches = options.some((option) => option.swatch)
  return (
    <div class="group/picker relative" data-picker={param}>
      <Popover id={`picker-${param}`}>
        <PopoverTrigger class="relative w-36 shrink-0 touch-manipulation rounded-xl p-3 text-left ring-1 ring-foreground/10 select-none hover:bg-muted focus-visible:ring-foreground/50 focus-visible:outline-none md:w-full md:rounded-lg md:px-2.5 md:py-2">
          <div class="flex flex-col justify-start text-left">
            <div class="text-xs text-muted-foreground">{title}</div>
            <div
              class="truncate pr-6 text-sm font-medium text-foreground"
              data-picker-label=""
            >
              {current?.label}
            </div>
          </div>
          {swatches && (
            <div
              data-picker-swatch=""
              style={{ "--color": current?.swatch ?? "transparent" }}
              class="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 rounded-full bg-(--color) select-none md:right-2.5"
            />
          )}
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={20}
          class="no-scrollbar max-h-[min(32rem,var(--available-height,80vh))] w-52 overflow-y-auto rounded-xl border-0 bg-neutral-950/80 p-1.5 text-neutral-100 ring-1 ring-neutral-950/80 backdrop-blur-xl dark:bg-neutral-800/90 dark:ring-neutral-700/50"
          data-picker-content=""
        >
          <div role="listbox" aria-label={title} class="flex flex-col gap-0.5">
            {options.map((option) => (
              <button
                type="button"
                role="option"
                data-picker-option=""
                data-param={param}
                data-value={option.value}
                aria-selected={option.value === value ? "true" : "false"}
                class={cn(
                  "group/option relative flex w-full cursor-default items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-neutral-100 outline-hidden select-none hover:bg-neutral-600 focus-visible:bg-neutral-600 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-neutral-700/80 dark:focus-visible:bg-neutral-700/80",
                  option.description && "flex-col items-start gap-0"
                )}
              >
                {option.swatch && (
                  <span
                    style={{ "--color": option.swatch }}
                    class="size-4 shrink-0 rounded-full bg-(--color)"
                  />
                )}
                <span class="flex-1">{option.label}</span>
                {option.description && (
                  <span class="text-xs font-normal text-neutral-400">
                    {option.description}
                  </span>
                )}
                <Icon
                  icon={Check}
                  class="absolute top-2 right-2 size-4 opacity-0 group-aria-selected/option:opacity-100"
                />
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
