// @ts-nocheck: sections of site/generated/create/message-example.tsx, whose types they use.
import { Bubble, BubbleContent } from "@/components/ui/bubble"

/**
 * The messages the website's createChat() builder (`@/lib/ai`) returns for
 * this conversation, written out as AI SDK UIMessage objects.
 */
const messagePartsChat = {
  get: (): MessagePartsMessage[] => [
    {
      id: "message-parts-user",
      role: "user",
      parts: [
        {
          type: "file",
          mediaType: "image/jpeg",
          filename: "checkout-error.jpg",
          url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&auto=format&fit=crop&q=80",
        },
        {
          type: "text",
          text: "Can you review this screenshot and check the deployment?",
        },
      ],
    },
    {
      id: "message-parts-assistant",
      role: "assistant",
      parts: [
        {
          type: "reasoning",
          text: "The user included an image and asked for deployment status, so I should inspect the screenshot context and call the deployment health tool before answering.",
        },
        {
          type: "tool-getDeploymentHealth",
          toolCallId: "getDeploymentHealth",
          title: "Checking deployment health",
          state: "output-available",
          input: {
            project: "checkout",
            region: "iad1",
          },
          output: {
            status: "healthy",
            p95: 186,
            errors: 2,
            recommendation: "Keep the deployment live and monitor error rate.",
          },
        },
        {
          type: "data-deployment",
          id: "deployment-health",
          data: {
            status: "healthy",
            region: "iad1",
            latency: 186,
          },
        },
        {
          type: "text",
          text: "The deployment looks healthy. P95 latency is **186ms** with **2 recent errors**, so I would keep it live and monitor error rate for the next 15 minutes.",
        },
        {
          type: "source-url",
          sourceId: "source-deployment-docs",
          title: "Deployment health checks",
          url: "https://vercel.com/docs/deployments",
        },
        {
          type: "source-document",
          sourceId: "source-runbook",
          title: "Checkout release runbook",
          filename: "checkout-release-runbook.md",
          mediaType: "text/markdown",
        },
      ],
    },
  ],
}

function MessageTextPart({
  part,
  message,
}: {
  part: MessagePartsPart
  message: MessagePartsMessage
}) {
  if (part.type !== "text") {
    return null
  }

  return (
    <Bubble
      align={message.role === "user" ? "end" : "start"}
      variant={message.role === "user" ? "default" : "ghost"}
    >
      <BubbleContent>
        <span class="whitespace-pre-wrap">{part.text}</span>
      </BubbleContent>
    </Bubble>
  )
}
