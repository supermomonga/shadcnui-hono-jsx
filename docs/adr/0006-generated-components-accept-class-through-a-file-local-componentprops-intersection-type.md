---
number: 6
title: Generated components accept class through a file-local ComponentProps intersection type
status: accepted
date: 2026-09-25
---

# Generated components accept class through a file-local ComponentProps intersection type

## Context and Problem Statement

Upstream components are typed with `React.ComponentProps<"tag">` and accept
`className`. Hono JSX renders `class`, also accepts `className` (renaming it),
but emits two `class` attributes if both are given. Its intrinsic element types
(`JSX.IntrinsicElements[T]`) type `class` as `string | Promise<string>`, which
`cn()` does not accept, and carry a `[attr: string]: any` index signature. How
should generated components type and name their props?

## Decision Drivers

* Hono-native API: the specification prefers `class` over React conventions.
* Items are installed as standalone universal files without import rewriting,
  so shared helper modules would need extra registry plumbing.
* Types must reject misuse (`className`, unsupported `render`/`asChild`) and
  work with `exactOptionalPropertyTypes`.

## Considered Options

* `class` only, typed with a file-local `ComponentProps<T>` intersection helper
* Accept both `class` and `className` and merge them
* `Omit<JSX.IntrinsicElements[T], "class"> & { class?: string }`

## Decision Outcome

Chosen option: "`class` only with a file-local intersection helper".

Each generated file that needs it declares:

```ts
type ComponentProps<T extends keyof JSX.IntrinsicElements> =
  JSX.IntrinsicElements[T] & {
    class?: string | undefined
    className?: never
    render?: never
    asChild?: never
  }
```

Components bind the `class` prop to the upstream local name `className` in
their parameter destructuring, so upstream bodies that pass `className` to `cn`
or to a `cva` variants function are unchanged, and they render `class=`.

### Consequences

* Good, because the intersection narrows `class` to `string` and rejects
  `className`, `render`, and `asChild` at compile time while keeping every
  element-specific attribute type.
* Good, because each installed file is self-contained.
* Bad, because the helper is repeated in every file.
* Bad, because React-style `className` users get a type error and must switch.

### Confirmation

`tests/types/*.types.tsx` compile under `tests/types/tsconfig.json` and
`tsconfig.strict.json` (`exactOptionalPropertyTypes`) with `@ts-expect-error`
cases for `className`, `class={Promise}`, `render`, `asChild`, and invalid
variants.

## Pros and Cons of the Options

### `class` only with intersection helper

* Good, because it matches Hono JSX conventions and is type-safe.

### Accept both `class` and `className`

* Good, because it is familiar to React users.
* Bad, because it keeps a React-shaped API and adds merge logic to every
  component.

### `Omit` based type

* Bad, because `Omit` over a type with a string index signature collapses
  `keyof` to `string | number` and erases all known attribute types.
