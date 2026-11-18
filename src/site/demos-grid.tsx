import * as React from "react";
import { formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ColumnMenu } from "@/components/ui/column-menu";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { TableBar } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { DataGrid, GridDetail, GridFigureDialog, type GridColumn, type GridFigure, type GridTone } from "@/components/ui/data-grid";
import type { Demo } from "./demos";

// A payroll register: the case the plain Table can't carry (many money columns, names pinned, totals),
// with register detail: the (i) on a figure opens that cell's dialog; a row click opens the row's pane.

interface Change {
  when: string;
  who: string;
  before: number;
  after: number;
  reason?: string;
}

interface PayInput {
  id: string;
  name: string;
  dept: string;
  scheduled: number;
  days: number;
  base: number;
  hours: number;
  allowance: number;
  last: number;
  byHand: boolean;
  changes: Change[];
}

interface PayRow extends PayInput {
  hourly: number;
  overtime: number;
  bpjs: number;
  gross: number;
  tax: number;
  net: number;
}

const NAMES = [
  "Ayu Lestari", "Bagus Pratama", "Citra Wulandari", "Dimas Saputra", "Eka Putri", "Fajar Nugroho", "Gita Maharani",
  "Hendra Wijaya", "Indah Permata", "Joko Susilo", "Kartika Sari", "Lukman Hakim", "Maya Anggraini", "Nanda Prasetyo",
  "Oki Ramadhan", "Putri Ayuningtyas", "Rendy Kurniawan", "Sari Rahmawati", "Teguh Santoso", "Wulan Fitriani",
];
const DEPTS = ["Security", "Nursing", "Finance", "Front desk", "Technician"];
const DEPT_ALLOWANCE: Record<string, number> = { Security: 300_000, Nursing: 375_000, Finance: 450_000, "Front desk": 300_000, Technician: 525_000 };

/** Every derived figure from its inputs, so a change in the pane updates the whole row. */
function calc(p: PayInput): PayRow {
  const hourly = Math.round(p.base / 173);
  const overtime = Math.round(p.hours * hourly * 1.5);
  const bpjs = Math.round(p.base * 0.04);
  const gross = p.base + overtime + p.allowance;
  const tax = Math.round(gross * 0.025);
  return { ...p, hourly, overtime, bpjs, gross, tax, net: gross - bpjs - tax };
}

const INPUTS: PayInput[] = NAMES.map((name, i) => {
  const dept = DEPTS[i % DEPTS.length];
  const byHand = i % 6 === 4;
  const allowance = DEPT_ALLOWANCE[dept] + (byHand ? 75_000 : 0);
  const p: PayInput = {
    id: `E${101 + i}`,
    name,
    dept,
    scheduled: 26,
    days: 26 - (i % 4 === 3 ? 2 : 0),
    base: 4_200_000 + ((i * 37) % 9) * 250_000,
    hours: i % 3 === 0 ? 0 : ((i * 53) % 7) * 2,
    allowance,
    last: 0,
    byHand,
    changes: byHand ? [{ when: "Today, 10:12", who: "Dewi A.", before: DEPT_ALLOWANCE[dept], after: allowance, reason: "Night shifts this month" }] : [],
  };
  const net = calc(p).net;
  p.last = i % 5 === 1 ? net + 180_000 : i % 4 === 2 ? net - 260_000 : net;
  return p;
});
const ROWS = INPUTS.map(calc);

const sum = (rows: PayRow[], f: (r: PayRow) => number) => formatRp(rows.reduce((s, r) => s + f(r), 0));
const diff = (r: PayRow) => r.net - r.last;
const signed = (n: number) => (n ? `${n > 0 ? "+" : "−"}${formatRp(Math.abs(n))}` : "—");
const diffTone = (r: PayRow): GridTone | undefined => (diff(r) > 0 ? "success" : diff(r) < 0 ? "danger" : undefined);

const COLUMNS: GridColumn<PayRow>[] = [
  { key: "name", label: "Employee", width: 168, pin: true },
  { key: "dept", label: "Department", width: 120 },
  { key: "days", label: "Days", width: 84, align: "right", explain: true, total: (rows) => rows.reduce((s, r) => s + r.days, 0) },
  { key: "base", label: "Base salary", width: 148, align: "right", explain: true, render: (r) => formatRp(r.base), total: (rows) => sum(rows, (r) => r.base) },
  { key: "overtime", label: "Overtime", width: 132, align: "right", explain: (r) => r.overtime > 0, render: (r) => (r.overtime ? formatRp(r.overtime) : "—"), total: (rows) => sum(rows, (r) => r.overtime) },
  { key: "allowance", label: "Allowance", width: 140, align: "right", explain: true, render: (r) => formatRp(r.allowance), tone: (r) => (r.byHand ? "brand" : undefined), total: (rows) => sum(rows, (r) => r.allowance) },
  { key: "bpjs", label: "BPJS", width: 132, align: "right", explain: true, render: (r) => formatRp(r.bpjs), total: (rows) => sum(rows, (r) => r.bpjs) },
  { key: "tax", label: "Tax (PPh 21)", width: 140, align: "right", explain: true, render: (r) => formatRp(r.tax), total: (rows) => sum(rows, (r) => r.tax) },
  { key: "net", label: "Net pay", width: 152, align: "right", explain: true, render: (r) => formatRp(r.net), total: (rows) => sum(rows, (r) => r.net) },
  { key: "diff", label: "vs last month", width: 148, align: "right", explain: (r) => diff(r) !== 0, render: (r) => signed(diff(r)), tone: diffTone },
];

