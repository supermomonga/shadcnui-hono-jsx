import {
  TabsLite,
  TabsLiteList,
  TabsLiteTrigger,
} from "@/components/ui/tabs-lite"

export default function TabsLiteVertical() {
  return (
    <TabsLite value="account" orientation="vertical">
      <TabsLiteList aria-label="Settings">
        <TabsLiteTrigger value="account" href="#account">
          Account
        </TabsLiteTrigger>
        <TabsLiteTrigger value="password" href="#password">
          Password
        </TabsLiteTrigger>
        <TabsLiteTrigger value="notifications" href="#notifications">
          Notifications
        </TabsLiteTrigger>
      </TabsLiteList>
    </TabsLite>
  )
}
