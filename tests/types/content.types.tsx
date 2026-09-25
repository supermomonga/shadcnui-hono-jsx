import { AspectRatio } from "../../components/ui/aspect-ratio"
import { Bubble, BubbleContent } from "../../components/ui/bubble"
import { Empty, EmptyMedia, EmptyTitle } from "../../components/ui/empty"
import { Kbd, KbdGroup } from "../../components/ui/kbd"
import { Marker } from "../../components/ui/marker"
import { Message, MessageContent } from "../../components/ui/message"

export const valid = [
  <AspectRatio ratio={4 / 3} class="w-40" />,
  <Bubble variant="secondary" align="end">
    <BubbleContent>Hi</BubbleContent>
  </Bubble>,
  <Empty>
    <EmptyMedia variant="icon">i</EmptyMedia>
    <EmptyTitle>Nothing</EmptyTitle>
  </Empty>,
  <KbdGroup>
    <Kbd>K</Kbd>
  </KbdGroup>,
  <Marker variant="border">1</Marker>,
  <Message>
    <MessageContent>Hello</MessageContent>
  </Message>,
]

// @ts-expect-error ratio is required.
export const e1 = <AspectRatio />
// @ts-expect-error ratio must be a number.
export const e2 = <AspectRatio ratio="16/9" />
// @ts-expect-error className is not accepted.
export const e3 = <Kbd className="x" />
