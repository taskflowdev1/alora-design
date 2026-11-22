import * as React from "react";
import { Download, Package, Plus } from "react-feather";
import { formatNumber } from "@/lib/ad";
import { useMediaQuery } from "@/lib/ad-hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Thumb } from "@/components/ui/thumb";
import { Pill, Status } from "@/components/ui/status";
import { Table, TBody, TD, TH, THead, TRow } from "@/components/ui/table";
import { FilterButton, FilterPick } from "@/components/ui/filter-button";
import { MenuItem } from "@/components/ui/menu";
import { MobileList, MobileListRow } from "@/components/mobile/mobile-list";
import { MobileSheet } from "@/components/mobile/mobile-sheet";
import { Sheet } from "@/components/ui/sheet";
import { MoreMenu, PageHeader, PageSearch } from "@/components/ui/toolbar";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { Loading, LoadingText } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineEdit, grouped } from "@/components/ui/inline-edit";
import { Sparkline } from "@/components/ui/sparkline";
import { CurrencyInput } from "@/components/ui/currency-input";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { TagInput } from "@/components/ui/tag-input";
import { Dropzone, type DropFile } from "@/components/ui/dropzone";
import { PRODUCTS, productPhoto } from "../data";
import { PrimaryAction, Rp, useLoading } from "./shared";

/* ------------------------------------------------------------ products */

type ProductRow = (typeof PRODUCTS)[number] & { sold: number[] };

const PRODUCT_ROWS: ProductRow[] = PRODUCTS.map((p, i) => ({
  ...p,
  sold: Array.from({ length: 12 }, (_, w) => Math.max(1, Math.round(8 + 6 * Math.sin((w + i) / 2) + ((i * 7 + w * 3) % 5)))),
}));

/** An inline-edit cell while loading: the same row height and right edge, the value's text as a pulsing bar. */
function SkeletonValue({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-item items-center justify-end tabular-nums">
      <LoadingText loading>{children}</LoadingText>
    </span>
  );
}

function stockStatus(n: number) {
  if (n === 0) return <Pill>Out of stock</Pill>;
  if (n < 5) return <Status tone="attention">Low</Status>;
  return <Status>In stock</Status>;
}

