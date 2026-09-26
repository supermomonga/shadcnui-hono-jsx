/**
 * The site's version of the shadcn/ui website's `@/components/language-selector`,
 * which the RTL examples use. Examples render on the server once per language
 * (components/component-preview.tsx), so `useTranslation` reads the language
 * from context instead of React state; the preview's selector switches which
 * rendering is visible.
 */
import { createContext, useContext } from "hono/jsx"

export type Language = "en" | "ar" | "he"

export type Direction = "ltr" | "rtl"

export type Translations<
  T extends Record<string, string> = Record<string, string>,
> = Record<Language, { dir: Direction; locale?: string; values: T }>

export const languageOptions = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic (العربية)" },
  { value: "he", label: "Hebrew (עברית)" },
] as const

export const LanguageContext = createContext<Language | undefined>(undefined)

export function useTranslation<T extends Record<string, string>>(
  translations: Translations<T>,
  defaultLanguage: Language = "ar"
) {
  const language = useContext(LanguageContext) ?? defaultLanguage
  const { dir, locale, values: t } = translations[language]
  return { language, setLanguage: (_: Language) => {}, dir, locale, t }
}
