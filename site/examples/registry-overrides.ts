/**
 * Hand-written versions of the sections of the create page's registry
 * examples (upstream/site/registry/) that need React, in
 * `registry-overrides/<example>.tsx`. Sections without one are left out of
 * the preview. Recorded like the docs examples' overrides (./overrides.ts):
 * upstream function name → SHA-256 of its upstream text.
 *
 * The override files use the icons, constants and `./example` of the
 * translated file they are merged into (site/generated/create/), so they are
 * not type-checked on their own (`@ts-nocheck`) but in that file. Toasts need no `<Toaster>`
 * there: every preview page has one (scripts/previews.ts).
 */
import type { Override } from "./overrides"

export const REGISTRY_OVERRIDES: Record<string, Override> = {
  "bubble-example": {
    functions: {
      BubbleCollapsible:
        "4f565541c37c411d3143c8397375b9546823fc0032e560039ca91eb172d2e091",
      BubbleReactionsButtons:
        "71d3fa90d68458230792478602c8309a4237ce8079b7c5bd3eb831bdf2fb4d7e",
      BubbleButtonLinks:
        "63bf1cfc044153585bb1ff379ac152004028d76780e0a2eba53fda40981f2ea6",
    },
    reason:
      "The collapsible renders the preview and the full text and the trigger's two labels, and the collapsible script and data-open variants show one of each instead of React state; the buttons are data-toast-trigger buttons of the toast script instead of calling sonner's toast().",
  },
  "button-group-example": {
    functions: {
      ButtonGroupWithSelect:
        "738e064e2563257638f3ee7c4bb3e24c198f68ae59cf109c988f83098af73753",
      ButtonGroupWithSelectAndInput:
        "37e4be2fff6bdc2a9efd35838a621c0130f38866906dc5b4f07e04ae6120ef01",
    },
    reason:
      "The selects' values are the items' value strings instead of Base UI's object values, which Select does not support.",
  },
  "card-example": {
    functions: {
      CardCustomSpacing:
        "d3cce659f2e67a388cf5f1066b6cb367060e5bc668f932a41a5bdd2b9715d8e4",
    },
    reason:
      "The toggle group starts from defaultValue, and the card's spacing follows its native radios with :has() instead of React state.",
  },
  "checkbox-example": {
    functions: {
      CheckboxInTable:
        "d1765bd2b905332c3dc5edb708355353fed02afe5943af18239f0898a3fdd2cf",
    },
    reason:
      "The checkboxes start from defaultChecked and each row's highlight follows its native checkbox with :has(); the select-all checkbox does not check the rows, as that needs React state.",
  },
  "collapsible-example": {
    functions: {
      CollapsibleFileTree:
        "7cf381a09631ce671dd016595ea1b5178abfd2ba4ce8e01a2d6937e46ddb4b66",
      CollapsibleSettings:
        "479768e1d2393c114dd355e12744fff79b5fccb483a98fc3eef5fe51d4ddc29c",
    },
    reason:
      "The collapsible script opens the settings panel, and data-panel-open variants swap the trigger's icons instead of React state; the triggers have the buttons' classes (buttonVariants), as CollapsibleTrigger has no render prop.",
  },
  "combobox-example": {
    functions: {
      ComboboxWithForm:
        "d9c93bea3a74a9332f478ff42a04973f099adc4891d2ce92c486d44319764de4",
      ComboboxInDialog:
        "85ae81a7d108ddc99eea4a6ee245065018ceaefe1fdfd962fd775039916d7219",
    },
    reason:
      "The form validates natively and its submission stays in the preview (method=dialog) without the toast naming the chosen framework, which needs a submit handler; the dialog opens natively and DialogClose buttons close it, Confirm with a data-toast-trigger toast.",
  },
  "component-example": {
    functions: {
      FormExample:
        "341920e8aac1e8145b4c2d944431f64a2cc330f2877ac0e6843101efcd9d54c5",
    },
    reason:
      "The menu's checkbox and radio items start from defaultChecked and defaultValue, and the menu script checks them instead of React state.",
  },
  "context-menu-example": {
    functions: {
      ContextMenuWithRadio:
        "f853c1c9719f5b98f4a8152ff88fb59927cad945d766c8198403cd1fa93cef69",
      ContextMenuWithInset:
        "56ae35ea460a6f7fe3479d15448f510df7832b7b3c137784ee178374d97c22c9",
    },
    reason:
      "The checkbox and radio items start from defaultChecked and defaultValue, and the menu script checks them instead of React state.",
  },
  demo: {
    functions: {
      Demo: "bd8757864da04a383d36bed08f3723c185b6ea6d8dcc9da8671eb0609891b01f",
    },
    reason:
      "The slider starts from defaultValue and the slider script moves it instead of React state.",
  },
  "dialog-example": {
    functions: {
      DialogChatSettings:
        "3e18e4da3fc33df5e90754b85ff0f8bd598b13de1039fe078581511f7972ffbe",
    },
    reason:
      "The tabs and selects start from defaultValue instead of React state; the native select that switches tabs on small screens does not, as that needs React state (wide screens show the tab list).",
  },
  "drawer-example": {
    functions: {
      DrawerNonModal:
        "cf694095e9aac8a9d82891d325689ca26912abdbc2784380460ba7ede31bbe3c",
    },
    reason:
      'Drawer has no modal={false} or disablePointerDismissal: the drawer opens as a modal dialog, and closedby="closerequest" on its dialog ignores outside clicks as disablePointerDismissal does.',
  },
  "input-group-example": {
    functions: {
      InputGroupExample:
        "436a35702210da280440c85b504c5abdcfd7c1d0657fb2cbce9240daecb0243d",
      InputGroupWithAddons:
        "fb01daaa4e61daaec2767dff9b86cc76924fbd70ea663305e8d0d12f0cc2cbf0",
      InputGroupWithTooltip:
        "25e6402b4a786c9b58535c50fbe5deb7bfe6c440975672cccdaf4bb3c591f64e",
    },
    reason:
      "The country dropdown shows the first country (choosing another needs React state), and the buttons are data-toast-trigger buttons of the toast script instead of calling sonner's toast().",
  },
  "marker-example": {
    functions: {
      MarkerExample:
        "f634a92b435c1d5a4d758be3526d3158e70869e3c5e7b38a4514197943fb1df9",
    },
    reason:
      "The button marker is a data-toast-trigger button of the toast script instead of calling sonner's toast().",
  },
  "menubar-example": {
    functions: {
      MenubarWithRadio:
        "a2447247aa933fa4f97f5bc755f00fb82b64db763832270c36345ab985dd1174",
      MenubarWithInset:
        "af633765db1a996bfeb57ae5f22970be14b2ecbdaa157fe47f840858493a62fb",
    },
    reason:
      "The checkbox and radio items start from defaultChecked and defaultValue, and the menu script checks them instead of React state.",
  },
  "message-example": {
    functions: {
      messagePartsChat:
        "df44be3cb2a8d19cadc4300b9980bc8ef2639346b309abb9eabfb3f8d4481031",
      MessageTextPart:
        "ecb2930f01baf6b9f5c0d0ca5e44e4b046046ae57e1c10cd175723ad6997d83f",
    },
    reason:
      "Writes out the messages the website's createChat() builder (@/lib/ai, AI SDK) returns, and types MessageTextPart's props without @/components/message-parts; upstream's MessageExample renders neither.",
  },
  "progress-example": {
    functions: {
      ProgressControlled:
        "07dbcb6581787482d5763664edaf2a0c210330d6c95a1a21ffa7e6300b4066ad",
      FileUploadList:
        "cf87c1d571c2ed5f58e93079506784c045c45fa0b80fbdbf52da46d1ef83dd64",
    },
    reason:
      "The progress bar shows the slider's initial value and the slider starts from defaultValue, as following the thumb needs React state; the file list is a constant instead of useMemo.",
  },
  "select-example": {
    functions: {
      SelectPlan:
        "e6a286eac983e2faf686b8b146e401eb3980ee0e12372ea638d153cfd601b8c1",
    },
    reason:
      "The plans' values are their names instead of Base UI's object values, and SelectValue mirrors the chosen option (its SelectPlanItem) instead of a render function; neither is supported by Select.",
  },
  "sidebar-example": {
    functions: {
      SidebarExample:
        "24650ca44b84207ab700c40e0f9b3d6ba0e1ec25b53958da69dc1b2728c012fa",
    },
    reason:
      "The version switcher shows the first version, as switching needs React state.",
  },
  "sidebar-icon-example": {
    functions: {
      SidebarIconExample:
        "c251233bb9534591f3ebfbc3530f79c29b47f7112166557409b2ea0201aa1081",
    },
    reason:
      "The team switcher shows the first team (switching needs React state), and the menu buttons render the collapsible triggers, as CollapsibleTrigger has no render prop.",
  },
  "sidebar-inset-example": {
    functions: {
      SidebarInsetExample:
        "38fd74205c72367a2156eaf2afffac55b438e69c16304264be238a90b80d2f4b",
    },
    reason:
      "Collapsible and CollapsibleTrigger have no render prop: each Collapsible is inside its SidebarMenuItem, and the SidebarMenuAction renders the CollapsibleTrigger instead.",
  },
  "slider-example": {
    functions: {
      SliderControlled:
        "55dad95cdcadf9736082b722f5dd68b5112a325233df29408403ee196d14e6dd",
    },
    reason:
      "The slider starts from defaultValue and the slider script moves it; the label shows the initial values, as following the thumbs needs React state.",
  },
  "table-example": {
    functions: {
      TableWithSelect:
        "bdeb7101dfefff7d17837996ebe279ff1a96621cb37f30bffab7229aacea3309",
    },
    reason:
      "The selects' values are the people's value strings instead of Base UI's object values, which Select does not support.",
  },
  "toast-example": {
    functions: {
      ToastBasic:
        "0df7f28d0b7cd2171124e270046f3ae0eb8891a424847acc5f3b1b7e8870f22e",
      ToastWithAction:
        "929e0e4d2c7a11ca962a620ae44612c1590af977864eaa34aa94dfc6f7021162",
      ToastPromise:
        "47128bcf2e5d5ae1cb4329e22d710da12c849a4f225ba7d2655275ffb7c878ed",
    },
    reason:
      "The buttons are data-toast-trigger buttons of the toast script instead of calling toast.add(): the action toast has no Undo action and the promise toast shows its success toast, as data-toast-trigger takes neither.",
  },
  "toggle-group-example": {
    functions: {
      ToggleGroupFontWeightSelector:
        "53f7e8590e186386a3750b06becc0144fcd0af409212f1d8ae04b4ce89e4e8aa",
      ToggleGroupWithInputAndSelect:
        "e9b438c91045c468eb3c343800de0c5884048990580d7b55e46cb5c399193e50",
    },
    reason:
      "The toggle group starts from defaultValue, and the description shows the pressed item's weight with :has() on its native radios instead of React state; the select's value is the item's value string instead of Base UI's object value, which Select does not support.",
  },
  "tooltip-example": {
    functions: {
      TooltipOnLink:
        "4de0e377c08e45866d2db5787f003283410f0422abeaaaab36ec195313915450",
    },
    reason:
      'The link keeps its default action (href="#") instead of preventing it in a click handler.',
  },
}