export function Products() {
  const loading = useLoading();
  const [rows, setRows] = React.useState(PRODUCT_ROWS);
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState({ name: "", price: null as number | null, stock: 10, tags: ["Handmade"] as string[] });
  const [files, setFiles] = React.useState<DropFile[]>([]);
  const phone = useMediaQuery("(max-width: 767.98px)");
  // A phone has no inline cells: a row opens a small sheet with the same two edits.
  const [editing, setEditing] = React.useState<string | null>(null);
  const [edit, setEdit] = React.useState({ price: null as number | null, stock: 0 });
  const edited = rows.find((r) => r.sku === editing);
  const list = rows.filter(
    (p) =>
      (filter === "all" || (filter === "low" && p.stock > 0 && p.stock < 5) || (filter === "out" && p.stock === 0)) &&
      (!q || `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase())),
  );
  const set = (sku: string, patch: Partial<ProductRow>) => setRows(rows.map((r) => (r.sku === sku ? { ...r, ...patch } : r)));
  const L = ({ children }: { children: React.ReactNode }) => <LoadingText loading={loading}>{children}</LoadingText>;
  return (
    <div className="grid grid-cols-1 gap-4">
      <PageHeader title="Products">
        <PageSearch value={q} onValueChange={setQ} placeholder="Name or SKU" />
        <FilterButton count={filter === "all" ? 0 : 1} onClear={() => setFilter("all")} done={`Show ${formatNumber(list.length)} products`}>
          <FilterPick
            label="Stock"
            value={filter}
            onValueChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "low", label: "Low stock" },
              { value: "out", label: "Out of stock" },
            ]}
          />
        </FilterButton>
        <MoreMenu>
          <MenuItem icon={Download} onSelect={() => toast("Export started", "neutral")}>Export</MenuItem>
        </MoreMenu>
        <PrimaryAction icon={Plus} label="Add product" onClick={() => setAdding(true)} />
      </PageHeader>
      <Card inset="nest">
        {list.length === 0 ? (
          <EmptyState icon={Package} title="No products match" className="py-16" />
        ) : phone ? (
          <MobileList className="px-0 [&>[role=list]]:bg-transparent [&>[role=list]]:p-0">
            {list.map((p) => (
              <MobileListRow
                key={p.sku}
                onClick={() => (setEditing(p.sku), setEdit({ price: p.price, stock: p.stock }))}
                media={<Loading loading={loading}><Thumb src={productPhoto(p.sku)} alt={p.name} size={36} /></Loading>}
                title={<L>{p.name}</L>}
                subtitle={<L><span translate="no">{p.sku}</span> · {p.stock} in stock</L>}
                value={
                  <span className="grid justify-items-end gap-0.5">
                    <span className="text-ink"><L><Rp>{formatNumber(p.price)}</Rp></L></span>
                    <Loading loading={loading}>{stockStatus(p.stock)}</Loading>
                  </span>
                }
              />
            ))}
          </MobileList>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Product</TH>
                {/* SKU yields first below xl, so the sales trend never sits past the table's edge at 1024. */}
                <TH className="max-xl:hidden">SKU</TH>
                <TH align="right">Price</TH>
                <TH align="right">Stock</TH>
                <TH>Status</TH>
                <TH>Last 12 weeks</TH>
              </tr>
            </THead>
            <TBody>
              {list.map((p) => (
                <TRow key={p.sku}>
                  <TD>
                    <span className="flex items-center gap-3">
                      <Loading loading={loading}>
                        <Thumb src={productPhoto(p.sku)} alt={p.name} size={28} />
                      </Loading>
                      <span className="max-w-[240px] truncate">
                        <L>{p.name}</L>
                      </span>
                    </span>
                  </TD>
                  <TD className="text-ink-muted max-xl:hidden">
                    <L>{p.sku}</L>
                  </TD>
                  <TD align="right" className="w-40">
                    {loading ? (
                      <SkeletonValue>
                        Rp<span className="ml-1.5">{formatNumber(p.price)}</span>
                      </SkeletonValue>
                    ) : (
                      <InlineEdit
                        align="right"
                        aria-label={`${p.name} price`}
                        inputMode="numeric"
                        value={String(p.price)}
                        prefix="Rp"
                        {...grouped}
                        validate={(v) => (/^\d+$/.test(v) ? null : "Numbers only")}
                        onSave={(v) => set(p.sku, { price: Number(v) })}
                      />
                    )}
                  </TD>
                  <TD align="right" className="w-28">
                    {loading ? (
                      <SkeletonValue>{p.stock}</SkeletonValue>
                    ) : (
                      <InlineEdit
                        align="right"
                        aria-label={`${p.name} stock`}
                        inputMode="numeric"
                        value={String(p.stock)}
                        validate={(v) => (/^\d+$/.test(v) ? null : "Numbers only")}
                        onSave={(v) => set(p.sku, { stock: Number(v) })}
                      />
                    )}
                  </TD>
                  <TD>
                    <Loading loading={loading}>{stockStatus(p.stock)}</Loading>
                  </TD>
                  <TD>
                    <Loading loading={loading}>
                      <Sparkline data={p.sold} aria-label={`${p.name}, sold per week`} width={88} height={22} />
                    </Loading>
                  </TD>
                </TRow>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
      <MobileSheet
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={edited?.name}
        footer={
          <Button
            variant="primary"
            onClick={() => {
              if (edited) set(edited.sku, { price: edit.price ?? edited.price, stock: edit.stock });
              setEditing(null);
              toast(`${edited?.name ?? "Product"} saved`);
            }}
          >
            Save
          </Button>
        }
      >
        <div className="grid gap-4 pb-1">
          <Field label="Price">
            <CurrencyInput aria-label="Price" value={edit.price} onValueChange={(price) => setEdit({ ...edit, price })} />
          </Field>
          <Field label="Stock">
            <QuantityStepper aria-label="Stock" value={edit.stock} onValueChange={(stock) => setEdit({ ...edit, stock })} max={999} />
          </Field>
        </div>
      </MobileSheet>
      <Sheet
        open={adding}
        onOpenChange={setAdding}
        title="New product"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAdding(false);
                toast(`${draft.name || "Product"} added`);
              }}
            >
              Add product
            </Button>
          </>
        }
      >
        <div className="grid gap-5">
          <Field label="Name">
            <Input aria-label="Name" value={draft.name} placeholder="Gelas kopi tanah liat" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <div className="flex flex-wrap items-end gap-4">
            <Field label="Price">
              <CurrencyInput aria-label="Price" value={draft.price} onValueChange={(price) => setDraft({ ...draft, price })} className="w-44" />
            </Field>
            <Field label="Stock">
              <QuantityStepper aria-label="Stock" value={draft.stock} onValueChange={(stock) => setDraft({ ...draft, stock })} max={999} />
            </Field>
          </div>
          <Field label="Tags">
            <TagInput value={draft.tags} onValueChange={(tags) => setDraft({ ...draft, tags })} suggestions={["Keramik", "Kayu jati", "Bambu", "Rotan", "Best seller"]} />
          </Field>
          <Field label="Photos">
            <Dropzone
              title="Drop product photos"
              accept="image/*"
              files={files}
              onRemove={(id) => setFiles(files.filter((f) => f.id !== id))}
              onFiles={(fs) => setFiles([...files, ...fs.map((f, i) => ({ id: `${f.name}-${i}`, name: f.name, size: f.size }))])}
            />
          </Field>
        </div>
      </Sheet>
    </div>
  );
}
