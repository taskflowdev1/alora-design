// Showpiece batch G: each component's page demo, its tile on the Components page (inside a Mark, exactly once)
// and its moment on the landing. Aggregated in ./index.ts.
import { Card } from "@/components/ui/card";
import { FoilBadge } from "@/components/ui/foil-badge";
import { PhotoStack, type StackPhoto } from "@/components/ui/photo-stack";
import { ProductHotspots, type Hotspot } from "@/components/ui/product-hotspots";
import { ScratchVoucher } from "@/components/ui/scratch-voucher";
import type { Demo } from "../demos";
import { Mark, S, Tile, type TileDef } from "../mark";
import type { ShowpieceMoment } from "./types";

const TABLE_PHOTO = "/photos/cup-table.webp";
const TABLE_ALT = "A latte on a wooden table beside a small succulent";
const TABLE_SPOTS: Hotspot[] = [
  { id: "cup", x: 37, y: 66, name: "Gelas kopi tanah liat", price: 89000 },
  { id: "plate", x: 56, y: 87, name: "Tatakan gelas jati", price: 99000 },
  { id: "pot", x: 89, y: 34, name: "Vas keramik glasir hijau", price: 210000 },
  { id: "table", x: 20, y: 22, name: "Nampan anyaman bambu", price: 175000 },
];

const STACK: StackPhoto[] = [
  { id: "cup", src: "/photos/cup-terracotta.webp", alt: "Terracotta coffee glass on a small tray", name: "Gelas kopi tanah liat", price: 89000 },
  { id: "basket", src: "/photos/products/kr-1.webp", alt: "Woven pandan basket with handles", name: "Keranjang pandan besar", price: 239000 },
  { id: "plate", src: "/photos/products/pr-2.webp", alt: "Round patterned rattan plate", name: "Piring rotan bundar", price: 145000 },
  { id: "vase", src: "/photos/products/vs-2.webp", alt: "Green glazed ceramic vase", name: "Vas keramik glasir hijau", price: 210000 },
  { id: "cloth", src: "/photos/products/tp-1.webp", alt: "Red woven ikat table runner", name: "Taplak meja tenun ikat", price: 329000 },
];

/** Keeps a press on a playable piece from also opening its page. */
const Play = ({ children }: { children: React.ReactNode }) => (
  <div className="contents" onClick={(e) => e.stopPropagation()}>
    {children}
  </div>
);

export const DEMOS: Record<string, Demo> = {
  "product-hotspots": {
    render: () => (
      <div className="w-full max-w-[520px]">
        <ProductHotspots src={TABLE_PHOTO} alt={TABLE_ALT} spots={TABLE_SPOTS} />
      </div>
    ),
    usage: () =>
      `<ProductHotspots\n  src="/photos/cup-table.webp"\n  alt="A latte on a wooden table"\n  spots={[\n    { id: "cup", x: 37, y: 66, name: "Gelas kopi tanah liat", price: 89000 },\n    { id: "pot", x: 89, y: 34, name: "Vas keramik glasir hijau", price: 210000 },\n  ]}\n  onOpenChange={(spot) => track(spot?.id)}\n/>`,
  },
  "photo-stack": {
    render: () => (
      <div className="w-full max-w-[340px]">
        <PhotoStack photos={STACK} />
      </div>
    ),
    usage: () => `<PhotoStack\n  photos={[{ id: "cup", src: "/photos/cup-terracotta.webp", alt: "Coffee glass", name: "Gelas kopi tanah liat", price: 89000 }, …]}\n  onChange={(photo) => setActive(photo.id)}\n/>`,
  },
  "scratch-voucher": {
    controls: [{ key: "offer", type: "select", label: "Offer", options: ["25% off", "Rp 50.000", "Gratis ongkir"], default: "25% off" }],
    render: (p) => (
      <div className="w-full max-w-[420px]">
        <ScratchVoucher offer={String(p.offer)} />
      </div>
    ),
    usage: (p) => `<ScratchVoucher shop="Rimba Kemang" validity="Until 31 Dec" offer="${p.offer}" code="RIMBA-7K2Q" onReveal={(code) => save(code)} />`,
  },
  "foil-badge": {
    render: () => (
      <div className="w-full max-w-[320px]">
        <FoilBadge />
      </div>
    ),
    usage: () => `<FoilBadge value="Rp 100 jt" label="Sales in November" onUnlockedChange={(on) => on && celebrate()} />`,
  },
};

export const TILES: TileDef[] = [
  {
    items: ["product-hotspots"],
    render: () => (
      <Tile inset="pad" className={S[4]}>
        <h3 className="text-title font-semibold">Shop the table</h3>
        <Mark name="product-hotspots">
          <Play>
            <ProductHotspots src={TABLE_PHOTO} alt={TABLE_ALT} spots={TABLE_SPOTS} />
          </Play>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["photo-stack"],
    render: () => (
      <Tile inset="pad" className={S[3]}>
        <h3 className="text-title font-semibold">New arrivals</h3>
        <Mark name="photo-stack" className="grid justify-items-center">
          <Play>
            <PhotoStack photos={STACK} className="max-w-[280px]" />
          </Play>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["scratch-voucher"],
    render: () => (
      <Tile inset="pad" className={S[12]}>
        <h3 className="text-title font-semibold">Member voucher</h3>
        <Mark name="scratch-voucher" className="mx-auto w-full max-w-[440px]">
          <Play>
            <ScratchVoucher />
          </Play>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["foil-badge"],
    render: () => (
      <Tile inset="pad" className={S[4]}>
        <h3 className="text-title font-semibold">Milestones</h3>
        <Mark name="foil-badge" className="grid justify-items-center">
          <Play>
            <FoilBadge className="max-w-[240px]" />
          </Play>
        </Mark>
      </Tile>
    ),
  },
];

export const MOMENTS: ShowpieceMoment[] = [
  {
    id: "product-hotspots",
    title: "Product hotspots",
    to: "/components/product-hotspots",
    width: "max-w-[560px]",
    render: () => <ProductHotspots src={TABLE_PHOTO} alt={TABLE_ALT} spots={TABLE_SPOTS} />,
  },
  {
    id: "photo-stack",
    title: "Photo stack shuffle",
    to: "/components/photo-stack",
    width: "max-w-[340px]",
    render: () => (
      <Card>
        <PhotoStack photos={STACK} />
      </Card>
    ),
  },
  {
    id: "scratch-voucher",
    title: "Scratch voucher",
    to: "/components/scratch-voucher",
    width: "max-w-[440px]",
    touchOnly: true,
    render: () => <ScratchVoucher />,
  },
  {
    id: "foil-badge",
    title: "Foil achievement badge",
    to: "/components/foil-badge",
    width: "max-w-[340px]",
    render: () => <FoilBadge />,
  },
];
