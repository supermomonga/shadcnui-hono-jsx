/**
 * Hand-written versions of upstream example functions that `site:generate`
 * cannot translate (they use React state, event handlers or React-only
 * libraries). Each override lives in `overrides/<example>.tsx`, exports the
 * replaced functions under their upstream names, and records the SHA-256 of
 * the upstream function it replaces: when upstream changes it,
 * `site:generate` fails until the override is reviewed and the hash updated.
 */
export interface Override {
  /** Upstream function name → SHA-256 of its upstream text. */
  functions: Record<string, string>
  /** What the override does instead of the React behavior. */
  reason: string
}

export const OVERRIDES: Record<string, Override> = {
  "bubble-collapsible": {
    functions: {
      BubbleCollapsible:
        "7bac13993b7417ce91c2ef9b37275a236f749ed62fa481f948439a6d7310c019",
    },
    reason:
      "Renders the preview and the full text, and the trigger's two labels, and lets the collapsible script and data-open variants show one of each instead of React state.",
  },
  "bubble-link-button": {
    functions: {
      BubbleLinkButtonDemo:
        "c150bda1ace53c223b679c38fc7f041b3783d5cfdf2447d00668527274291fba",
    },
    reason:
      "The bubble buttons are data-toast-trigger buttons of the toast script instead of calling sonner's toast() on click.",
  },
  "bubble-reactions": {
    functions: {
      BubbleReactionsDemo:
        "0e08b218e4ce00529df1f2b41c394d60c1b602a359d8b0c3614f1632f986a63a",
    },
    reason:
      "The reaction button is a data-toast-trigger button showing a success toast instead of calling sonner's toast.success() on click.",
  },
  "bubble-variants": {
    functions: {
      BubbleVariantsDemo:
        "58636010e75fb1aa3f0e0e0b7b4a7b57eb6388c293531c21f4f21aa186784a69",
    },
    reason:
      "Writes out the paragraphs, bold text and inline code that the website's Markdown component (Streamdown) renders from the ghost bubble's markdown.",
  },
  "button-group-demo": {
    functions: {
      ButtonGroupDemo:
        "0653fe37f00f2279f95078b24caf8d0bcdcd56c903b1e71db6a466df4d985beb",
    },
    reason:
      "The label radio group starts from defaultValue and the menu script checks items instead of React state.",
  },
  "button-group-input-group": {
    functions: {
      ButtonGroupInputGroup:
        "cf7912a1fffadc57afdff6cafd35822fa8caad7c36e17d44eb6405e04765d1f1",
    },
    reason:
      "Renders voice mode off; the voice button does not toggle it, as that needs React state.",
  },
  "button-group-rtl": {
    functions: {
      ButtonGroupRtl:
        "6001d2ea03f77fadfe38baceb4482019f1922e25afef88bff718611c296b9af4",
    },
    reason:
      "The label radio group starts from defaultValue and the menu script checks items instead of React state.",
  },
  "button-group-select": {
    functions: {
      ButtonGroupSelect:
        "e71c48cfdab720319cd7c5db77d84e8a8e1819a4785215d5e9501581a38a5fb4",
    },
    reason:
      "The native select starts from defaultValue and shows the chosen symbol with SelectValue, hiding the currency name there, instead of rendering React state in the trigger.",
  },
  "card-spacing": {
    functions: {
      CardSpacing:
        "687887aa5322badd39f4b04ce4c6aa11a00a82d2507d4347ab0c641f298781d6",
    },
    reason:
      "The toggle group starts from defaultValue and the card follows its checked native radio with :has() variants instead of React state.",
  },
  "checkbox-table": {
    functions: {
      CheckboxInTable:
        "34a5eb8545e22b784b88e25b6d980349a1ae229f911769d3213f43d3a4ca33a3",
    },
    reason:
      "The native checkboxes start checked with defaultChecked and rows highlight with has-checked; checking all rows from the header needs React state and is not wired.",
  },
  "collapsible-basic": {
    functions: {
      CollapsibleBasic:
        "c5d4980ba805d91d7476133c5232ce1e015636c1b71fe5f28f8967ac7b9c2422",
    },
    reason:
      "Imports the icon from the site's icons, styles the trigger with buttonVariants (no render prop) and uses open: variants of the native <details> for the open state.",
  },
  "collapsible-demo": {
    functions: {
      CollapsibleDemo:
        "cecf377c2e6cbea2420147ba527e58b1944474edb180ba08428c0cff0022d4e0",
    },
    reason:
      "The collapsible script toggles it instead of React state, and the trigger is styled with buttonVariants (no render prop).",
  },
  "collapsible-file-tree": {
    functions: {
      CollapsibleFileTree:
        "a07fb683ffd574e85efa5c07cc622cc8b14c918923162e00ed9b87f77ac12aeb",
    },
    reason:
      "Styles the folder triggers with buttonVariants, as CollapsibleTrigger has no render prop.",
  },
  "collapsible-rtl": {
    functions: {
      CollapsibleRtl:
        "ab9f94f6ddbb0865abc3008c8c1dd0ba1d435cb35fb1f200a918e8592e3797c0",
    },
    reason:
      "The collapsible script toggles it instead of React state, and the trigger is styled with buttonVariants (no render prop).",
  },
  "collapsible-settings": {
    functions: {
      CollapsibleSettings:
        "2c27038b0070dc9705759499ffc6e9acaa3655bbca18897317080b8f897ee016",
    },
    reason:
      "The collapsible script toggles it instead of React state; the trigger (styled with buttonVariants) shows the icon for its state with data-panel-open variants.",
  },
  "context-menu-radio": {
    functions: {
      ContextMenuRadio:
        "a40a54f4a18a27ad5a2283b6f8aab8888ca3dba86bb92aef74596940a4d41147",
    },
    reason:
      "The radio groups start from defaultValue and the menu script checks items instead of React state.",
  },
  "context-menu-rtl": {
    functions: {
      ContextMenuRtl:
        "6af84184cdff6bf651f76c2ded0a4c5963b7eff99196b745f3cab0dcc200d12a",
    },
    reason:
      "The radio group starts from defaultValue and the menu script checks items instead of React state.",
  },
  "drawer-demo": {
    functions: {
      DrawerDemo:
        "ccee400fd4578cd7a5b5b7c63e516aa5a4aeaf1f4f1b7f90a3fa8a07a639557c",
    },
    reason:
      "Renders the desktop drawer (from the right, no swipe handle) with native radios from defaultValue; confirming closes it and shows a toast through data-toast-trigger, without the chosen time, instead of React state and sonner.",
  },
  "drawer-dialog": {
    functions: {
      DrawerDialogDemo:
        "e0fc597941ebafb00a445fd5ed5e8db530f32952b6e0fd5fc37b90355663b8eb",
    },
    reason:
      "Renders the desktop branch (a Dialog) that useMediaQuery picks on wide screens; the native dialog opens without React state.",
  },
  "drawer-nested": {
    functions: {
      DrawerNested:
        "3a11f34863ea3d381b7a9e8b102e6ea13c3906807074761d79e06fe51706822a",
    },
    reason:
      "Renders the desktop drawers (from the right, no swipe handle) that useIsMobile picks on wide screens.",
  },
  "drawer-non-modal": {
    functions: {
      DrawerNonModal:
        "6c8ecbb7419fd85b447c1f1853f496bcd07eacf5a8ecc3fab8a5684377f7a3ea",
    },
    reason:
      'Drawer has no modal={false} or disablePointerDismissal: the drawer opens as a modal dialog, and closedby="closerequest" on its dialog ignores outside clicks as disablePointerDismissal does.',
  },
  "dropdown-menu-checkboxes": {
    functions: {
      DropdownMenuCheckboxes:
        "ece4694710234d6b1bb8cc57257a2ff72e4739eff3efbcf5081624da688e72ae",
    },
    reason:
      "The checkbox items start from defaultChecked and the menu script toggles them instead of React state.",
  },
  "dropdown-menu-checkboxes-icons": {
    functions: {
      DropdownMenuCheckboxesIcons:
        "f784a3273d1bd8f40d7b89e6ebaaa1b011eda8707d6a0f72ee92d09f68f7fed4",
    },
    reason:
      "The checkbox items start from defaultChecked and the menu script toggles them instead of React state.",
  },
  "dropdown-menu-complex": {
    functions: {
      DropdownMenuComplex:
        "24d47b0abf977b7cdb633d6f6afbbd64fcfc86f819b1e5c296b524571c62fc43",
    },
    reason:
      "The checkbox and radio items start from defaultChecked and defaultValue and the menu script toggles them instead of React state (items that share state upstream toggle separately).",
  },
  "dropdown-menu-radio-group": {
    functions: {
      DropdownMenuRadioGroupDemo:
        "e844b71858339706f2291708e2b44a11d0c0eb6e99f638e5911d7e80c6b1f84c",
    },
    reason:
      "The radio group starts from defaultValue and the menu script checks items instead of React state.",
  },
  "dropdown-menu-radio-icons": {
    functions: {
      DropdownMenuRadioIcons:
        "6c7947b33172f61e240059cc26fed137fe67e2c8e8de105b508aef504f1bcead",
    },
    reason:
      "The radio group starts from defaultValue and the menu script checks items instead of React state.",
  },
  "dropdown-menu-rtl": {
    functions: {
      DropdownMenuRtl:
        "a3b5c4fe0663c90b3c5a4bf7c05aadf1d1f5fc76de58bcb8d484aa235f15489b",
    },
    reason:
      "The checkbox and radio items start from defaultChecked and defaultValue and the menu script toggles them instead of React state.",
  },
  "field-slider": {
    functions: {
      FieldSlider:
        "6f66b0a4e6ee3c17c5c04f47ed3191c3788e31be7a4ff51b34c68537020ae164",
    },
    reason:
      "The slider starts from defaultValue and the slider script moves it; the description shows the initial range, as following the thumbs needs React state.",
  },
  "input-group-button": {
    functions: {
      InputGroupButtonExample:
        "06ea3cc3b7acba0b58ea88a7385bf5cd4d7dce9d289272cbdd4afdd7f83065d6",
    },
    reason:
      "Renders the initial state: the copy and favorite buttons do not copy or toggle, as that needs React hooks.",
  },
  "input-group-custom": {
    functions: {
      InputGroupCustom:
        "0e993622d0d9f270ce8667e95dfd36f8ca7c43d36e9087cd9bdfffa6743afdef",
    },
    reason:
      "A native textarea with the same classes replaces react-textarea-autosize; field-sizing-content grows it.",
  },
  "marker-link-button": {
    functions: {
      MarkerLinkButtonDemo:
        "c87c260d4deaabd40e1b7f4816c1144b505fa2698adfb0c940bc1f0ec6d54001",
    },
    reason:
      "The revert button is a data-toast-trigger button instead of calling sonner's toast() on click.",
  },
  "menubar-radio": {
    functions: {
      MenubarRadio:
        "d15dadc12a682e4ed2ffd032e3c61cf9ccb4ebd5b9edd4de3df1f70d66293bdc",
    },
    reason:
      "The radio groups start from defaultValue and the menu script checks items instead of React state.",
  },
  "menubar-rtl": {
    functions: {
      MenubarRtl:
        "b27498bdae7d2aee8520b9ec17b0878144db76b1e8c8d7816709ae5eb3f6408f",
    },
    reason:
      "The radio group starts from defaultValue and the menu script checks items instead of React state.",
  },
  "progress-controlled": {
    functions: {
      ProgressControlled:
        "7d64e9dc58342bc12381eda29b044d7f255f61c9b6bb0a0c88bd28f69c45c7df",
    },
    reason:
      "The progress and the slider start at 50; the progress does not follow the slider, as that needs React state.",
  },
  "progress-demo": {
    functions: {
      ProgressDemo:
        "cbce58d03ff61981368ba2bd97ec0f439d95aa5812aa49f19f87bdf17fe6c6ec",
    },
    reason:
      "Renders the value the effect animates to (66) instead of starting at 13.",
  },
  "progress-rtl": {
    functions: {
      ProgressRtl:
        "ad2663accdb852fa599b096f83b4578949d00c80ee6980a1764698c8935378c6",
    },
    reason:
      "ProgressValue takes no render function here, so a span styled like it shows the value with Arabic numerals.",
  },
  "select-align-item": {
    functions: {
      SelectAlignItem:
        "c4a9c28a6aa5450b331d98a2672bbe60cf21a0a48576e0fc462495f39af83286",
    },
    reason:
      "The switch starts checked with defaultChecked; the native select always opens below the trigger (alignItemWithTrigger is not supported), so it changes nothing.",
  },
  "select-rtl": {
    functions: {
      SelectRtl:
        "ea4263e53d1726ccdbbc1f759ae4bb1aa620c4ccca6574303a085e8a900e9e3e",
    },
    reason:
      "The native select starts empty and shows the translated placeholder through SelectValue instead of the items prop and React state.",
  },
  "sidebar-demo": {
    functions: {
      TeamSwitcher:
        "793d388cef126da2049adab7d889ac534453ab547b21e94d0e1fd92f978ff15b",
      NavMain:
        "b9e9b595cc42189c0216b67b70de3b7b06a9d60577de523b2cbdb484f305e363",
      NavProjects:
        "12e7e5714a80bf2e8b2ed887e7125af4e1b553d37fdece1e1908629e099bd235",
      NavUser:
        "73cc4d57ba49d781d3074771ee904d42a76bec3b37d0d054639666eadb8cd4cb",
    },
    reason:
      "Renders the desktop menus (side right) without useSidebar(), the team switcher shows the first team (switching needs React state), and NavMain's menu buttons render the collapsible triggers, as CollapsibleTrigger has no render prop.",
  },
  "slider-controlled": {
    functions: {
      SliderControlled:
        "ae2873f90abe466edb8a8620f1b9799f4c1673aa588b123ab9f7d8c4636a113a",
    },
    reason:
      "The slider starts from defaultValue and the slider script moves it; the label shows the initial values, as following the thumbs needs React state.",
  },
  "toast-demo": {
    functions: {
      ToastDemo:
        "e1847d026dbc019cd438bc819b3b967b7eb2f696d45490117c26b11d21077df8",
    },
    reason:
      "A data-toast-trigger button shows the toast through the toast script; data attributes cannot add the Undo action.",
  },
  "toast-promise": {
    functions: {
      ToastPromise:
        "89d4acaeefcc7b32c2e20d442cc29b211e1ba02d0985ce7b0ed970c68f303a51",
    },
    reason:
      "A data-toast-trigger button shows the success toast that toast.promise() ends with, without the loading state.",
  },
  "toast-types": {
    functions: {
      ToastTypes:
        "b17b1d5be400c86cada7ef88f68feb7e2e9c982ab041d2c23cc45d5a26adc10c",
    },
    reason:
      "data-toast-trigger buttons with data-toast-type show the toasts through the toast script; the error toast's high priority cannot be set from data attributes.",
  },
  "toggle-group-font-weight-selector": {
    functions: {
      ToggleGroupFontWeightSelector:
        "69fbb5c12672c8ca28084fb56ac8537f51458bf01c6c545eb5e8da7ee933e3fb",
    },
    reason:
      "The toggle group starts from defaultValue and the description shows the checked native radio's weight with :has() variants instead of React state.",
  },
}

/** Examples the site shows no version of, with the reason shown instead. */
export const SKIPPED: Record<string, string> = {}
