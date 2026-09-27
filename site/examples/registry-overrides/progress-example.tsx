// @ts-nocheck: sections of site/generated/create/progress-example.tsx, whose icons they use.
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Example } from "./example"

function ProgressControlled() {
  const value = 50

  return (
    <Example title="Controlled">
      <div class="flex w-full flex-col gap-4">
        <Progress value={value} class="w-full" />
        <Slider defaultValue={value} min={0} max={100} step={1} />
      </div>
    </Example>
  )
}

function FileUploadList() {
  const files = [
    {
      id: "1",
      name: "document.pdf",
      progress: 45,
      timeRemaining: "2m 30s",
    },
    {
      id: "2",
      name: "presentation.pptx",
      progress: 78,
      timeRemaining: "45s",
    },
    {
      id: "3",
      name: "spreadsheet.xlsx",
      progress: 12,
      timeRemaining: "5m 12s",
    },
    {
      id: "4",
      name: "image.jpg",
      progress: 100,
      timeRemaining: "Complete",
    },
  ]

  return (
    <Example title="File Upload List">
      <ItemGroup>
        {files.map((file) => (
          <Item key={file.id} size="xs" class="px-0">
            <ItemMedia variant="icon">
              <FileIcon class="size-5" />
            </ItemMedia>
            <ItemContent class="inline-block truncate">
              <ItemTitle class="inline">{file.name}</ItemTitle>
            </ItemContent>
            <ItemContent>
              <Progress value={file.progress} class="w-32" />
            </ItemContent>
            <ItemActions class="w-16 justify-end">
              <span class="text-sm text-muted-foreground">
                {file.timeRemaining}
              </span>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </Example>
  )
}
