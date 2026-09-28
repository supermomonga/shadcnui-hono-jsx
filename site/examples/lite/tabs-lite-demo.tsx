import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  TabsLite,
  TabsLiteContent,
  TabsLiteList,
  TabsLiteTrigger,
} from "@/components/ui/tabs-lite"

export default function TabsLiteDemo() {
  return (
    <TabsLite value="overview" class="w-[400px]">
      <TabsLiteList aria-label="Project">
        <TabsLiteTrigger value="overview" href="#overview">
          Overview
        </TabsLiteTrigger>
        <TabsLiteTrigger value="analytics" href="#analytics">
          Analytics
        </TabsLiteTrigger>
        <TabsLiteTrigger value="reports" href="#reports">
          Reports
        </TabsLiteTrigger>
        <TabsLiteTrigger value="settings" href="#settings">
          Settings
        </TabsLiteTrigger>
      </TabsLiteList>
      <TabsLiteContent>
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              View your key metrics and recent project activity. Track progress
              across all your active projects.
            </CardDescription>
          </CardHeader>
          <CardContent class="text-sm text-muted-foreground">
            You have 12 active projects and 3 pending tasks.
          </CardContent>
        </Card>
      </TabsLiteContent>
    </TabsLite>
  )
}
