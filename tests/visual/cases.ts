/**
 * Visual parity cases, as plain data so the exact same input is rendered by the
 * generated Hono JSX components and by upstream shadcn/ui (React).
 *
 * Element types are component export names (PascalCase) or intrinsic tags.
 * Props use HTML attribute names (`class`, `for`); the React renderer maps them.
 */

export type CaseProps = Record<string, string | number | boolean>
export type CaseNode = string | CaseElement
export type CaseElement = [
  type: string,
  props: CaseProps,
  ...children: CaseNode[],
]

export interface VisualCase {
  id: string
  /** Registry item the case covers. */
  component: string
  /** Width of the case container in CSS pixels. */
  width?: number
  node: CaseNode
}

const row = (...children: CaseNode[]): CaseElement => [
  "div",
  { class: "flex flex-wrap items-center gap-2" },
  ...children,
]

const stack = (...children: CaseNode[]): CaseElement => [
  "div",
  { class: "flex flex-col gap-3" },
  ...children,
]

const buttonVariants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
]
const buttonSizes = ["xs", "sm", "default", "lg"]
const iconSizes = ["icon-xs", "icon-sm", "icon", "icon-lg"]
const badgeVariants = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
]
const bubbleVariants = [
  "default",
  "secondary",
  "muted",
  "tinted",
  "outline",
  "ghost",
  "destructive",
]

