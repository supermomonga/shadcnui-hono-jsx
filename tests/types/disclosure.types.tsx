import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
} from "../../components/ui/alert-dialog"
import { Button, buttonVariants } from "../../components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/ui/collapsible"
import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/sheet"

export const valid = [
  <Accordion defaultValue={["a"]} multiple class="w-80">
    <AccordionItem value="a" disabled>
      <AccordionTrigger>A</AccordionTrigger>
      <AccordionContent>Body</AccordionContent>
    </AccordionItem>
  </Accordion>,
  <Collapsible defaultOpen>
    <CollapsibleTrigger class={buttonVariants({ variant: "ghost" })}>
      Toggle
    </CollapsibleTrigger>
    <CollapsibleContent>Body</CollapsibleContent>
  </Collapsible>,
  <AlertDialog>
    <AlertDialogContent size="sm">
      <AlertDialogCancel variant="ghost">Cancel</AlertDialogCancel>
      <AlertDialogAction type="submit">Continue</AlertDialogAction>
    </AlertDialogContent>
  </AlertDialog>,
  <Sheet>
    <SheetTrigger render={<Button variant="outline" />}>Open</SheetTrigger>
    <SheetContent side="left" />
  </Sheet>,
]

// @ts-expect-error the collapsible trigger is a <summary>, so render is not supported.
export const e2 = <CollapsibleTrigger render={<Button />} />
// @ts-expect-error sides are limited to upstream's.
export const e4 = <SheetContent side="center" />
