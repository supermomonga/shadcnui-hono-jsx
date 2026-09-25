/**
 * Visual parity cases, as plain data so the exact same input is rendered by the
 * generated Hono JSX components and by upstream shadcn/ui (React).
 *
 * Element types are component export names (PascalCase) or intrinsic tags.
 * Props use HTML attribute names (`class`, `for`); the React renderer maps them.
 */

/**
 * Components whose interactive behavior (keyboard, focus, ARIA, no scripts) is
 * checked in a browser spec; modal specs also compare open-state screenshots
 * with upstream.
 */
export const BROWSER_SPECS: Readonly<Record<string, string>> = {
  accordion: "disclosure.spec.ts",
  avatar: "avatar.spec.ts",
  checkbox: "controls.spec.ts",
  collapsible: "disclosure.spec.ts",
  combobox: "combobox.spec.ts",
  "context-menu": "menu.spec.ts",
  "dropdown-menu": "menu.spec.ts",
  "hover-card": "hover.spec.ts",
  "input-group": "input-group.spec.ts",
  menubar: "menu.spec.ts",
  "navigation-menu": "navigation-menu.spec.ts",
  popover: "popover.spec.ts",
  "radio-group": "controls.spec.ts",
  "scroll-area": "scroll-area.spec.ts",
  select: "select.spec.ts",
  slider: "slider.spec.ts",
  tabs: "tabs.spec.ts",
  toast: "toast.spec.ts",
  tooltip: "hover.spec.ts",
  switch: "controls.spec.ts",
  toggle: "controls.spec.ts",
  "toggle-group": "controls.spec.ts",
  "alert-dialog": "modals.spec.ts",
  dialog: "modals.spec.ts",
  drawer: "drawer.spec.ts",
  sheet: "modals.spec.ts",
}

/** A prop value may itself be an element (for `render={<a />}`) or a list of strings. */
export type CaseProps = Record<
  string,
  string | number | boolean | CaseElement | readonly string[]
>
export type CaseNode = string | CaseElement
export type CaseElement = [
  type: string,
  props: CaseProps,
  ...children: CaseNode[],
]

/** Element tuples have a props object in second position; string lists do not. */
export function isCaseElement(value: unknown): value is CaseElement {
  return (
    Array.isArray(value) &&
    typeof value[0] === "string" &&
    typeof value[1] === "object" &&
    value[1] !== null &&
    !Array.isArray(value[1])
  )
}

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

const accordionItem = (
  value: string,
  trigger: string,
  content: string
): CaseElement => [
  "AccordionItem",
  { value },
  ["AccordionTrigger", {}, trigger],
  ["AccordionContent", {}, ["p", {}, content]],
]

