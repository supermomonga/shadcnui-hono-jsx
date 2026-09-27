import { Button } from "@/components/ui/button"

export function ToastDemo() {
  return (
    <Button
      variant="outline"
      data-toast-trigger=""
      data-toast-title="Event created"
      data-toast-description="Sunday, December 3 at 9:00 AM"
    >
      Show Toast
    </Button>
  )
}
