// @ts-nocheck: sections of site/generated/create/toast-example.tsx, which provides ./example.
import { Button } from "@/components/ui/button"
import { Example } from "./example"

function ToastBasic() {
  return (
    <Example title="Basic" class="items-center justify-center">
      <Button
        variant="outline"
        class="w-fit"
        data-toast-trigger=""
        data-toast-title="Event created"
        data-toast-description="Sunday, December 3 at 9:00 AM"
      >
        Show Toast
      </Button>
    </Example>
  )
}

function ToastWithAction() {
  return (
    <Example title="With Action" class="items-center justify-center">
      <Button
        variant="outline"
        class="w-fit"
        data-toast-trigger=""
        data-toast-title="Event created"
        data-toast-description="You can undo this action."
      >
        Show Toast
      </Button>
    </Example>
  )
}

function ToastPromise() {
  return (
    <Example title="Promise" class="items-center justify-center">
      <Button
        variant="outline"
        class="w-fit"
        data-toast-trigger=""
        data-toast-type="success"
        data-toast-description="Event created."
      >
        Create Event
      </Button>
    </Example>
  )
}