const OPTIONAL = COLUMNS.filter((c) => !c.pin).map((c) => c.key);
const LEGEND = [
  { tone: "brand", label: "Typed by hand" },
  { tone: "success", label: "Higher than last month" },
  { tone: "danger", label: "Lower than last month" },
] satisfies { tone: GridTone; label: string }[];

/** Shared with the Components page tile. */
export const REGISTER = { columns: COLUMNS, rows: ROWS, legend: LEGEND };

/** Change a typed-by-hand amount, with a reason, from inside the pane. */
function AmountChange({ current, onSave }: { current: number; onSave: (amount: number, reason: string) => void }) {
  const [amount, setAmount] = React.useState<number | null>(current);
  const [reason, setReason] = React.useState("");
  const changed = amount != null && amount !== current;
  return (
    <>
      <CurrencyInput value={amount} onValueChange={setAmount} aria-label="New amount" />
      <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" aria-label="Reason" />
      <Button variant="primary" disabled={!changed || !reason.trim()} onClick={() => amount != null && onSave(amount, reason.trim())}>
        Save
      </Button>
    </>
  );
}

function figuresOf(r: PayRow, save: (id: string, amount: number, reason: string) => void): GridFigure[] {
  const history = (rows: Change[]) => rows.map((c) => ({ when: c.when, who: c.who, before: formatRp(c.before), after: formatRp(c.after), reason: c.reason }));
  return [
    {
      key: "days",
      label: "Days",
      value: r.days,
      source: "Attendance",
      formula: "Days with both a clock-in and a clock-out",
      inputs: [
        { label: "Scheduled", value: r.scheduled },
        { label: "Not worked", value: r.scheduled - r.days },
      ],
    },
    { key: "base", label: "Base salary", value: formatRp(r.base), source: "Employee record", note: "From the contract; changes on the employee's page" },
    {
      key: "overtime",
      label: "Overtime",
      value: r.overtime ? formatRp(r.overtime) : "—",
      source: "Calculated",
      formula: "Overtime hours × hourly rate × 1.5",
      inputs: [
        { label: "Overtime hours (approved SPL)", value: r.hours },
        { label: "Hourly rate (base ÷ 173)", value: formatRp(r.hourly) },
      ],
    },
    {
      key: "allowance",
      label: "Allowance",
      value: formatRp(r.allowance),
      tone: r.byHand ? "brand" : undefined,
      source: r.byHand ? "Typed by hand" : `${r.dept} rule`,
      formula: r.byHand ? undefined : `Fixed monthly allowance for ${r.dept}`,
      history: history(r.changes),
      action: <AmountChange key={`${r.id}:${r.allowance}`} current={r.allowance} onSave={(a, why) => save(r.id, a, why)} />,
    },
    { key: "bpjs", label: "BPJS", value: formatRp(r.bpjs), source: "Calculated", formula: "4% of base salary", inputs: [{ label: "Base salary", value: formatRp(r.base) }] },
    {
      key: "tax",
      label: "Tax (PPh 21)",
      value: formatRp(r.tax),
      source: "Calculated",
      formula: "2.5% of gross pay",
      inputs: [{ label: "Gross pay (base + overtime + allowance)", value: formatRp(r.gross) }],
    },
    {
      key: "net",
      label: "Net pay",
      value: formatRp(r.net),
      source: "Calculated",
      formula: "Base + overtime + allowance − BPJS − tax",
      inputs: [
        { label: "Base salary", value: formatRp(r.base) },
        { label: "Overtime", value: formatRp(r.overtime) },
        { label: "Allowance", value: formatRp(r.allowance) },
        { label: "BPJS", value: `−${formatRp(r.bpjs)}` },
        { label: "Tax", value: `−${formatRp(r.tax)}` },
      ],
    },
    {
      key: "diff",
      label: "vs last month",
      value: signed(diff(r)),
      tone: diffTone(r),
      formula: "Net pay this month − net pay last month",
      inputs: [
        { label: "This month", value: formatRp(r.net) },
        { label: "Last month", value: formatRp(r.last) },
      ],
    },
  ];
}

