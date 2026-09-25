import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const invoices = [
  { id: "INV001", status: "Paid", amount: "$250.00" },
  { id: "INV002", status: "Pending", amount: "$150.00" },
  { id: "INV003", status: "Unpaid", amount: "$350.00" },
]

const variants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const

/** Server-rendered showcase of the generated components. No client JavaScript. */
export function Demo({ runtime }: { runtime: string }) {
  return (
    <main class="mx-auto flex max-w-3xl flex-col gap-8 p-8">
      <header class="flex flex-col gap-2">
        <h1 class="text-2xl font-semibold">shadcnui-hono-jsx</h1>
        <p class="text-muted-foreground">
          shadcn/ui components rendered by <code>hono/jsx</code> on {runtime},
          without React.
        </p>
      </header>

      <section class="flex flex-col gap-3">
        <h2 class="font-medium">Button</h2>
        <div class="flex flex-wrap items-center gap-2">
          {variants.map((variant) => (
            <Button variant={variant}>{variant}</Button>
          ))}
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section class="flex flex-col gap-3">
        <h2 class="font-medium">Badge</h2>
        <div class="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

      <Alert>
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          These components ship zero client-side JavaScript.
        </AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          The destructive variant uses the same markup.
        </AlertDescription>
      </Alert>

      <Card class="max-w-sm">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Enter your email to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            method="post"
            action="/subscribe"
            class="flex flex-col gap-2"
            id="subscribe"
          >
            <Label for="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </form>
        </CardContent>
        <CardFooter class="justify-end gap-2">
          <Button variant="outline" type="reset" form="subscribe">
            Reset
          </Button>
          <Button type="submit" form="subscribe">
            Subscribe
          </Button>
        </CardFooter>
      </Card>

      <section class="flex flex-col gap-3">
        <h2 class="font-medium">Dialog</h2>
        <p class="text-sm text-muted-foreground">
          A native <code>&lt;dialog&gt;</code> opened with Invoker Commands,
          still without any JavaScript.
        </p>
        <Dialog id="edit-profile">
          <DialogTrigger class={buttonVariants({ variant: "outline" })}>
            Edit profile
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div class="grid gap-3">
              <Label for="profile-name">Name</Label>
              <Input id="profile-name" value="Pedro Duarte" />
            </div>
            <DialogFooter showCloseButton>
              <Button>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      <Separator />

      <Table>
        <TableCaption>Recent invoices</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead class="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow>
              <TableCell class="font-medium">{invoice.id}</TableCell>
              <TableCell>{invoice.status}</TableCell>
              <TableCell class="text-right">{invoice.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  )
}
