import {
  TabsLite,
  TabsLiteList,
  TabsLiteTrigger,
} from "@/components/ui/tabs-lite"

export default function TabsLiteLine() {
  return (
    <TabsLite value="overview">
      <TabsLiteList variant="line" aria-label="Project">
        <TabsLiteTrigger value="overview" href="#overview">
          Overview
        </TabsLiteTrigger>
        <TabsLiteTrigger value="analytics" href="#analytics">
          Analytics
        </TabsLiteTrigger>
        <TabsLiteTrigger value="reports" href="#reports">
          Reports
        </TabsLiteTrigger>
      </TabsLiteList>
    </TabsLite>
  )
}
