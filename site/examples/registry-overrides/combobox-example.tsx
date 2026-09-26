// @ts-nocheck: sections of site/generated/create/combobox-example.tsx, whose constants they use.
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Example } from "./example"

function ComboboxWithForm() {
  return (
    <Example title="Form with Combobox">
      <Card class="w-full max-w-sm" size="sm">
        <CardContent>
          {/* method="dialog" outside a dialog: the browser validates the form, and submitting does not leave the preview. */}
          <form id="form-with-combobox" class="w-full" method="dialog">
            <FieldGroup>
              <Field>
                <FieldLabel for="framework">Framework</FieldLabel>
                <Combobox items={frameworks}>
                  <ComboboxInput
                    id="framework"
                    name="framework"
                    placeholder="Select a framework"
                    required
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Button type="submit" form="form-with-combobox">
            Submit
          </Button>
        </CardFooter>
      </Card>
    </Example>
  )
}

function ComboboxInDialog() {
  return (
    <Example title="Combobox in Dialog">
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>
          Open Dialog
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Framework</DialogTitle>
            <DialogDescription>
              Choose your preferred framework from the list below.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel for="framework-dialog" class="sr-only">
              Framework
            </FieldLabel>
            <Combobox items={frameworks}>
              <ComboboxInput
                id="framework-dialog"
                placeholder="Select a framework"
              />
              <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <DialogClose
              render={
                <Button
                  type="button"
                  data-toast-trigger=""
                  data-toast-title="Framework selected."
                />
              }
            >
              Confirm
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Example>
  )
}