export const VISUAL_CASES: VisualCase[] = [
  {
    id: "button/variants",
    component: "button",
    node: row(
      ...buttonVariants.map(
        (variant): CaseNode => ["Button", { variant }, variant]
      )
    ),
  },
  {
    id: "button/sizes",
    component: "button",
    node: stack(
      row(
        ...buttonSizes.map(
          (size): CaseNode => ["Button", { size }, `Size ${size}`]
        )
      ),
      row(
        ...iconSizes.map(
          (size): CaseNode => ["Button", { size, variant: "outline" }, "+"]
        )
      )
    ),
  },
  {
    id: "button/states",
    component: "button",
    node: row(
      ["Button", { disabled: true }, "Disabled"],
      ["Button", { variant: "outline", "aria-invalid": "true" }, "Invalid"],
      ["Button", { variant: "outline", "aria-expanded": "true" }, "Expanded"],
      ["Button", { variant: "secondary", class: "w-40" }, "Custom width"]
    ),
  },
  {
    id: "badge/variants",
    component: "badge",
    node: row(
      ...badgeVariants.map(
        (variant): CaseNode => ["Badge", { variant }, variant]
      )
    ),
  },
  {
    id: "card/composition",
    component: "card",
    width: 720,
    node: row(
      [
        "Card",
        { class: "w-80" },
        [
          "CardHeader",
          {},
          ["CardTitle", {}, "Create project"],
          ["CardDescription", {}, "Deploy your new project in one click."],
          ["CardAction", {}, ["Badge", { variant: "secondary" }, "New"]],
        ],
        ["CardContent", {}, "Card content goes here."],
        [
          "CardFooter",
          { class: "justify-end gap-2" },
          ["Button", { variant: "outline" }, "Cancel"],
          ["Button", {}, "Deploy"],
        ],
      ],
      [
        "Card",
        { size: "sm", class: "w-64" },
        [
          "CardHeader",
          {},
          ["CardTitle", {}, "Small card"],
          ["CardDescription", {}, "Compact spacing."],
        ],
        ["CardContent", {}, "Content"],
      ]
    ),
  },
  {
    id: "input/states",
    component: "input",
    node: stack(
      ["Input", { placeholder: "Email" }],
      ["Input", { value: "Filled value" }],
      ["Input", { placeholder: "Disabled", disabled: true }],
      ["Input", { placeholder: "Invalid", "aria-invalid": "true" }]
    ),
  },
  {
    id: "textarea/states",
    component: "textarea",
    node: stack(
      ["Textarea", { placeholder: "Type your message here." }],
      ["Textarea", { placeholder: "Disabled", disabled: true }]
    ),
  },
  {
    id: "label/with-input",
    component: "label",
    node: stack(
      ["Label", { for: "email" }, "Email address"],
      ["Input", { id: "email" }]
    ),
  },
  {
    id: "separator/orientations",
    component: "separator",
    node: stack(
      ["div", {}, "Above"],
      ["Separator", {}],
      [
        "div",
        { class: "flex h-5 items-center gap-4 text-sm" },
        "Blog",
        ["Separator", { orientation: "vertical" }],
        "Docs",
        ["Separator", { orientation: "vertical" }],
        "Source",
      ]
    ),
  },
  {
    id: "skeleton/shapes",
    component: "skeleton",
    node: row(
      ["Skeleton", { class: "size-12 rounded-full" }],
      [
        "div",
        { class: "flex flex-col gap-2" },
        ["Skeleton", { class: "h-4 w-60" }],
        ["Skeleton", { class: "h-4 w-40" }],
      ]
    ),
  },
  {
    id: "alert/variants",
    component: "alert",
    node: stack(
      [
        "Alert",
        {},
        ["AlertTitle", {}, "Heads up!"],
        [
          "AlertDescription",
          {},
          "You can add components to your app using the CLI.",
        ],
        [
          "AlertAction",
          {},
          ["Button", { size: "xs", variant: "outline" }, "Undo"],
        ],
      ],
      [
        "Alert",
        { variant: "destructive" },
        ["AlertTitle", {}, "Error"],
        [
          "AlertDescription",
          {},
          "Your session has expired. Please log in again.",
        ],
      ]
    ),
  },
  {
    id: "table/invoices",
    component: "table",
    node: [
      "Table",
      {},
      ["TableCaption", {}, "A list of your recent invoices."],
      [
        "TableHeader",
        {},
        [
          "TableRow",
          {},
          ["TableHead", {}, "Invoice"],
          ["TableHead", {}, "Status"],
          ["TableHead", { class: "text-right" }, "Amount"],
        ],
      ],
      [
        "TableBody",
        {},
        [
          "TableRow",
          {},
          ["TableCell", {}, "INV001"],
          ["TableCell", {}, "Paid"],
          ["TableCell", { class: "text-right" }, "$250.00"],
        ],
        [
          "TableRow",
          {},
          ["TableCell", {}, "INV002"],
          ["TableCell", {}, "Pending"],
          ["TableCell", { class: "text-right" }, "$150.00"],
        ],
      ],
      [
        "TableFooter",
        {},
        [
          "TableRow",
          {},
          ["TableCell", { colspan: 2 }, "Total"],
          ["TableCell", { class: "text-right" }, "$400.00"],
        ],
      ],
    ],
  },
  {
    id: "aspect-ratio/16-9",
    component: "aspect-ratio",
    node: [
      "div",
      { class: "w-80" },
      ["AspectRatio", { ratio: 16 / 9, class: "rounded-lg bg-muted" }],
    ],
  },
  {
    id: "kbd/group",
    component: "kbd",
    node: row(
      [
        "KbdGroup",
        {},
        ["Kbd", {}, "⌘"],
        ["Kbd", {}, "Shift"],
        ["Kbd", {}, "K"],
      ],
      ["Kbd", {}, "Esc"]
    ),
  },
  {
    id: "empty/icon",
    component: "empty",
    node: [
      "Empty",
      { class: "border" },
      [
        "EmptyHeader",
        {},
        ["EmptyMedia", { variant: "icon" }, "?"],
        ["EmptyTitle", {}, "No projects yet"],
        ["EmptyDescription", {}, "Create your first project to get started."],
      ],
      ["EmptyContent", {}, ["Button", {}, "Create project"]],
    ],
  },
  {
    id: "bubble/variants",
    component: "bubble",
    node: [
      "BubbleGroup",
      {},
      ...bubbleVariants.map(
        (variant, i): CaseNode => [
          "Bubble",
          { variant, align: i % 2 === 0 ? "start" : "end" },
          ["BubbleContent", {}, `A ${variant} bubble`],
        ]
      ),
      [
        "Bubble",
        {},
        ["BubbleContent", {}, "With reactions"],
        ["BubbleReactions", { side: "bottom", align: "start" }, "👍 2"],
      ],
    ],
  },
  {
    id: "marker/variants",
    component: "marker",
    node: stack(
      ...["default", "separator", "border"].map(
        (variant): CaseNode => [
          "Marker",
          { variant },
          ["MarkerIcon", {}, "•"],
          ["MarkerContent", {}, `Marker ${variant}`],
        ]
      )
    ),
  },
  {
    id: "message/conversation",
    component: "message",
    node: [
      "MessageGroup",
      {},
      [
        "Message",
        {},
        ["MessageAvatar", {}, "A"],
        ["MessageHeader", {}, "Alice"],
        ["MessageContent", {}, "Hello! How can I help you today?"],
        ["MessageFooter", {}, "10:24"],
      ],
      [
        "Message",
        { align: "end" },
        ["MessageContent", {}, "Show me the Hono example."],
      ],
    ],
  },
]
