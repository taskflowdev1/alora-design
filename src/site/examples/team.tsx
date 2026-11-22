import * as React from "react";
import { UserPlus } from "react-feather";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Pill, Status } from "@/components/ui/status";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/toolbar";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { Loading, LoadingText, Skeleton } from "@/components/ui/skeleton";
import { Timeline } from "@/components/ui/timeline";
import { TEAM_ACTIVITY, TEAM_DETAIL } from "../data";
import { PrimaryAction, useLoading } from "./shared";

/* ------------------------------------------------------------ team */

export function Team() {
  const loading = useLoading();
  const [roles, setRoles] = React.useState(Object.fromEntries(TEAM_DETAIL.map((t) => [t.email, t.role])));
  const [inviting, setInviting] = React.useState(false);
  const [inviteRole, setInviteRole] = React.useState("Cashier");
  const L = ({ children }: { children: React.ReactNode }) => <LoadingText loading={loading}>{children}</LoadingText>;
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader title="Team">
        <PrimaryAction icon={UserPlus} label="Invite" onClick={() => setInviting(true)} />
      </PageHeader>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card inset="nest" className="grid gap-px">
          {TEAM_DETAIL.map((t) => (
            // No hover fill: the row itself does nothing (its role select is the control).
            <div key={t.email} className="flex min-h-[calc(var(--ad-row-h)+16px)] items-center gap-3 rounded-item px-2.5 py-1.5">
              {loading ? <Skeleton className="size-8 rounded-full" /> : <Avatar name={t.name} />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium">
                  <L>{t.name}</L>
                </p>
                <p className="truncate text-small text-ink-muted">
                  <L>{t.email}</L>
                </p>
              </div>
              <span className="w-28 truncate text-body text-ink-muted max-md:hidden">
                <L>{t.shops}</L>
              </span>
              <span className="w-28 max-md:hidden">
                <Loading loading={loading}>
                  {t.active === "Online" ? <Status>Online</Status> : t.active === "Invited" ? <Pill tone="neutral">Invited</Pill> : <span className="text-body text-ink-muted">{t.active}</span>}
                </Loading>
              </span>
              {/* One width for every role, so the shop and last-active columns line up row to row. */}
              <Loading loading={loading} className="w-28">
                <Select
                  aria-label={`${t.name} role`}
                  align="end"
                  value={roles[t.email]}
                  onValueChange={(v) => {
                    setRoles({ ...roles, [t.email]: v });
                    toast(`${t.name.split(" ")[0]} is now ${v}`);
                  }}
                  options={["Owner", "Admin", "Cashier", "Stock"].map((r) => ({ value: r, label: r }))}
                  className="w-28"
                />
              </Loading>
            </div>
          ))}
        </Card>
        <Card inset="nest">
          <CardHeader title="Activity" className="px-2 pt-2" />
          <Timeline
            events={TEAM_ACTIVITY.map((a) => ({
              id: a.id,
              time: a.time,
              // Two lines before it cuts, so "changed the courier for Dago to SiCepat" reads whole in the 380 px card.
              title: (
                <span className="line-clamp-2 whitespace-normal">
                  <L>
                    <span className="font-medium">{a.who.split(" ")[0]}</span> {a.what}
                  </L>
                </span>
              ),
            }))}
          />
        </Card>
      </div>
      <Dialog
        open={inviting}
        onOpenChange={setInviting}
        title="Invite to Rimba"
        footer={
          <>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="primary" onClick={() => toast(`Invite sent, as ${inviteRole}`)}>
                Send invite
              </Button>
            </DialogClose>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Email">
            <Input aria-label="Email" placeholder="name@rimba.example" type="email" />
          </Field>
          <Field label="Role">
            <Select aria-label="Role" value={inviteRole} onValueChange={setInviteRole} options={["Admin", "Cashier", "Stock"].map((r) => ({ value: r, label: r }))} />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}
