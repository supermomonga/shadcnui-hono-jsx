import { Bubble, BubbleContent, BubbleGroup } from "@/ui/rhea/bubble"

export function BubbleLinkButtonDemo() {
  return (
    <div class="flex w-full max-w-sm flex-col gap-8 py-12">
      <Bubble variant="muted">
        <BubbleContent>How can I help you today?</BubbleContent>
      </Bubble>
      <BubbleGroup>
        <Bubble variant="tinted" align="end">
          <BubbleContent
            render={
              <button
                type="button"
                data-toast-trigger=""
                data-toast-title="You clicked forgot password"
              />
            }
          >
            I forgot my password
          </BubbleContent>
        </Bubble>
        <Bubble variant="tinted" align="end">
          <BubbleContent
            render={
              <button
                type="button"
                data-toast-trigger=""
                data-toast-title="You clicked help with subscription"
              />
            }
          >
            I need help with my subscription
          </BubbleContent>
        </Bubble>
        <Bubble variant="tinted" align="end">
          <BubbleContent
            render={
              <button
                type="button"
                data-toast-trigger=""
                data-toast-title="You clicked something else. Talk to a human."
              />
            }
          >
            Something else. Talk to a human.
          </BubbleContent>
        </Bubble>
      </BubbleGroup>
    </div>
  )
}
