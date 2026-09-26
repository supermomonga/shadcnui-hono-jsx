import { cn } from "cn"
import { ChevronsUpDown } from "@/components/icons"
import {
  type Translations,
  useTranslation,
} from "@/components/language-selector"
import { buttonVariants } from "@/ui/nova-rtl/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/ui/nova-rtl/collapsible"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      orderNumber: "Order #4189",
      status: "Status",
      shipped: "Shipped",
      shippingAddress: "Shipping address",
      address: "100 Market St, San Francisco",
      items: "Items",
      itemsDescription: "2x Studio Headphones",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      orderNumber: "الطلب #4189",
      status: "الحالة",
      shipped: "تم الشحن",
      shippingAddress: "عنوان الشحن",
      address: "100 Market St, San Francisco",
      items: "العناصر",
      itemsDescription: "2x سماعات الاستوديو",
    },
  },
  he: {
    dir: "rtl",
    values: {
      orderNumber: "הזמנה #4189",
      status: "סטטוס",
      shipped: "נשלח",
      shippingAddress: "כתובת משלוח",
      address: "100 Market St, San Francisco",
      items: "פריטים",
      itemsDescription: "2x אוזניות סטודיו",
    },
  },
}

export function CollapsibleRtl() {
  const { dir, t } = useTranslation(translations, "ar")
  return (
    <Collapsible class="flex w-[350px] flex-col gap-2" dir={dir}>
      <div class="flex items-center justify-between gap-4 px-4">
        <h4 class="text-sm font-semibold">{t.orderNumber}</h4>
        <CollapsibleTrigger
          class={cn(
            buttonVariants({
              variant: "ghost",
              size: "icon",
              class: "size-8",
            })
          )}
        >
          <ChevronsUpDown />
          <span class="sr-only">Toggle details</span>
        </CollapsibleTrigger>
      </div>
      <div class="flex items-center justify-between rounded-md border px-4 py-2 text-sm">
        <span class="text-muted-foreground">{t.status}</span>
        <span class="font-medium">{t.shipped}</span>
      </div>
      <CollapsibleContent class="flex flex-col gap-2">
        <div class="rounded-md border px-4 py-2 text-sm">
          <p class="font-medium">{t.shippingAddress}</p>
          <p class="text-muted-foreground">{t.address}</p>
        </div>
        <div class="rounded-md border px-4 py-2 text-sm">
          <p class="font-medium">{t.items}</p>
          <p class="text-muted-foreground">{t.itemsDescription}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
