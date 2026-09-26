/**
 * Base UI's Slider rendered on the server with its structure and initial
 * positions: thumbs are placed with CSS alone (`left: p%; translate: -p%`
 * keeps an edge-aligned thumb inside the control), and each thumb holds a
 * visually hidden native `<input type="range">` that takes focus, handles the
 * keyboard and submits the value. The client script `public/shadcn/slider.js`
 * (docs/adr/0025) adds pointer dragging, keeps range thumbs in order and
 * moves the thumbs and the indicator as values change.
 */
import type { FamilyRule } from "./types"
import {
  forEachPart,
  helperEntries,
  registerHelpers,
  replacePartTypes,
} from "./util"

const HELPERS = `type SliderValue = number | readonly number[]

type SliderRootProps = ComponentProps<"div"> & {
  value?: SliderValue | undefined
  defaultValue?: SliderValue | undefined
  min?: number | undefined
  max?: number | undefined
  step?: number | undefined
  /** Minimum number of steps between the thumbs of a range slider. */
  minStepsBetweenValues?: number | undefined
  orientation?: "horizontal" | "vertical" | undefined
  /** \`edge\` keeps the thumbs inside the control; \`center\` centers them on the value. */
  thumbAlignment?: "center" | "edge" | undefined
  disabled?: boolean | undefined
  name?: string | undefined
  form?: string | undefined
}

interface SliderState {
  values: readonly number[]
  min: number
  max: number
  step: number
  orientation: "horizontal" | "vertical"
  edge: boolean
  disabled: boolean
  name: string | undefined
  form: string | undefined
  label: string | undefined
  /** Thumbs claim their index in render order. */
  rendered: number
}

const SliderContext = createContext<SliderState | null>(null)

function useSliderContext(): SliderState {
  const context = useContext(SliderContext)
  if (!context) throw new Error("Slider parts must be rendered inside <Slider>")
  return context
}

/** Position of a value along the control, in percent. */
function sliderPercent(state: SliderState, value: number): number {
  const range = state.max - state.min
  return range === 0 ? 0 : Math.min(Math.max(((value - state.min) / range) * 100, 0), 100)
}

function SliderRootElement({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  minStepsBetweenValues = 0,
  orientation = "horizontal",
  thumbAlignment = "center",
  disabled = false,
  name,
  form,
  ...props
}: SliderRootProps) {
  const initial = value ?? defaultValue ?? min
  const values = typeof initial === "number" ? [initial] : [...initial]
  const label = props["aria-label"]
  return (
    <SliderContext.Provider
      value={{
        values,
        min,
        max,
        step,
        orientation,
        edge: thumbAlignment === "edge",
        disabled,
        name,
        form,
        label: typeof label === "string" ? label : undefined,
        rendered: 0,
      }}
    >
      <div
        role="group"
        data-orientation={orientation}
        data-disabled={disabled ? "" : undefined}
        data-min-steps={minStepsBetweenValues || undefined}
        {...props}
      />
    </SliderContext.Provider>
  )
}

function SliderControlElement(props: ComponentProps<"div">) {
  const state = useSliderContext()
  return (
    <div
      data-slider-control=""
      data-orientation={state.orientation}
      data-disabled={state.disabled ? "" : undefined}
      data-thumb-alignment={state.edge ? "edge" : "center"}
      {...props}
    />
  )
}

function SliderTrackElement({ style, ...props }: ComponentProps<"div">) {
  const state = useSliderContext()
  return (
    <div
      data-orientation={state.orientation}
      style={withSliderStyle(style, { position: "relative" })}
      {...props}
    />
  )
}

/** The filled part: from the start (or the first thumb) to the last thumb. */
function SliderIndicatorElement({ style, ...props }: ComponentProps<"div">) {
  const state = useSliderContext()
  const range = state.values.length > 1
  const start = range ? sliderPercent(state, state.values[0] ?? state.min) : 0
  const end = sliderPercent(state, state.values.at(-1) ?? state.min)
  const vertical = state.orientation === "vertical"
  return (
    <div
      data-slider-indicator=""
      data-orientation={state.orientation}
      style={withSliderStyle(style, {
        position: vertical ? "absolute" : "relative",
        [vertical ? "width" : "height"]: "inherit",
        [vertical ? "bottom" : "inset-inline-start"]: \`\${start}%\`,
        [vertical ? "height" : "width"]: \`\${end - start}%\`,
      })}
      {...props}
    />
  )
}

/**
 * A thumb with the native range input that takes focus and holds its value.
 * \`translate\` is physical, so \`--slider-dir\` flips it in right-to-left
 * text, where \`inset-inline-start\` measures from the right.
 */
function SliderThumbElement({ class: className, style, children, ...props }: ComponentProps<"div">) {
  const state = useSliderContext()
  const index = state.rendered++
  const value = state.values[index] ?? state.min
  const percent = sliderPercent(state, value)
  const vertical = state.orientation === "vertical"
  const shift = state.edge ? percent : 50
  const range = state.values.length > 1
  return (
    <div
      data-slider-thumb=""
      data-index={index}
      data-orientation={state.orientation}
      data-disabled={state.disabled ? "" : undefined}
      class={cn("rtl:[--slider-dir:-1]", className)}
      style={withSliderStyle(style, {
        position: "absolute",
        ...(vertical
          ? { bottom: \`\${percent}%\`, left: "50%", translate: \`-50% \${shift}%\` }
          : {
              "inset-inline-start": \`\${percent}%\`,
              top: "50%",
              translate: \`calc(var(--slider-dir, 1) * -\${shift}%) -50%\`,
            }),
      })}
      {...props}
    >
      {children}
      <input
        type="range"
        min={state.min}
        max={state.max}
        step={state.step}
        value={value}
        name={state.name}
        form={state.form}
        disabled={state.disabled || undefined}
        aria-label={state.label}
        aria-orientation={state.orientation}
        aria-valuetext={range ? \`\${value} \${index === 0 ? "start" : "end"} range\` : undefined}
        style="clip-path:inset(50%);overflow:hidden;white-space:nowrap;border:0;padding:0;width:100%;height:100%;margin:-1px;position:absolute;top:0;left:0"
      />
    </div>
  )
}

/** Adds \`extra\` declarations to a string or object \`style\` prop (the prop wins). */
function withSliderStyle(
  style: string | JSX.CSSProperties | undefined,
  extra: Record<string, string>
): string | JSX.CSSProperties {
  if (typeof style === "string") {
    const css = Object.entries(extra).map(([key, value]) => \`\${key}:\${value}\`)
    return [...css, style].join(";")
  }
  return { ...extra, ...style }
}`

