// @ts-nocheck: a section of site/generated/create/checkbox-example.tsx, whose constants it uses.
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Example } from "./example"

function CheckboxInTable() {
  const selectedRows = new Set(["1"])

  const selectAll = selectedRows.size === tableData.length

  return (
    <Example title="In Table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-8">
              <Checkbox id="select-all" defaultChecked={selectAll} />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.map((row) => (
            // The row's highlight follows its native checkbox.
            <TableRow key={row.id} class="has-checked:bg-muted">
              <TableCell>
                <Checkbox
                  id={`row-${row.id}`}
                  defaultChecked={selectedRows.has(row.id)}
                />
              </TableCell>
              <TableCell class="font-medium">{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Example>
  )
}
