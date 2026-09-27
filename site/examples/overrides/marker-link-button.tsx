import { GitBranchIcon, RotateCcwIcon } from "@/components/icons"
import { Marker, MarkerContent, MarkerIcon } from "@/ui/rhea/marker"

export function MarkerLinkButtonDemo() {
  return (
    <div class="flex w-full max-w-sm flex-col gap-8 py-12">
      <Marker render={<a href="#links-and-buttons" />}>
        <MarkerIcon>
          <GitBranchIcon />
        </MarkerIcon>
        <MarkerContent>View the pull request</MarkerContent>
      </Marker>
      <Marker
        render={
          <button
            type="button"
            class="transition-colors hover:text-foreground"
            data-toast-trigger=""
            data-toast-title="You clicked the revert button"
          />
        }
      >
        <MarkerIcon>
          <RotateCcwIcon />
        </MarkerIcon>
        <MarkerContent>Revert this change</MarkerContent>
      </Marker>
    </div>
  )
}