function RegisterDemo({ pins, totals, legend }: { pins: number; totals: boolean; legend: boolean }) {
  const [inputs, setInputs] = React.useState(INPUTS);
  const rows = React.useMemo(() => inputs.map(calc), [inputs]);
  const [visible, setVisible] = React.useState(OPTIONAL);
  const [pane, setPane] = React.useState<{ id: string; figure: string | null } | null>(null);
  const [cell, setCell] = React.useState<{ id: string; key: string } | null>(null);
  const [page, setPage] = React.useState(1);
  const columns = COLUMNS.map((c, i) => ({ ...c, pin: i < pins, total: totals ? c.total : undefined }));
  const open = rows.find((r) => r.id === pane?.id) ?? null;
  const save = (id: string, amount: number, reason: string) => {
    setInputs((all) =>
      all.map((p) =>
        p.id === id ? { ...p, allowance: amount, byHand: true, changes: [{ when: "Just now", who: "You", before: p.allowance, after: amount, reason }, ...p.changes] } : p,
      ),
    );
    toast("Allowance saved");
  };
  const cellRow = rows.find((r) => r.id === cell?.id);
  // Read from the current rows, so a change saved in the dialog shows in it straight away.
  const cellFigure = cellRow && cell ? (figuresOf(cellRow, save).find((f) => f.key === cell.key) ?? null) : null;

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
        rows={rows}
        rowKey={(r) => r.id}
        visible={visible}
        selectedKey={pane?.id}
        onRowActivate={(r) => setPane({ id: r.id, figure: null })}
        onCellDetail={(r, key) => setCell({ id: r.id, key })}
        legend={legend ? LEGEND : undefined}
        maxHeight={340}
      />
      <TableBar page={page} total={rows.length} onPageChange={setPage} className="mt-1" />
      <Sheet open={!!open} onOpenChange={(o) => !o && setPane(null)} title={open?.name ?? ""}>
        {open ? (
          <div className="grid gap-3">
            <span className="px-3 text-body text-ink-muted">
              {open.id} · {open.dept} · November 2026
            </span>
            <GridDetail figures={figuresOf(open, save)} open={pane?.figure ?? null} onOpenChange={(figure) => setPane({ id: open.id, figure })} />
          </div>
        ) : null}
      </Sheet>
      <GridFigureDialog open={!!cellFigure} onOpenChange={(o) => !o && setCell(null)} figure={cellFigure} />
    </Card>
  );
}

export const GRID_DEMOS: Record<string, Demo> = {
  "data-grid": {
    stage: "page",
    controls: [
      { key: "pins", type: "select", label: "Pinned columns", options: ["0", "1", "2"], default: "1" },
      { key: "totals", type: "toggle", label: "Totals row", default: true },
      { key: "legend", type: "toggle", label: "Legend", default: true },
    ],
    render: (p) => <RegisterDemo pins={Number(p.pins)} totals={!!p.totals} legend={!!p.legend} />,
    usage: (p) =>
      `<Card inset="nest">\n  <DataGrid\n    columns={[\n      { key: "name", label: "Employee", width: 168, pin: true },\n      { key: "net", label: "Net pay", align: "right", render: (r) => formatRp(r.net),\n        explain: true, total: (rows) => formatRp(sumOf(rows, "net")) },\n      { key: "diff", label: "vs last month", align: "right",\n        tone: (r) => (r.diff > 0 ? "success" : r.diff < 0 ? "danger" : undefined) },\n    ]}\n    rows={rows}\n    rowKey={(r) => r.id}\n    visible={cols}                                          // from <ColumnMenu>\n    onRowActivate={(r) => setPane({ id: r.id, figure: null })}\n    onCellDetail={(r, key) => setCell({ id: r.id, key })}          // the (i)\n    legend={[{ tone: "success", label: "Higher than last month" }]}${p.totals ? "" : "\n    // totals row: add total() to a column"}\n  />\n</Card>\n\n<Sheet open={!!pane} onOpenChange={() => setPane(null)} title={row.name}>\n  <GridDetail open={pane.figure} onOpenChange={(figure) => setPane({ ...pane, figure })}\n    figures={[{ key: "net", label: "Net pay", value: formatRp(row.net),\n      source: "Calculated", formula: "Base + overtime + allowance − BPJS − tax",\n      inputs: [{ label: "Base salary", value: formatRp(row.base) }],\n      history: [{ when: "Today, 10:12", who: "Dewi A.", before: "Rp 300.000", after: "Rp 375.000" }],\n      action: <Button>Change</Button> }]} />\n</Sheet>

<GridFigureDialog open={!!figure} onOpenChange={() => setCell(null)} figure={figure} />  // one cell`,
  },
};
