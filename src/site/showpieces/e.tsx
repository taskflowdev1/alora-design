// Showpiece batch E: each component's page demo, its tile on the Components page (inside a Mark, exactly once)
// and its moment on the landing. Aggregated in ./index.ts.
import { PeelLabel } from "@/components/ui/peel-label";
import type { Demo } from "../demos";
import { Mark, Tile, type TileDef } from "../mark";
import type { ShowpieceMoment } from "./types";

export const DEMOS: Record<string, Demo> = {
  "peel-label": {
    stage: "page",
    render: () => <PeelLabel className="max-w-[520px]" />,
    usage: () => `<PeelLabel to="Sari Wulandari" address="Jl. Kaliurang Km 5 No. 14, Sleman" tracking="RK-2041-8836" weight="1,2 kg" onStick={(at) => save(at)} />`,
  },
};

export const TILES: TileDef[] = [
  {
    items: ["peel-label"],
    render: (_, c) => (
      <Tile inset="pad" className={c}>
        <h3 className="text-title font-semibold">Stick the label</h3>
        <Mark name="peel-label">
          <div onClick={(e) => e.stopPropagation()}>
            <PeelLabel />
          </div>
        </Mark>
      </Tile>
    ),
  },
];

export const MOMENTS: ShowpieceMoment[] = [
  { id: "peel-label", title: "Peel shipping label", to: "/components/peel-label", width: "max-w-[560px]", touchOnly: true, render: () => <PeelLabel /> },
];
