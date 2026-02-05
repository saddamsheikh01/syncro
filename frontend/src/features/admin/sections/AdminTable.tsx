import type { HTMLAttributes, ReactNode } from "react";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

export type AdminTableAlign = "left" | "center" | "right";

export interface AdminTableColumn {
  key: string;
  label: string;
  align?: AdminTableAlign;
  width?: string;
}

export interface AdminTableRow {
  id: string;
  [key: string]: ReactNode;
}

const ALIGN_CLASSES: Record<AdminTableAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export interface AdminTableProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  columns: AdminTableColumn[];
  rows: AdminTableRow[];
  emptyLabel?: string;
}

export const AdminTable = ({
  className,
  columns,
  rows,
  emptyLabel = "No data available",
  ...props
}: AdminTableProps) => (
  <Card className={cx("overflow-hidden", className)} {...props}>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-surface-muted text-xs uppercase tracking-wide text-subtle">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cx("px-4 py-3 font-semibold", ALIGN_CLASSES[column.align ?? "left"])}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.id} className="bg-card">
                {columns.map((column) => (
                  <td
                    key={`${row.id}-${column.key}`}
                    className={cx("px-4 py-3", ALIGN_CLASSES[column.align ?? "left"])}
                  >
                    {row[column.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-subtle">
                {emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </Card>
);