const collapsibleTrigger =
  "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium"

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
  {
    id: "attachment/states",
    component: "attachment",
    width: 640,
    node: [
      "AttachmentGroup",
      {},
      ...["done", "idle", "error"].map(
        (state): CaseNode => [
          "Attachment",
          { state },
          ["AttachmentMedia", {}, "📄"],
          [
            "AttachmentContent",
            {},
            ["AttachmentTitle", {}, `report-${state}.pdf`],
            ["AttachmentDescription", {}, "2.4 MB"],
          ],
          [
            "AttachmentActions",
            {},
            ["AttachmentAction", { "aria-label": "Remove" }, "×"],
          ],
        ]
      ),
      [
        "Attachment",
        { orientation: "vertical", size: "sm" },
        ["AttachmentMedia", {}, "🖼"],
        ["AttachmentContent", {}, ["AttachmentTitle", {}, "photo.png"]],
      ],
    ],
  },
  {
    id: "button-group/orientations",
    component: "button-group",
    node: stack(
      [
        "ButtonGroup",
        {},
        ["Button", { variant: "outline" }, "Archive"],
        ["Button", { variant: "outline" }, "Report"],
        ["ButtonGroupSeparator", {}],
        ["Button", { variant: "outline" }, "Snooze"],
      ],
      [
        "ButtonGroup",
        {},
        ["ButtonGroupText", {}, "https://"],
        ["Input", { placeholder: "example.com" }],
      ],
      [
        "ButtonGroup",
        { orientation: "vertical" },
        ["Button", { variant: "outline" }, "Top"],
        ["Button", { variant: "outline" }, "Bottom"],
      ]
    ),
  },
  {
    id: "item/variants",
    component: "item",
    node: [
      "ItemGroup",
      {},
      ...["default", "outline", "muted"].map(
        (variant): CaseNode => [
          "Item",
          { variant },
          ["ItemMedia", { variant: "icon" }, "★"],
          [
            "ItemContent",
            {},
            ["ItemTitle", {}, `Item ${variant}`],
            ["ItemDescription", {}, "A short description of the item."],
          ],
          [
            "ItemActions",
            {},
            ["Button", { size: "sm", variant: "outline" }, "Open"],
          ],
        ]
      ),
      ["ItemSeparator", {}],
      [
        "Item",
        { size: "sm" },
        ["ItemContent", {}, ["ItemTitle", {}, "Small item"]],
      ],
    ],
  },
  {
    id: "breadcrumb/trail",
    component: "breadcrumb",
    node: [
      "Breadcrumb",
      {},
      [
        "BreadcrumbList",
        {},
        ["BreadcrumbItem", {}, ["BreadcrumbLink", { href: "#" }, "Home"]],
        ["BreadcrumbSeparator", {}],
        ["BreadcrumbItem", {}, ["BreadcrumbEllipsis", {}]],
        ["BreadcrumbSeparator", {}],
        ["BreadcrumbItem", {}, ["BreadcrumbLink", { href: "#" }, "Components"]],
        ["BreadcrumbSeparator", {}],
        ["BreadcrumbItem", {}, ["BreadcrumbPage", {}, "Breadcrumb"]],
      ],
    ],
  },
  {
    id: "native-select/states",
    component: "native-select",
    node: stack(
      [
        "NativeSelect",
        {},
        ["NativeSelectOption", { value: "" }, "Select a fruit"],
        ["NativeSelectOption", { value: "apple" }, "Apple"],
        [
          "NativeSelectOptGroup",
          { label: "Citrus" },
          ["NativeSelectOption", { value: "orange" }, "Orange"],
        ],
      ],
      [
        "NativeSelect",
        { size: "sm", disabled: true },
        ["NativeSelectOption", {}, "Disabled"],
      ]
    ),
  },
  {
    id: "spinner/sizes",
    component: "spinner",
    node: row(
      ["Spinner", {}],
      ["Spinner", { class: "size-6" }],
      ["Spinner", { class: "size-8 text-muted-foreground" }]
    ),
  },
  {
    id: "button/render-link",
    component: "button",
    node: row(
      ["Button", { render: ["a", { href: "#docs" }] }, "Docs"],
      [
        "Button",
        { variant: "outline", render: ["a", { href: "#next", class: "w-32" }] },
        "Next",
      ]
    ),
  },
  {
    id: "pagination/pages",
    component: "pagination",
    node: [
      "Pagination",
      {},
      [
        "PaginationContent",
        {},
        ["PaginationItem", {}, ["PaginationPrevious", { href: "#" }]],
        ["PaginationItem", {}, ["PaginationLink", { href: "#1" }, "1"]],
        [
          "PaginationItem",
          {},
          ["PaginationLink", { href: "#2", isActive: true }, "2"],
        ],
        ["PaginationItem", {}, ["PaginationLink", { href: "#3" }, "3"]],
        ["PaginationItem", {}, ["PaginationEllipsis", {}]],
        ["PaginationItem", {}, ["PaginationNext", { href: "#" }]],
      ],
    ],
  },
  {
    id: "field/form",
    component: "field",
    node: [
      "FieldSet",
      {},
      ["FieldLegend", {}, "Profile"],
      ["FieldDescription", {}, "This appears on your public page."],
      [
        "FieldGroup",
        {},
        [
          "Field",
          {},
          ["FieldLabel", { for: "field-name" }, "Name"],
          ["Input", { id: "field-name", placeholder: "Evil Rabbit" }],
          ["FieldDescription", {}, "Your display name."],
        ],
        ["FieldSeparator", {}, "Or"],
        [
          "Field",
          { "data-invalid": "true" },
          ["FieldLabel", { for: "field-email" }, "Email"],
          ["Input", { id: "field-email", "aria-invalid": "true" }],
          ["FieldError", {}, "Enter a valid email address."],
        ],
        [
          "Field",
          { orientation: "horizontal" },
          [
            "FieldContent",
            {},
            ["FieldTitle", {}, "Newsletter"],
            ["FieldDescription", {}, "Weekly updates."],
          ],
          ["Button", { size: "sm", variant: "outline" }, "Subscribe"],
        ],
      ],
    ],
  },
  {
    id: "avatar/fallbacks",
    component: "avatar",
    node: row(
      ["Avatar", { size: "sm" }, ["AvatarFallback", {}, "SM"]],
      ["Avatar", {}, ["AvatarFallback", {}, "CN"], ["AvatarBadge", {}]],
      ["Avatar", { size: "lg" }, ["AvatarFallback", {}, "LG"]],
      [
        "AvatarGroup",
        {},
        ["Avatar", {}, ["AvatarFallback", {}, "A"]],
        ["Avatar", {}, ["AvatarFallback", {}, "B"]],
        ["AvatarGroupCount", {}, "+3"],
      ]
    ),
  },
  {
    id: "input-group/addons",
    component: "input-group",
    width: 320,
    node: stack(
      [
        "InputGroup",
        {},
        ["InputGroupInput", { placeholder: "example.com" }],
        ["InputGroupAddon", {}, ["InputGroupText", {}, "https://"]],
      ],
      [
        "InputGroup",
        {},
        ["InputGroupInput", { placeholder: "Search..." }],
        ["InputGroupAddon", { align: "inline-end" }, ["Kbd", {}, "⌘K"]],
      ],
      [
        "InputGroup",
        {},
        ["InputGroupInput", { placeholder: "Username", value: "shadcn" }],
        [
          "InputGroupAddon",
          { align: "inline-end" },
          ["InputGroupButton", { size: "icon-xs", "aria-label": "Copy" }, "C"],
        ],
      ],
      [
        "InputGroup",
        {},
        ["InputGroupInput", { placeholder: "Amount", disabled: true }],
        ["InputGroupAddon", {}, ["InputGroupText", {}, "$"]],
        [
          "InputGroupAddon",
          { align: "inline-end" },
          ["InputGroupText", {}, "USD"],
        ],
      ],
      [
        "InputGroup",
        {},
        ["InputGroupInput", { "aria-invalid": "true", value: "bad@" }],
        [
          "InputGroupAddon",
          { align: "block-start" },
          ["InputGroupText", {}, "Email"],
        ],
      ],
      [
        "InputGroup",
        {},
        ["InputGroupTextarea", { placeholder: "Ask anything" }],
        [
          "InputGroupAddon",
          { align: "block-end" },
          ["InputGroupText", {}, "0/280"],
          [
            "InputGroupButton",
            { size: "sm", variant: "default", class: "ml-auto" },
            "Send",
          ],
        ],
      ]
    ),
  },
  {
    id: "progress/states",
    component: "progress",
    node: stack(
      [
        "Progress",
        { value: 42 },
        ["ProgressLabel", {}, "Uploading"],
        ["ProgressValue", {}],
      ],
      ["Progress", { value: 100 }],
      [
        "Progress",
        { value: 7, max: 20 },
        ["ProgressLabel", {}, "Steps"],
        ["ProgressValue", {}],
      ]
    ),
  },
  {
    id: "checkbox/states",
    component: "checkbox",
    node: stack(
      row(
        ["Checkbox", {}],
        ["Checkbox", { defaultChecked: true }],
        ["Checkbox", { disabled: true }],
        ["Checkbox", { defaultChecked: true, disabled: true }],
        ["Checkbox", { "aria-invalid": "true" }],
        ["Checkbox", { defaultChecked: true, "aria-invalid": "true" }]
      ),
      [
        "div",
        { class: "flex items-center gap-2" },
        ["Checkbox", { id: "terms", defaultChecked: true }],
        ["Label", { for: "terms" }, "Accept terms and conditions"],
      ]
    ),
  },
  {
    id: "field/choice-card",
    component: "field",
    node: [
      "FieldGroup",
      {},
      ...[
        ["notifications", "Enable notifications", true],
        ["digest", "Weekly digest", false],
      ].map(
        ([id, title, on]): CaseElement => [
          "FieldLabel",
          { for: String(id) },
          [
            "Field",
            { orientation: "horizontal" },
            ["Checkbox", { id: String(id), defaultChecked: Boolean(on) }],
            [
              "FieldContent",
              {},
              ["FieldTitle", {}, String(title)],
              ["FieldDescription", {}, "You can change this later."],
            ],
          ],
        ]
      ),
    ],
  },
  {
    id: "tabs/variants",
    component: "tabs",
    node: stack(
      [
        "Tabs",
        { defaultValue: "password" },
        [
          "TabsList",
          {},
          ["TabsTrigger", { value: "account" }, "Account"],
          ["TabsTrigger", { value: "password" }, "Password"],
          ["TabsTrigger", { value: "billing", disabled: true }, "Billing"],
        ],
        ["TabsContent", { value: "account" }, "Account settings."],
        ["TabsContent", { value: "password" }, "Change your password here."],
      ],
      [
        "Tabs",
        { defaultValue: "b" },
        [
          "TabsList",
          { variant: "line" },
          ["TabsTrigger", { value: "a" }, "Overview"],
          ["TabsTrigger", { value: "b" }, "Analytics"],
        ],
        ["TabsContent", { value: "a" }, "Overview panel."],
        ["TabsContent", { value: "b" }, "Analytics panel."],
      ],
      [
        "Tabs",
        { defaultValue: "x", orientation: "vertical" },
        [
          "TabsList",
          {},
          ["TabsTrigger", { value: "x" }, "General"],
          ["TabsTrigger", { value: "y" }, "Security"],
        ],
        ["TabsContent", { value: "x" }, "General settings."],
        ["TabsContent", { value: "y" }, "Security settings."],
      ]
    ),
  },
  {
    id: "switch/states",
    component: "switch",
    node: row(
      ["Switch", {}],
      ["Switch", { defaultChecked: true }],
      ["Switch", { size: "sm" }],
      ["Switch", { size: "sm", defaultChecked: true }],
      ["Switch", { disabled: true }],
      ["Switch", { defaultChecked: true, disabled: true }],
      ["Switch", { "aria-invalid": "true" }]
    ),
  },
  {
    id: "radio-group/default",
    component: "radio-group",
    node: [
      "RadioGroup",
      { defaultValue: "comfortable", class: "w-fit" },
      ...["default", "comfortable", "compact"].map(
        (value): CaseElement => [
          "div",
          { class: "flex items-center gap-3" },
          ["RadioGroupItem", { value, id: `density-${value}` }],
          ["Label", { for: `density-${value}` }, value],
        ]
      ),
      [
        "div",
        { class: "flex items-center gap-3" },
        [
          "RadioGroupItem",
          { value: "none", id: "density-none", disabled: true },
        ],
        ["Label", { for: "density-none" }, "none"],
      ],
    ],
  },
  {
    id: "toggle/states",
    component: "toggle",
    node: row(
      ["Toggle", { "aria-label": "Bold" }, "B"],
      ["Toggle", { "aria-label": "Italic", defaultPressed: true }, "I"],
      ["Toggle", { variant: "outline" }, "Outline"],
      ["Toggle", { variant: "outline", defaultPressed: true }, "Pressed"],
      ["Toggle", { size: "sm" }, "Small"],
      ["Toggle", { size: "lg", defaultPressed: true }, "Large"],
      ["Toggle", { disabled: true }, "Disabled"]
    ),
  },
  {
    id: "toggle-group/variants",
    component: "toggle-group",
    node: stack(
      [
        "ToggleGroup",
        { variant: "outline", defaultValue: ["center"] },
        ["ToggleGroupItem", { value: "left" }, "Left"],
        ["ToggleGroupItem", { value: "center" }, "Center"],
        ["ToggleGroupItem", { value: "right" }, "Right"],
      ],
      [
        "ToggleGroup",
        {
          variant: "outline",
          spacing: 0,
          multiple: true,
          defaultValue: ["b", "u"],
        },
        ["ToggleGroupItem", { value: "b" }, "B"],
        ["ToggleGroupItem", { value: "i" }, "I"],
        ["ToggleGroupItem", { value: "u" }, "U"],
      ],
      [
        "ToggleGroup",
        { size: "sm", orientation: "vertical", defaultValue: ["top"] },
        ["ToggleGroupItem", { value: "top" }, "Top"],
        ["ToggleGroupItem", { value: "bottom", disabled: true }, "Bottom"],
      ]
    ),
  },
  {
    id: "accordion/default",
    component: "accordion",
    node: [
      "Accordion",
      { defaultValue: ["shipping"] },
      accordionItem(
        "product",
        "Product Information",
        "Our flagship product combines cutting-edge technology with sleek design."
      ),
      accordionItem(
        "shipping",
        "Shipping Details",
        "We offer worldwide shipping through trusted courier partners."
      ),
      accordionItem(
        "returns",
        "Return Policy",
        "We stand behind our products with a comprehensive 30-day return policy."
      ),
    ],
  },
  {
    id: "accordion/multiple",
    component: "accordion",
    node: [
      "Accordion",
      { multiple: true, defaultValue: ["one", "two"] },
      accordionItem(
        "one",
        "Is it accessible?",
        "Yes. It uses native disclosure."
      ),
      accordionItem(
        "two",
        "Is it styled?",
        "Yes. It matches the other components."
      ),
      [
        "AccordionItem",
        { value: "three", disabled: true },
        ["AccordionTrigger", {}, "Is it disabled?"],
        ["AccordionContent", {}, "Yes."],
      ],
    ],
  },
  {
    id: "collapsible/states",
    component: "collapsible",
    node: stack(
      [
        "Collapsible",
        { defaultOpen: true },
        ["CollapsibleTrigger", { class: collapsibleTrigger }, "Order #4189"],
        [
          "CollapsibleContent",
          { class: "mt-2 rounded-md border px-4 py-2 text-sm" },
          "Shipped on September 12",
        ],
      ],
      [
        "Collapsible",
        {},
        ["CollapsibleTrigger", { class: collapsibleTrigger }, "Order #4190"],
        [
          "CollapsibleContent",
          { class: "mt-2 rounded-md border px-4 py-2 text-sm" },
          "Processing",
        ],
      ]
    ),
  },
]
