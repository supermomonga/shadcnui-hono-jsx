/**
 * The themes and base colors the create page offers, read from upstream's
 * registry (`apps/v4/registry/themes.ts` and `base-colors.ts`, snapshotted
 * as `upstream/site/create/`): ui.shadcn.com/init accepts only these, which
 * can be fewer than the values of the preset codec (`gray`).
 */
import { Node, SyntaxKind } from "ts-morph"
import { parseSource } from "../analyzer/source"

export interface CreateThemes {
  /** Themes in upstream's order, with their titles. */
  themes: { name: string; title: string }[]
  /** Names of the themes that are base colors, in the same order. */
  baseColors: string[]
}

function stringProperty(node: Node, name: string): string | undefined {
  if (!Node.isObjectLiteralExpression(node)) return undefined
  const property = node.getProperty(name)
  const value = Node.isPropertyAssignment(property)
    ? property.getInitializer()
    : undefined
  return Node.isStringLiteral(value) ? value.getLiteralValue() : undefined
}

export function parseCreateThemes(
  themesSource: string,
  baseColorsSource: string
): CreateThemes {
  const themesFile = parseSource(themesSource, "themes.ts")
  // `[...] as const satisfies RegistryItem[]`
  let list = themesFile.getVariableDeclaration("THEMES")?.getInitializer()
  while (
    Node.isAsExpression(list) ||
    Node.isSatisfiesExpression(list) ||
    Node.isParenthesizedExpression(list)
  ) {
    list = list.getExpression()
  }
  if (!Node.isArrayLiteralExpression(list)) {
    throw new Error("themes.ts: no THEMES array")
  }
  const themes = list.getElements().map((element) => {
    const name = stringProperty(element, "name")
    const title = stringProperty(element, "title")
    if (!name || !title) {
      throw new Error(`themes.ts: a theme without a name or title`)
    }
    return { name, title }
  })

  // `BASE_COLORS = THEMES.filter((theme) => [names].includes(theme.name))`
  const baseColorsFile = parseSource(baseColorsSource, "base-colors.ts")
  const names = baseColorsFile
    .getVariableDeclaration("BASE_COLORS")
    ?.getDescendantsOfKind(SyntaxKind.ArrayLiteralExpression)
    .find((array) =>
      array.getElements().every((element) => Node.isStringLiteral(element))
    )
    ?.getElements()
    .map((element) => (element as Node).getText().slice(1, -1))
  if (!names || names.length === 0) {
    throw new Error("base-colors.ts: no list of base color names")
  }
  for (const name of names) {
    if (!themes.some((theme) => theme.name === name)) {
      throw new Error(`base-colors.ts: ${name} is not a theme`)
    }
  }
  return {
    themes,
    baseColors: themes
      .map((theme) => theme.name)
      .filter((name) => names.includes(name)),
  }
}
