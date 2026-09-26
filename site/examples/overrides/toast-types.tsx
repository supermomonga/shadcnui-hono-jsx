import { Button } from "@/components/ui/button"

export function ToastTypes() {
  return (
    <div class="flex flex-wrap gap-2">
      <Button
        variant="outline"
        data-toast-trigger=""
        data-toast-description="Event has been created."
      >
        Default
      </Button>
      <Button
        variant="outline"
        data-toast-trigger=""
        data-toast-type="success"
        data-toast-description="Event has been created."
      >
        Success
      </Button>
      <Button
        variant="outline"
        data-toast-trigger=""
        data-toast-type="info"
        data-toast-description="Arrive 10 minutes before the event."
      >
        Info
      </Button>
      <Button
        variant="outline"
        data-toast-trigger=""
        data-toast-type="warning"
        data-toast-description="The event cannot start before 8:00 AM."
      >
        Warning
      </Button>
      <Button
        variant="outline"
        data-toast-trigger=""
        data-toast-type="error"
        data-toast-description="The event could not be created."
      >
        Error
      </Button>
    </div>
  )
}
