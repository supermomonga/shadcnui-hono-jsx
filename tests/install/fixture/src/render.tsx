import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

const page = (
  <Card>
    <CardHeader>
      <CardTitle>Installed</CardTitle>
    </CardHeader>
    <CardContent>
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>
      <Badge variant="secondary">Badge</Badge>
      <Label for="name">Name</Label>
      <Input id="name" />
      <Textarea />
      <Separator orientation="vertical" />
      <Skeleton class="h-4" />
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Button variant="outline">Save</Button>
    </CardContent>
  </Card>
)

console.log(String(page))