const TAGS: Readonly<Record<string, string>> = {
  Root: "SliderRootElement",
  Control: "SliderControlElement",
  Track: "SliderTrackElement",
  Indicator: "SliderIndicatorElement",
  Thumb: "SliderThumbElement",
}

export const sliderFamily: FamilyRule = {
  module: "@base-ui/react/slider",
  exportName: "Slider",
  kind: "script",
  behaviors: ["slider"],
  domParity: "native-structure",
  reference:
    "https://github.com/mui/base-ui/tree/master/packages/react/src/slider",
  notes: [
    'Each thumb holds a native `<input type="range">` (focusable, keyboard-operable and submitted with `name`). Pointer dragging, keeping range thumbs in order and moving the thumbs as values change need the client script `/shadcn/slider.js` (`<script type="module" src="/shadcn/slider.js">`); without it the initial values are shown and submitted.',
    "Controlled state (`onValueChange`), `format`, `locale` and `largeStep` are not supported (Page Up and Page Down use the browser's step).",
  ],
  transform(ctx, local) {
    const step = "family:Slider"
    replacePartTypes(ctx, step, local, {
      Root: "SliderRootProps",
      Control: 'ComponentProps<"div">',
      Track: 'ComponentProps<"div">',
      Indicator: 'ComponentProps<"div">',
      Thumb: 'ComponentProps<"div">',
    })
    forEachPart(ctx, local, (element) => {
      const tag = TAGS[element.part]
      if (!tag) {
        throw new Error(
          `[${ctx.name}] ${step}: unknown part ${local}.${element.part}`
        )
      }
      // Thumbs take their index in render order (Hono drops \`key\`).
      const attrs = element.attributes().join(" ")
      element.replace(
        element.children
          ? `<${tag} ${attrs}>${element.children}</${tag}>`
          : `<${tag} ${attrs} />`
      )
    })
    registerHelpers(ctx, helperEntries(HELPERS))
    ctx.needsComponentProps = true
    ctx.log.push(`${step}: ${local} with native range inputs`)
  },
}
