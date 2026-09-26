import {
  type Translations,
  useTranslation,
} from "@/components/language-selector"
import { Progress, ProgressLabel } from "@/ui/nova-rtl/progress"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      label: "Upload progress",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      label: "تقدم الرفع",
    },
  },
  he: {
    dir: "rtl",
    values: {
      label: "התקדמות העלאה",
    },
  },
}

function toArabicNumerals(num: number): string {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]
  return num
    .toString()
    .split("")
    .map((digit) => arabicNumerals[parseInt(digit, 10)])
    .join("")
}

export function ProgressRtl() {
  const { dir, t, language } = useTranslation(translations, "ar")

  const formatNumber = (num: number): string => {
    if (language === "ar") {
      return toArabicNumerals(num)
    }
    return num.toString()
  }

  const value = 56

  return (
    <Progress value={value} class="w-full max-w-sm" dir={dir}>
      <ProgressLabel>{t.label}</ProgressLabel>
      {/* ProgressValue takes no render function: format the value in place. */}
      <span
        aria-hidden="true"
        class="ms-auto text-sm text-muted-foreground tabular-nums"
      >
        {formatNumber(value)}%
      </span>
    </Progress>
  )
}
