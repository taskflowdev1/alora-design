import * as React from "react";
import { useBlocker } from "react-router";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Status } from "@/components/ui/status";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/toolbar";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LanguagePicker } from "@/components/ui/language-picker";
import { SaveBar } from "@/components/ui/save-bar";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { Loading } from "@/components/ui/skeleton";
import { TEAM } from "../data";
import { useLoading } from "./shared";

type Form = {
  name: string;
  legal: string;
  tz: string;
  lang: string;
  money: string;
  round: boolean;
  receipts: boolean;
  reason: boolean;
  sync: string;
};

const INITIAL: Form = {
  name: "Rimba",
  legal: "PT Rimba Rumah Nusantara",
  tz: "wib",
  lang: "en",
  money: "full",
  round: true,
  receipts: false,
  reason: true,
  sync: "5",
};

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2">
      <h2 className="px-1 text-title font-semibold">{title}</h2>
      <Card inset="nest" className="grid gap-px">
        {children}
      </Card>
    </section>
  );
}

/** While the settings load, every row's value pulses in place (the labels are the page's own copy, not data). */
const SettingsLoading = React.createContext(false);

/**
 * A settings row. `onClick`: the whole row is one button. `toggle`: the row is the switch's label, so a click anywhere
 * flips it while the switch stays the one Tab stop (no button inside a button).
 */
function Row({ label, children, onClick, toggle }: { label: React.ReactNode; children: React.ReactNode; onClick?: () => void; toggle?: boolean }) {
  const loading = React.useContext(SettingsLoading);
  const Comp = onClick ? "button" : toggle ? "label" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex min-h-[calc(var(--ad-row-h)+8px)] w-full items-center justify-between gap-4 rounded-item px-2.5 py-1 text-left text-body",
        onClick && "cursor-pointer transition-colors duration-[150ms] ease-ad hover:bg-fill focus-visible:bg-fill",
        toggle && "cursor-pointer transition-colors duration-[150ms] ease-ad hover:bg-fill has-[:focus-visible]:bg-fill",
      )}
    >
      <span className="min-w-0 truncate text-ink">{label}</span>
      <span className="flex shrink-0 items-center gap-2">
        <Loading loading={loading}>{children}</Loading>
      </span>
    </Comp>
  );
}

export function Settings() {
  const loading = useLoading();
  const [saved, setSaved] = React.useState(INITIAL);
  const [form, setForm] = React.useState(INITIAL);
  const [team, setTeam] = React.useState(TEAM);
  const [member, setMember] = React.useState<(typeof TEAM)[number] | null>(null);
  const [role, setRole] = React.useState("Admin");
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  React.useEffect(() => {
    if (!dirty) return;
    const ask = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", ask);
    return () => window.removeEventListener("beforeunload", ask);
  }, [dirty]);

  return (
    <SettingsLoading.Provider value={loading}>
      <div className="grid max-w-[720px] gap-6 pb-4">
        <PageHeader title="Settings" />
        <Group title="Shop">
          <Row label="Shop name">
            <Input aria-label="Shop name" value={form.name} onChange={(e) => set("name", e.target.value)} wrapperClassName="w-60 max-sm:w-40" />
          </Row>
          <Row label="Legal name">
            <Input aria-label="Legal name" value={form.legal} onChange={(e) => set("legal", e.target.value)} wrapperClassName="w-60 max-sm:w-40" />
          </Row>
          <Row label="Time zone">
            <Select
              aria-label="Time zone"
              value={form.tz}
              onValueChange={(v) => set("tz", v)}
              options={[
                { value: "wib", label: "Jakarta, WIB" },
                { value: "wita", label: "Makassar, WITA" },
                { value: "wit", label: "Jayapura, WIT" },
              ]}
            />
          </Row>
          <Row label="Language">
            <LanguagePicker value={form.lang} onValueChange={(v) => set("lang", v)} />
          </Row>
          <Row label="Money">
            <Select
              aria-label="Money format"
              value={form.money}
              onValueChange={(v) => set("money", v)}
              options={[
                { value: "full", label: "Rp 12.400.000" },
                { value: "short", label: "Rp 12,4 jt" },
              ]}
            />
          </Row>
        </Group>
        <Group title="Checkout">
          {(
            [
              ["round", "Round cash totals to Rp 100"],
              ["receipts", "Print receipts"],
              ["reason", "Ask why a sale is cancelled"],
            ] as const
          ).map(([k, label]) => (
            <Row key={k} label={label} toggle>
              <Switch checked={form[k]} onCheckedChange={(v) => set(k, v)} aria-label={label} />
            </Row>
          ))}
        </Group>
        <Group title="Marketplaces">
          <Row label="Shopee" onClick={() => toast("Shopee is connected", "neutral")}>
            <Status>Connected</Status>
          </Row>
          <Row label="TikTok Shop" onClick={() => toast("TikTok Shop is connected", "neutral")}>
            <Status>Connected</Status>
          </Row>
          <Row label="Tokopedia" onClick={() => toast("Connect Tokopedia", "neutral")}>
            <Status tone="muted">Not connected</Status>
          </Row>
          <Row label="Sync stock every">
            <Select
              aria-label="Sync stock every"
              value={form.sync}
              onValueChange={(v) => set("sync", v)}
              options={[
                { value: "1", label: "1 minute" },
                { value: "5", label: "5 minutes" },
                { value: "15", label: "15 minutes" },
              ]}
            />
          </Row>
        </Group>
        <Group title="Team">
          {team.map((t) => (
            <Row
              key={t.email}
              onClick={() => (setMember(t), setRole(t.role))}
              label={
                <span className="flex items-center gap-3">
                  <Avatar name={t.name} size="sm" />
                  {t.name}
                </span>
              }
            >
              <span className="text-ink-muted">{t.role}</span>
            </Row>
          ))}
        </Group>
        <SaveBar
          open={dirty}
          onDiscard={() => setForm(saved)}
          onSave={() => {
            setSaved(form);
            toast("Changes saved");
          }}
        />
        <Dialog
          open={!!member}
          onOpenChange={(o) => !o && setMember(null)}
          title={member?.name}
          footer={
            <>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!member) return;
                    setTeam(team.map((t) => (t.email === member.email ? { ...t, role } : t)));
                    toast(`${member.name.split(" ")[0]} is now ${role}`);
                  }}
                >
                  Save role
                </Button>
              </DialogClose>
            </>
          }
        >
          <Field label="Role">
            <Select
              aria-label="Role"
              value={role}
              onValueChange={setRole}
              options={["Owner", "Admin", "Cashier", "Stock"].map((r) => ({ value: r, label: r }))}
            />
          </Field>
        </Dialog>
        <Dialog
          open={blocker.state === "blocked"}
          onOpenChange={(o) => !o && blocker.reset?.()}
          title="Leave without saving?"
          footer={
            <>
              <Button variant="ghost" onClick={() => blocker.proceed?.()}>
                Discard changes
              </Button>
              <Button variant="primary" onClick={() => blocker.reset?.()}>
                Keep editing
              </Button>
            </>
          }
        />
      </div>
    </SettingsLoading.Provider>
  );
}
