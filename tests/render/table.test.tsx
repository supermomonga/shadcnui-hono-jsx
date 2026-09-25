import { describe, expect, test } from "bun:test"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { query, render } from "../helpers/render"

describe("Table", () => {
  test("wraps the table in a scroll container and renders semantic parts", async () => {
    const html = await render(
      <Table>
        <TableCaption>Invoices</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colspan={2}>INV001</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    )
    const [container] = await query(html, "div")
    expect(container?.attributes["data-slot"]).toBe("table-container")
    expect(container?.classes).toContain("overflow-x-auto")
    const tags = (await query(html, "[data-slot]")).map((el) => [
      el.tag,
      el.attributes["data-slot"],
    ])
    expect(tags).toEqual([
      ["div", "table-container"],
      ["table", "table"],
      ["caption", "table-caption"],
      ["thead", "table-header"],
      ["tr", "table-row"],
      ["th", "table-head"],
      ["tbody", "table-body"],
      ["tr", "table-row"],
      ["td", "table-cell"],
      ["tfoot", "table-footer"],
      ["tr", "table-row"],
      ["td", "table-cell"],
    ])
    const [cell] = await query(html, "td[colspan]")
    expect(cell?.attributes.colspan).toBe("2")
  })
})
