// @ts-nocheck: sections of site/generated/create/bubble-example.tsx, whose icons and constants they use.
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from "@/components/ui/bubble"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Marker, MarkerContent } from "@/components/ui/marker"
import { Example } from "./example"

function BubbleCollapsible() {
  const isLong = text.length > previewLength
  const preview = `${text.slice(0, previewLength)}...`

  return (
    <Example title="Collapsible">
      <div class="flex w-full max-w-md flex-col gap-8">
        <Collapsible class="group/collapsible">
          <Bubble variant="muted" align="end">
            <BubbleContent class="whitespace-pre-line">
              {isLong ? (
                <>
                  <div class="group-data-open/collapsible:hidden">
                    {preview}
                  </div>
                  <CollapsibleContent>{text}</CollapsibleContent>
                  <CollapsibleTrigger
                    class={buttonVariants({
                      variant: "link",
                      class: "gap-1 p-0 text-muted-foreground",
                    })}
                  >
                    <span class="group-data-panel-open/button:hidden">
                      Show more
                    </span>
                    <span class="hidden group-data-panel-open/button:inline">
                      Show less
                    </span>
                    <ChevronDownIcon
                      data-icon="inline-end"
                      class="group-data-panel-open/button:rotate-180"
                    />
                  </CollapsibleTrigger>
                </>
              ) : (
                <div>{text}</div>
              )}
            </BubbleContent>
          </Bubble>
        </Collapsible>
        <Bubble variant="ghost">
          <BubbleContent>
            <span class="whitespace-pre-wrap">
              {`Ghost bubbles work for assistant text and other content that should not be framed.

This is perfect for assistant messages that should not have a frame and can take the full width of the container.

Use this for content that needs the whole row.`}
            </span>
          </BubbleContent>
        </Bubble>
      </div>
    </Example>
  )
}

function BubbleReactionsButtons() {
  return (
    <Example title="Reactions Buttons">
      <div class="flex w-full max-w-md flex-col gap-8">
        <Bubble>
          <BubbleContent>This is a one line message.</BubbleContent>
          <BubbleReactions>
            <Button
              variant="outline"
              size="xs"
              data-toast-trigger=""
              data-toast-title="You clicked the button in the bubble reaction"
            >
              Button
            </Button>
          </BubbleReactions>
        </Bubble>
        <Bubble align="end">
          <BubbleContent>This is a one line message.</BubbleContent>
          <BubbleReactions align="start">
            <Button
              variant="ghost"
              size="icon-xs"
              data-toast-trigger=""
              data-toast-title="Confetti!"
            >
              🎉
            </Button>
          </BubbleReactions>
        </Bubble>
        <Bubble variant="tinted">
          <BubbleContent>
            We are going to the movies first then dinner. Are you in?
          </BubbleContent>
          <BubbleReactions class="gap-1 bg-background">
            <Button
              variant="secondary"
              size="icon-xs"
              aria-label="Thumbs up"
              data-toast-trigger=""
              data-toast-title="You agree!"
            >
              <ThumbsUpIcon />
            </Button>
            <Button
              variant="secondary"
              size="icon-xs"
              aria-label="Thumbs down"
              data-toast-trigger=""
              data-toast-title="You disagree!"
            >
              <ThumbsDownIcon />
            </Button>
          </BubbleReactions>
        </Bubble>
      </div>
    </Example>
  )
}

function BubbleButtonLinks() {
  return (
    <Example title="Button & Links">
      <div class="flex w-full max-w-md flex-col gap-8">
        <Bubble>
          <BubbleContent render={<a href="#" />}>
            This bubble is a link.
          </BubbleContent>
        </Bubble>
        <Bubble variant="secondary">
          <BubbleContent render={<button type="button" />}>
            This one is a button you can click.
          </BubbleContent>
        </Bubble>
        <Bubble variant="muted">
          <BubbleContent render={<button type="button" />}>
            You can also do tinted buttons. Even ones that are multilines.
          </BubbleContent>
        </Bubble>
        <Marker variant="separator">
          <MarkerContent>Chat Suggestions</MarkerContent>
        </Marker>
        <Bubble>
          <BubbleContent>How can I help you today?</BubbleContent>
        </Bubble>
        <BubbleGroup>
          {quickReplies.map((reply) => (
            <Bubble key={reply.label} variant="outline" align="end">
              <BubbleContent
                class="border-dashed border-primary"
                render={
                  <button
                    type="button"
                    data-toast-trigger=""
                    data-toast-title={reply.message}
                  />
                }
              >
                {reply.label}
              </BubbleContent>
            </Bubble>
          ))}
        </BubbleGroup>
      </div>
    </Example>
  )
}
