// @ts-nocheck: a section of site/generated/create/marker-example.tsx, whose icons it uses.
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { Spinner } from "@/components/ui/spinner"
import { Example } from "./example"

function MarkerExample() {
  return (
    <Example title="Markers" class="gap-8">
      <Marker>
        <MarkerContent>A default marker</MarkerContent>
      </Marker>
      <Marker>
        <MarkerIcon>
          <FileTextIcon />
        </MarkerIcon>
        <MarkerContent>Marker with icon</MarkerContent>
      </Marker>
      <Marker role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent>Marker with a spinner</MarkerContent>
      </Marker>
      <Marker role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent class="shimmer">
          Marker with shimmer effect
        </MarkerContent>
      </Marker>
      <Marker role="status">
        <MarkerContent class="shimmer">Thinking...</MarkerContent>
      </Marker>
      <Marker render={<a href="#" />}>
        <MarkerIcon>
          <GitBranchIcon />
        </MarkerIcon>
        <MarkerContent>Marker as a link</MarkerContent>
      </Marker>
      <Marker
        render={
          <button
            data-toast-trigger=""
            data-toast-title="You clicked the button"
            class="transition-colors hover:text-foreground"
          />
        }
      >
        <MarkerIcon>
          <ClockIcon />
        </MarkerIcon>
        <MarkerContent class="flex-1">
          <div>Marker as a button</div>
        </MarkerContent>
        <MarkerIcon>
          <ChevronRightIcon />
        </MarkerIcon>
      </Marker>
      <Marker>
        <MarkerIcon>
          <CircleUserIcon />
        </MarkerIcon>
        <MarkerContent>Rhea joined the chat</MarkerContent>
      </Marker>
      <Marker class="justify-center">
        <MarkerContent>
          <strong class="font-medium">Olivia Rose</strong> left the chat
        </MarkerContent>
      </Marker>
      <Marker class="flex-col">
        <MarkerIcon>
          <FileTextIcon />
        </MarkerIcon>
        <MarkerContent>Marker with icon at the top</MarkerContent>
      </Marker>
    </Example>
  )
}
