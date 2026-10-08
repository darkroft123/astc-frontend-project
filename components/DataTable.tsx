"use client";
import { ReactNode } from "react";

export type Column<T = any> = {
  key: string;
  header: string;
  render: (row: T, index: number) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
};

interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyText?: string;
  maxHeight?: string;
  compact?: boolean;
}

export function DataTable<T = any>({
  data,
  columns,
  loading = false,
  emptyText = "Sin datos",
  maxHeight = "520px",
  compact = false,
}: DataTableProps<T>) {
  return (
    <div className="w-full border border-border rounded-2xl bg-card shadow-sm overflow-x-auto">
      <div className="overflow-y-auto" style={{ maxHeight }}>

        <table className="w-full text-sm min-w-[500px]">

          <thead className="sticky top-0 bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] text-white z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left text-xs uppercase tracking-widest font-extrabold ${
                    compact ? "px-3 py-3" : "px-5 py-4"
                  } border-b border-blue-900/40 text-white ${col.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {loading ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="text-center py-12 text-blue-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin" />
                    Cargando datos...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="text-center py-16 text-muted-foreground"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={(row as any)?.id ?? i}
                  className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-150 group"
                >
                  {columns.map((col) => (
                    <td
                      key={`${col.key}-${i}`}
                      className={`${
                        compact ? "px-3 py-2.5" : "px-5 py-3.5"
                      } text-foreground group-hover:text-foreground transition ${col.className ?? ""} ${col.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                    >
                      {col.render(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}
