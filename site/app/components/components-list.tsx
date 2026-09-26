import { components } from "@/lib/catalog"

export function ComponentsList() {
  return (
    <div
      data-not-typeset=""
      class="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2 md:grid-cols-3 lg:gap-x-16 lg:gap-y-2 xl:gap-x-20"
    >
      {components.map((entry) => (
        <a
          href={`/docs/components/${entry.name}`}
          class="inline-flex items-center gap-2 text-lg font-medium underline-offset-4 hover:underline md:text-base"
        >
          {entry.title}
          {entry.unreleased && (
            <span
              class="flex size-2 rounded-full bg-amber-500"
              title="Unreleased"
            />
          )}
        </a>
      ))}
    </div>
  )
}
