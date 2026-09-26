import { Button } from "@/components/ui/button"

export function ToastPromise() {
  return (
    <Button
      variant="outline"
      data-toast-trigger=""
      data-toast-type="success"
      data-toast-description="Event created."
    >
      Create Event
    </Button>
  )
}
