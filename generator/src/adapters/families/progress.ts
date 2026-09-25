import type { FamilyRule } from "./types"
import { forEachPart, insertHelpers, replacePartTypes } from "./util"

const STEP = "family:progress"

/** File-local implementation of Base UI's Progress parts (server-rendered, no state). */
const HELPERS = `type ProgressRootProps = ComponentProps<"div"> & {
  value?: number | null | undefined
  min?: number | undefined
  max?: number | undefined
  format?: Intl.NumberFormatOptions | undefined
  locale?: Intl.LocalesArgument
}

interface ProgressState {
  value: number | null
  percentage: number | null
  formatted: string
  status: "indeterminate" | "progressing" | "complete"
}

const ProgressContext = createContext<ProgressState>({
  value: null,
  percentage: null,
  formatted: "",
  status: "indeterminate",
})

/** Base UI's state attribute: \`data-progressing\`, \`data-complete\` or \`data-indeterminate\`. */
function progressStateAttributes(state: ProgressState): Record<string, string> {
  return { [\`data-\${state.status}\`]: "" }
}

/** Like Base UI's Progress.Root: clamped value, percent formatting, ARIA values and status. */
function ProgressRootElement({
  value = null,
  min = 0,
  max = 100,
  format,
  locale,
  children,
  ...props
}: ProgressRootProps) {
  let state: ProgressState = {
    value: null,
    percentage: null,
    formatted: "",
    status: "indeterminate",
  }
  if (value !== null) {
    const raw = ((value - min) * 100) / (max - min)
    const percentage = Math.min(Math.max(Number.isNaN(raw) ? 0 : raw, 0), 100)
    const clamped = Math.min(Math.max(value, min), max)
    state = {
      value: clamped,
      percentage,
      formatted: format
        ? new Intl.NumberFormat(locale, format).format(clamped)
        : new Intl.NumberFormat(locale, { style: "percent" }).format(percentage / 100),
      status: clamped === max ? "complete" : "progressing",
    }
  }
  return (
    <ProgressContext.Provider value={state}>
      <div
        {...progressStateAttributes(state)}
        aria-valuemax={max}
        aria-valuemin={min}
        aria-valuenow={state.value ?? undefined}
        aria-valuetext={state.value === null ? "indeterminate progress" : state.formatted}
        role="progressbar"
        {...props}
      >
        {children}
        <span
          role="presentation"
          style="clip-path:inset(50%);overflow:hidden;white-space:nowrap;border:0;padding:0;width:1px;height:1px;margin:-1px;position:fixed;top:0;left:0"
        >
          x
        </span>
      </div>
    </ProgressContext.Provider>
  )
}

function ProgressTrackElement(props: ComponentProps<"div">) {
  return <div {...progressStateAttributes(useContext(ProgressContext))} {...props} />
}

function ProgressIndicatorElement(props: ComponentProps<"div">) {
  const state = useContext(ProgressContext)
  return (
    <div
      {...progressStateAttributes(state)}
      style={
        state.percentage === null
          ? undefined
          : \`inset-inline-start:0;height:inherit;width:\${state.percentage}%\`
      }
      {...props}
    />
  )
}

function ProgressLabelElement(props: ComponentProps<"span">) {
  return (
    <span
      {...progressStateAttributes(useContext(ProgressContext))}
      role="presentation"
      {...props}
    />
  )
}

/** Shows the formatted value (Base UI ignores non-function children). */
function ProgressValueElement({ children: _children, ...props }: ComponentProps<"span">) {
  const state = useContext(ProgressContext)
  return (
    <span {...progressStateAttributes(state)} aria-hidden="true" {...props}>
      {state.status === "indeterminate" ? null : state.formatted}
    </span>
  )
}`

const PARTS = ["Root", "Track", "Indicator", "Label", "Value"]

export const progressFamily: FamilyRule = {
  module: "@base-ui/react/progress",
  exportName: "Progress",
  kind: "intrinsic",
  domParity: "exact",
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/progress",
  notes: [
    "Server-rendered: the progressbar is not linked to `ProgressLabel` (Base UI links them on the client); pass `aria-label` or `aria-labelledby`. Function children of `ProgressValue` are not supported.",
  ],
  transform(ctx, local) {
    replacePartTypes(ctx, STEP, local, {
      Root: "ProgressRootProps",
      Track: 'ComponentProps<"div">',
      Indicator: 'ComponentProps<"div">',
      Label: 'ComponentProps<"span">',
      Value: 'ComponentProps<"span">',
    })
    forEachPart(ctx, local, (element) => {
      if (!PARTS.includes(element.part)) {
        throw new Error(
          `[${ctx.name}] ${STEP}: unknown part ${local}.${element.part}`
        )
      }
      const tag = `Progress${element.part}Element`
      const attrs = element.attributes().join(" ")
      element.replace(
        element.children
          ? `<${tag} ${attrs}>${element.children}</${tag}>`
          : `<${tag} ${attrs} />`
      )
    })
    insertHelpers(ctx, HELPERS)
    ctx.needsComponentProps = true
    ctx.honoValues.add("createContext")
    ctx.honoValues.add("useContext")
    ctx.log.push(`${STEP}: ${local}`)
  },
}
