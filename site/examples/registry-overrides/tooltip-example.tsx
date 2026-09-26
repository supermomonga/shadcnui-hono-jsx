// @ts-nocheck: a section of site/generated/create/tooltip-example.tsx, which provides ./example.
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Example } from "./example"

function TooltipOnLink() {
  return (
    <Example title="On Link">
      <Tooltip>
        <TooltipTrigger
          render={
            <a
              href="#"
              class="w-fit text-sm text-primary underline-offset-4 hover:underline"
            />
          }
        >
          Learn more
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to read the documentation</p>
        </TooltipContent>
      </Tooltip>
    </Example>
  )
}
