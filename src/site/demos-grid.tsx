import * as React from "react";
import { formatRp } from "@/lib/ad";
import { Card } from "@/components/ui/card";
import { ColumnMenu } from "@/components/ui/column-menu";
import { TableBar } from "@/components/ui/table";
import { DataGrid, type GridColumn, type GridTone } from "@/components/ui/data-grid";
import type { Demo } from "./demos";

// A payroll register: the case the plain Table can't carry (many money columns, names pinned, totals).
interface PayRow {
  id: string;
  name: string;
  dept: string;
  days: number;
  base: number;
  overtime: number;
  allowance: number;
  bpjs: number;
  tax: number;
  net: number;
  last: number;
  byHand: boolean;
}

const NAMES = [
  "Ayu Lestari", "Bagus Pratama", "Citra Wulandari", "Dimas Saputra", "Eka Putri", "Fajar Nugroho", "Gita Maharani",
  "Hendra Wijaya", "Indah Permata", "Joko Susilo", "Kartika Sari", "Lukman Hakim", "Maya Anggraini", "Nanda Prasetyo",
  "Oki Ramadhan", "Putri Ayuningtyas", "Rendy Kurniawan", "Sari Rahmawati", "Teguh Santoso", "Wulan Fitriani",
];
const DEPTS = ["Security", "Nursing", "Finance", "Front desk", "Technician"];

const ROWS: PayRow[] = NAMES.map((name, i) => {
  const base = 4_200_000 + ((i * 37) % 9) * 250_000;
  const overtime = i % 3 === 0 ? 0 : ((i * 53) % 7) * 95_000;
  const allowance = 300_000 + (i % 4) * 75_000;
  const bpjs = Math.round(base * 0.04);
  const tax = Math.round((base + overtime + allowance) * 0.025);
  const net = base + overtime + allowance - bpjs - tax;
  const last = i % 5 === 1 ? net + 180_000 : i % 4 === 2 ? net - 260_000 : net;
  return { id: `E${String(101 + i)}`, name, dept: DEPTS[i % DEPTS.length], days: 26 - (i % 4 === 3 ? 2 : 0), base, overtime, allowance, bpjs, tax, net, last, byHand: i % 6 === 4 };
});

const sum = (rows: PayRow[], f: (r: PayRow) => number) => formatRp(rows.reduce((s, r) => s + f(r), 0));
const diff = (r: PayRow) => r.net - r.last;

const COLUMNS: GridColumn<PayRow>[] = [
  { key: "name", label: "Employee", width: 168, pin: true },
  { key: "dept", label: "Department", width: 120, pin: true },
  { key: "days", label: "Days", width: 72, align: "right", total: (rows) => rows.reduce((s, r) => s + r.days, 0) },
  { key: "base", label: "Base salary", width: 136, align: "right", render: (r) => formatRp(r.base), total: (rows) => sum(rows, (r) => r.base) },
  { key: "overtime", label: "Overtime", width: 120, align: "right", render: (r) => (r.overtime ? formatRp(r.overtime) : "—"), total: (rows) => sum(rows, (r) => r.overtime) },
  { key: "allowance", label: "Allowance", width: 120, align: "right", render: (r) => formatRp(r.allowance), tone: (r) => (r.byHand ? "brand" : undefined), total: (rows) => sum(rows, (r) => r.allowance) },
  { key: "bpjs", label: "BPJS", width: 120, align: "right", render: (r) => formatRp(r.bpjs), total: (rows) => sum(rows, (r) => r.bpjs) },
  { key: "tax", label: "Tax (PPh 21)", width: 128, align: "right", render: (r) => formatRp(r.tax), total: (rows) => sum(rows, (r) => r.tax) },
  { key: "net", label: "Net pay", width: 140, align: "right", render: (r) => formatRp(r.net), total: (rows) => sum(rows, (r) => r.net) },
  {
    key: "diff",
    label: "vs last month",
    width: 136,
    align: "right",
    render: (r) => (diff(r) ? `${diff(r) > 0 ? "+" : "−"}${formatRp(Math.abs(diff(r)))}` : "—"),
    tone: (r) => (diff(r) > 0 ? "success" : diff(r) < 0 ? "danger" : undefined),
  },
];

const OPTIONAL = COLUMNS.filter((c) => !c.pin).map((c) => c.key);

/** Shared with the Components page tile. */
export const REGISTER = {
  columns: COLUMNS,
  rows: ROWS,
  legend: [
    { tone: "brand", label: "Typed by hand" },
    { tone: "success", label: "Higher than last month" },
    { tone: "danger", label: "Lower than last month" },
  ] satisfies { tone: GridTone; label: string }[],
};

function RegisterDemo({ pins, totals, legend }: { pins: number; totals: boolean; legend: boolean }) {
  const [visible, setVisible] = React.useState(OPTIONAL);
  const [sel, setSel] = React.useState<string>(ROWS[2].id);
  const [page, setPage] = React.useState(1);
  const columns = COLUMNS.map((c, i) => ({
    ...c,
    pin: i < pins,
    total: totals ? c.total : undefined,
  }));
  return (
    <Card inset="nest" className="w-full min-w-0 max-w-[760px]">
      <div className="mb-2 flex items-center justify-end">
        <ColumnMenu
          columns={COLUMNS.map((c) => ({ key: c.key, label: c.label, locked: c.pin }))}
          visible={visible}
          onVisibleChange={setVisible}
          defaults={OPTIONAL}
        />
      </div>
      <DataGrid
        columns={columns}
        rows={ROWS}
        rowKey={(r) => r.id}
        visible={visible}
        selectedKey={sel}
        onRowActivate={(r) => setSel(r.id)}
        legend={legend ? REGISTER.legend : undefined}
        maxHeight={340}
      />
      <TableBar page={page} total={ROWS.length} onPageChange={setPage} className="mt-1" />
    </Card>
  );
}

export const GRID_DEMOS: Record<string, Demo> = {
  "data-grid": {
    stage: "page",
    controls: [
      { key: "pins", type: "select", label: "Pinned columns", options: ["0", "1", "2"], default: "2" },
      { key: "totals", type: "toggle", label: "Totals row", default: true },
      { key: "legend", type: "toggle", label: "Legend", default: true },
    ],
    render: (p) => <RegisterDemo pins={Number(p.pins)} totals={!!p.totals} legend={!!p.legend} />,
    usage: (p) =>
      `<Card inset="nest">\n  <DataGrid\n    columns={[\n      { key: "name", label: "Employee", width: 168, pin: true },\n      { key: "net", label: "Net pay", align: "right", render: (r) => formatRp(r.net),\n        total: (rows) => formatRp(sumOf(rows, "net")) },\n      { key: "diff", label: "vs last month", align: "right",\n        tone: (r) => (r.diff > 0 ? "success" : r.diff < 0 ? "danger" : undefined) },\n    ]}\n    rows={rows}\n    rowKey={(r) => r.id}\n    visible={cols}          // from <ColumnMenu>\n    onRowActivate={(r) => openPane(r.id)}\n    legend={[{ tone: "success", label: "Higher than last month" }]}${p.totals ? "" : "\n    // totals row: add total() to a column"}\n    maxHeight="calc(100dvh - 240px)"\n  />\n  <TableBar page={page} total={rows.length} onPageChange={setPage} />\n</Card>`,
  },
};
