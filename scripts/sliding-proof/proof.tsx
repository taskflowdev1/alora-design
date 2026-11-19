// Playable proof for the sliding pill: the same pickers built from one version of the library (before or after,
// chosen by ./variant). Built twice by scripts/review-sliding-v1-shots and inlined into output/sliding-v1/sliding.html.
import * as React from "react";
import { createRoot } from "react-dom/client";
import { Home, Package, ShoppingBag, Users } from "react-feather";
import "./proof.css";
import { applyTokens, TokenScope } from "@/site/config";
import { DEFAULTS, type Config } from "@/lib/config";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { Sidebar, SidebarItem, SidebarSection } from "@/components/ui/sidebar";
import { Format, Stock, View } from "./variant";

const dark: Config = { ...DEFAULTS, theme: "dark" };
const light: Config = { ...DEFAULTS, theme: "light" };
applyTokens(document.documentElement, dark);

function Row({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div data-row={name} className="grid min-w-0 gap-1.5">
      <span className="text-body text-ink-muted">{name}</span>
      <div className="flex min-w-0 flex-wrap items-center gap-gap">{children}</div>
    </div>
  );
}

function Pickers() {
  const [range, setRange] = React.useState("week");
  const [fmt, setFmt] = React.useState("xlsx");
  const [stock, setStock] = React.useState("all");
  const [view, setView] = React.useState("list");
  const [page, setPage] = React.useState(3);
  const [nav, setNav] = React.useState("Orders");
  const [rtl, setRtl] = React.useState("week");
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
      <Card inset="pad" className="grid content-start gap-5">
        <Row name="Range">
          <Segmented aria-label="Range" value={range} onValueChange={setRange} options={[{ value: "day", label: "Today" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }]} />
        </Row>
        <Row name="Statement">
          <Format value={fmt} onValueChange={setFmt} />
        </Row>
        <Row name="Stock">
          <Stock value={stock} onValueChange={setStock} />
        </Row>
        <Row name="View">
          <View value={view} onValueChange={setView} />
        </Row>
        <Row name="Tabs">
          <Tabs defaultValue="pack">
            <TabsList>
              <TabsTrigger value="pack">To pack</TabsTrigger>
              <TabsTrigger value="ship">To ship</TabsTrigger>
              <TabsTrigger value="returns">Returns</TabsTrigger>
            </TabsList>
          </Tabs>
        </Row>
        <Row name="Pages">
          <Pagination page={page} pageCount={12} onPageChange={setPage} total={580} pageSize={50} className="w-full" />
        </Row>
        <Row name="Right to left">
          <div dir="rtl">
            <Segmented aria-label="Range, right to left" value={rtl} onValueChange={setRtl} options={[{ value: "day", label: "اليوم" }, { value: "week", label: "الأسبوع" }, { value: "month", label: "الشهر" }]} />
          </div>
        </Row>
      </Card>
      <Sidebar className="h-fit">
        <SidebarSection>
          {(
            [
              ["Dashboard", Home],
              ["Orders", ShoppingBag],
              ["Products", Package],
              ["Team", Users],
            ] as const
          ).map(([l, I]) => (
            <SidebarItem key={l} icon={I} active={nav === l} onClick={() => setNav(l)}>
              {l}
            </SidebarItem>
          ))}
        </SidebarSection>
      </Sidebar>
    </div>
  );
}

function Section({ config }: { config: Config }) {
  return (
    <TokenScope config={config} data-theme-section={config.theme} className="grid gap-4 rounded-sheet bg-page p-4 text-ink sm:p-6">
      <h2 className="text-title font-semibold">{config.theme === "dark" ? "Dark" : "Light"}</h2>
      <Pickers />
    </TokenScope>
  );
}

createRoot(document.getElementById("root")!).render(
  <main className="mx-auto grid max-w-[880px] gap-6 px-4 py-6">
    <Section config={dark} />
    <Section config={light} />
  </main>,
);
