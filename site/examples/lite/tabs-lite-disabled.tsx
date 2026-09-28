import {
  TabsLite,
  TabsLiteList,
  TabsLiteTrigger,
} from "@/components/ui/tabs-lite"

export default function TabsLiteDisabled() {
  return (
    <TabsLite value="home">
      <TabsLiteList aria-label="Sections">
        <TabsLiteTrigger value="home" href="#home">
          Home
        </TabsLiteTrigger>
        <TabsLiteTrigger value="settings" href="#settings" disabled>
          Disabled
        </TabsLiteTrigger>
      </TabsLiteList>
    </TabsLite>
  )
}
