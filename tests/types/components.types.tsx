import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"
import { Badge, badgeVariants } from "../../components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Separator } from "../../components/ui/separator"
import { Skeleton } from "../../components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "../../components/ui/table"
import { Textarea } from "../../components/ui/textarea"

export const valid = [
  <Alert variant="destructive" class="mb-4">
    <AlertTitle>Title</AlertTitle>
    <AlertDescription>Description</AlertDescription>
  </Alert>,
  <Badge variant="outline">Badge</Badge>,
  <Card size="sm">
    <CardHeader>
      <CardTitle>Title</CardTitle>
    </CardHeader>
    <CardContent>Content</CardContent>
    <CardFooter>Footer</CardFooter>
  </Card>,
  <Input type="email" name="email" readonly required placeholder="x" />,
  <Label for="email">Email</Label>,
  <Separator orientation="vertical" />,
  <Skeleton class="h-4" />,
  <Table>
    <TableBody>
      <TableRow>
        <TableCell colspan={2}>Cell</TableCell>
      </TableRow>
    </TableBody>
  </Table>,
  <Textarea rows={3} />,
]

export const badgeClass: string = badgeVariants({ variant: "ghost" })

// @ts-expect-error unknown badge variant.
export const e1 = <Badge variant="info" />
// @ts-expect-error unknown card size.
export const e2 = <Card size="lg" />
// @ts-expect-error invalid separator orientation.
export const e3 = <Separator orientation="diagonal" />
// @ts-expect-error Badge does not support render (element replacement).
export const e4 = <Badge render={<a href="/" />} />
// @ts-expect-error className is not accepted.
export const e5 = <Textarea className="x" />
