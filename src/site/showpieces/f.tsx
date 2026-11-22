// Showpiece batch F: each component's page demo, its tile on the Components page (inside a Mark, exactly once)
// and its moment on the landing. Aggregated in ./index.ts.
import * as React from "react";
import { cn } from "@/lib/ad";
import { BeforeAfter } from "@/components/ui/before-after";
import type { Demo } from "../demos";
import { Mark, S, Tile, type TileDef } from "../mark";
import type { ShowpieceMoment } from "./types";

/** The same frame twice: the flat, ungraded scan and the finished grade. */
const Wipe = ({ className }: { className?: string }) => (
  <BeforeAfter
    before="/photos/dafoe/dafoe-wipe-raw.webp"
    after="/photos/dafoe/dafoe-wipe.webp"
    alt="Willem Dafoe with a goldfish in his mouth"
    afterLabel="Graded"
    className={cn("aspect-square", className)}
  />
);

/** The pieces answer to clicks and drags, so a click inside one stays there instead of opening its page. */
const Keep = ({ children }: { children: React.ReactNode }) => (
  <div className="contents" onClick={(e) => e.stopPropagation()}>
    {children}
  </div>
);

export const DEMOS: Record<string, Demo> = {
  "before-after": {
    render: () => <Wipe className="max-w-[480px]" />,
    usage: () => `<BeforeAfter before="/photos/shoot-raw.webp" after="/photos/shoot-graded.webp" alt="Portrait" afterLabel="Graded" />`,
  },
};

export const TILES: TileDef[] = [
  {
    items: ["before-after"],
    render: () => (
      <Tile inset="pad" className={S[4]}>
        <h3 className="text-title font-semibold">Colour grade</h3>
        <Mark name="before-after">
          <Keep>
            <Wipe />
          </Keep>
        </Mark>
      </Tile>
    ),
  },
];

export const MOMENTS: ShowpieceMoment[] = [
  { id: "before-after", title: "Before after wipe", to: "/components/before-after", width: "max-w-[480px]", render: () => <Wipe /> },
];
