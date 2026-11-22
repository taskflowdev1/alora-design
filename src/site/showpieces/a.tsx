// Showpiece batch A: each component's page demo, its tile on the Components page (inside a Mark, exactly once)
// and its moment on the landing. Aggregated in ./index.ts.
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BalancePrivacyWave } from "@/components/ui/balance-privacy-wave";
import { CardWalletStack } from "@/components/ui/card-wallet-stack";
import { InstallmentSlicer } from "@/components/ui/installment-slicer";
import { QrPaymentTile } from "@/components/ui/qr-payment-tile";
import { SecureNumberReveal } from "@/components/ui/secure-number-reveal";
import { SlideToPay } from "@/components/ui/slide-to-pay";
import type { Demo } from "../demos";
import { Mark, S, Tile, type TileDef } from "../mark";
import type { ShowpieceMoment } from "./types";

/** The code with a quiet control outside it: a real payment arrives from your backend, here a button stands in. */
function QrDemo({ seconds = 90 }: { seconds?: number }) {
  const [paid, setPaid] = React.useState(false);
  return (
    <div className="grid w-full justify-items-center gap-4">
      <Card className="w-full max-w-[340px]">
        <QrPaymentTile paid={paid} seconds={seconds} />
      </Card>
      <Button variant="ghost" onClick={() => setPaid((p) => !p)} className="min-w-[148px]">
        {paid ? "New code" : "Simulate payment"}
      </Button>
    </div>
  );
}

// A click on these plays with them instead of opening the page behind the tile.
const stay = (e: React.MouseEvent) => e.stopPropagation();

export const DEMOS: Record<string, Demo> = {
  "qr-payment-tile": {
    controls: [{ key: "seconds", type: "select", label: "Valid for", options: ["15", "90"], labels: ["15 s", "90 s"], default: "90" }],
    render: (p) => <QrDemo key={String(p.seconds)} seconds={Number(p.seconds)} />,
    usage: (p) => `<QrPaymentTile\n  merchant="Rimba Kemang"\n  amount={1250000}\n  reference="INV-20418"\n  value={qrString}\n  seconds={${p.seconds}}\n  paid={order.paid}\n  onExpire={refreshCode}\n/>`,
  },
  "slide-to-pay": {
    controls: [{ key: "slow", type: "toggle", label: "Slow payment", default: false }],
    render: (p) => (
      <div className="w-full max-w-[420px]">
        <SlideToPay onConfirm={p.slow ? () => new Promise((done) => setTimeout(done, 1200)) : undefined} />
      </div>
    ),
    usage: () => `<SlideToPay amount={1250000} onConfirm={() => pay(order.id)} />`,
  },
  "card-wallet-stack": {
    stage: "page",
    render: () => (
      <div className="w-full max-w-[400px]">
        <CardWalletStack />
      </div>
    ),
    usage: () => `<CardWalletStack\n  label="Rimba Kemang"\n  cards={[{ id: "ops", name: "Operasional", last4: "4410", holder: "RIZKY HARTONO", expiry: "08/29", spent: 18420000, tone: "graphite" }]}\n  onOpenChange={setCard}\n/>`,
  },
  "secure-number-reveal": {
    render: () => <SecureNumberReveal />,
    usage: () => `<SecureNumberReveal number="4556 7120 3398 4410" holder="RIZKY HARTONO" expiry="08/29" cvv="382" />`,
  },
  "balance-privacy-wave": {
    controls: [{ key: "details", type: "toggle", label: "Details", default: true }],
    render: (p) => (
      <Card className="w-full max-w-[400px] [container-type:inline-size]">
        <BalancePrivacyWave details={p.details ? undefined : []} />
      </Card>
    ),
    usage: () => `<BalancePrivacyWave amount={48240000} details={[{ label: "In today", amount: 12480000 }]} onHiddenChange={save} />`,
  },
  "installment-slicer": {
    render: () => (
      <Card className="w-full max-w-[460px] [container-type:inline-size]">
        <InstallmentSlicer />
      </Card>
    ),
    usage: () => `<InstallmentSlicer label="Gelas kopi tanah liat, 14 pcs" total={1250000} options={[1, 3, 6, 12]} onValueChange={setMonths} />`,
  },
};

export const TILES: TileDef[] = [
  {
    items: ["qr-payment-tile"],
    render: () => (
      <Tile inset="pad" className={S[4]}>
        <h3 className="text-title font-semibold">Pay by QR</h3>
        <Mark name="qr-payment-tile" className="grid justify-items-center">
          <div className="grid w-full max-w-[300px] gap-3" onClick={stay}>
            <QrPaymentTile />
          </div>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["card-wallet-stack"],
    render: () => (
      <Tile inset="pad" className={S[4]}>
        <h3 className="text-title font-semibold">Company wallet</h3>
        <Mark name="card-wallet-stack" className="grid justify-items-center">
          <div className="w-full max-w-[340px]" onClick={stay}>
            <CardWalletStack />
          </div>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["secure-number-reveal", "balance-privacy-wave"],
    render: () => (
      <Tile inset="pad" className={`${S[4]} gap-5`}>
        <h3 className="text-title font-semibold">Card details</h3>
        <Mark name="secure-number-reveal" className="grid justify-items-center">
          <div className="grid w-full justify-items-center" onClick={stay}>
            <SecureNumberReveal className="w-full" />
          </div>
        </Mark>
        <Mark name="balance-privacy-wave" className="[container-type:inline-size]">
          <div onClick={stay}>
            <BalancePrivacyWave details={[]} />
          </div>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["slide-to-pay", "installment-slicer"],
    render: () => (
      <Tile inset="pad" className={`${S[12]} lg:grid lg:grid-cols-2 lg:items-center lg:gap-8`}>
        <Mark name="installment-slicer" className="[container-type:inline-size]">
          <div onClick={stay}>
            <InstallmentSlicer defaultValue={3} />
          </div>
        </Mark>
        <Mark name="slide-to-pay">
          <div onClick={stay}>
            <SlideToPay amount={416667} />
          </div>
        </Mark>
      </Tile>
    ),
  },
];

export const MOMENTS: ShowpieceMoment[] = [
  { id: "qr-payment", title: "QR payment tile", to: "/components/qr-payment-tile", width: "max-w-[340px]", render: () => <QrDemo /> },
  {
    id: "slide-to-pay",
    title: "Slide to pay",
    to: "/components/slide-to-pay",
    width: "max-w-[440px]",
    render: () => <SlideToPay />,
  },
  { id: "card-wallet", title: "Card wallet stack", to: "/components/card-wallet-stack", width: "max-w-[400px]", render: () => <CardWalletStack /> },
  {
    id: "secure-number",
    title: "Secure number reveal",
    to: "/components/secure-number-reveal",
    width: "max-w-[440px] justify-items-center",
    render: () => <SecureNumberReveal className="w-full" />,
  },
  {
    id: "balance-wave",
    title: "Balance privacy wave",
    to: "/components/balance-privacy-wave",
    width: "max-w-[440px]",
    render: () => (
      <Card className="[container-type:inline-size]">
        <BalancePrivacyWave />
      </Card>
    ),
  },
  {
    id: "installments",
    title: "Installment slicer",
    to: "/components/installment-slicer",
    width: "max-w-[520px]",
    render: () => (
      <Card className="[container-type:inline-size]">
        <InstallmentSlicer />
      </Card>
    ),
  },
];
