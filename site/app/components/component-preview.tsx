import { cn } from "cn"
import type { Child } from "hono/jsx"
import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  exampleCode,
  exampleComponent,
  manifest,
  upstreamExampleUrl,
} from "@/lib/examples"
import { highlight } from "@/lib/highlight"
import { CodeBlock } from "./code-block"
import {
  type Language,
  LanguageContext,
  languageOptions,
} from "./language-selector"

type Align = "center" | "start" | "end"

interface PreviewProps {
  name: string
  class?: string
  previewClassName?: string
  align?: Align
  hideCode?: boolean
  direction?: "ltr" | "rtl"
  type?: "block" | "component" | "example"
  description?: string
  caption?: string
}

function PreviewWrapper({
  align,
  previewClassName,
  dir,
  lang,
  hidden,
  children,
}: {
  align: Align
  previewClassName?: string
  dir: "ltr" | "rtl"
  lang?: Language
  hidden?: boolean
  children?: Child
}) {
  return (
    <div
      data-slot="preview"
      dir={dir}
      data-lang={lang}
      hidden={hidden || undefined}
    >
      <div
        data-align={align}
        class={cn(
          "preview relative flex h-72 w-full justify-center p-10 data-[align=center]:items-center data-[align=end]:items-start data-[align=start]:items-start sm:data-[align=end]:items-end",
          previewClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}

function Unavailable({ name, reason }: { name: string; reason: string }) {
  return (
    <div class="flex h-72 flex-col items-center justify-center gap-2 p-10 text-center text-sm text-muted-foreground">
      <p>{reason}</p>
      <a
        class="font-medium text-foreground underline underline-offset-4"
        href={upstreamExampleUrl(name)}
      >
        See the upstream example
      </a>
    </div>
  )
}

/** An example of a docs page, rendered at build time, with its code. */
export async function ComponentPreview({
  name,
  class: className,
  previewClassName,
  align = "center",
  hideCode = false,
  direction = "ltr",
  type,
  caption,
}: PreviewProps) {
  const Example = exampleComponent(name)
  const code = exampleCode(name)
  const entry = manifest.examples[name]

  if (type === "block" && Example) {
    return (
      <figure class="flex flex-col gap-4">
        <div
          data-not-typeset=""
          class={cn(
            "relative mt-6 aspect-[4/2.5] w-full overflow-hidden rounded-2xl border md:-mx-1",
            className
          )}
        >
          {/* Wide enough for the desktop layout, clipped as on ui.shadcn.com. */}
          <div class="absolute inset-0 w-[1600px] bg-background">
            <iframe
              src={`/view/${name}`}
              title={name}
              loading="lazy"
              class="size-full"
            />
          </div>
        </div>
        {caption && (
          <figcaption class="text-center text-sm text-muted-foreground">
            {caption}
          </figcaption>
        )}
      </figure>
    )
  }

  let preview: Child
  if (!Example) {
    preview = (
      <Unavailable
        name={name}
        reason={
          entry?.skipped ?? "This example is not available in Hono JSX yet."
        }
      />
    )
  } else if (direction === "rtl") {
    preview = (
      <>
        <div class="flex h-16 items-center border-b px-4">
          <NativeSelect
            size="sm"
            class="w-40"
            dir="ltr"
            aria-label="Language"
            data-rtl-language=""
          >
            {languageOptions.map((option) => (
              <NativeSelectOption
                value={option.value}
                selected={option.value === "ar" || undefined}
              >
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        {languageOptions.map((option) => (
          <PreviewWrapper
            align={align}
            previewClassName={previewClassName}
            dir={option.value === "en" ? "ltr" : "rtl"}
            lang={option.value}
            hidden={option.value !== "ar"}
          >
            <LanguageContext.Provider value={option.value}>
              <Example />
            </LanguageContext.Provider>
          </PreviewWrapper>
        ))}
      </>
    )
  } else {
    preview = (
      <PreviewWrapper
        align={align}
        previewClassName={previewClassName}
        dir="ltr"
      >
        <Example />
      </PreviewWrapper>
    )
  }

  const content = (
    <div
      data-slot="component-preview"
      data-not-typeset=""
      class={cn(
        "group relative mt-4 mb-12 flex flex-col overflow-hidden rounded-2xl border",
        className
      )}
    >
      {preview}
      {!hideCode && code && (
        <div
          data-slot="code"
          data-open={code.split("\n").length <= 12 ? "" : undefined}
          class="group/code relative overflow-hidden [&_[data-code-figure]]:m-0! [&_[data-code-figure]]:rounded-none [&_[data-code-figure]]:border-t [&_pre]:max-h-72 data-[open]:[&_pre]:max-h-none"
        >
          {direction === "rtl" && (
            <div class="relative z-10 no-scrollbar overflow-x-auto border-t bg-code px-4 py-3.5 font-mono text-sm text-muted-foreground">
              <p>
                {
                  "// This example sets dir and uses useTranslation because this site is not RTL."
                }
              </p>
              <p>
                {"// In an RTL app you won't need them; see the "}
                <a href="/docs/rtl" class="underline underline-offset-4">
                  RTL guide
                </a>
                .
              </p>
            </div>
          )}
          <CodeBlock
            html={await highlight(code, "tsx")}
            raw={code}
            language="tsx"
          />
          <div class="absolute inset-x-0 bottom-0 flex h-24 items-end justify-center pb-4 group-data-[open]/code:hidden">
            <div
              class="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, var(--color-code), color-mix(in oklab, var(--color-code) 60%, transparent), transparent)",
              }}
            />
            <Button
              size="sm"
              variant="outline"
              class="relative z-10 rounded-lg bg-background text-foreground shadow-none hover:bg-muted"
              data-view-code=""
            >
              View Code
            </Button>
          </div>
        </div>
      )}
    </div>
  )
  if (!caption) return content
  return (
    <figure class="flex flex-col">
      {content}
      <figcaption class="-mt-8 text-center text-sm text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  )
}
