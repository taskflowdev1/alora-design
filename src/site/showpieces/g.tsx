// Showpiece batch G: each component's page demo, its tile on the Components page (inside a Mark, exactly once)
// and its moment on the landing. Aggregated in ./index.ts.
import type { Demo } from "../demos";
import type { TileDef } from "../mark";
import type { ShowpieceMoment } from "./types";

export const DEMOS: Record<string, Demo> = {};
export const TILES: TileDef[] = [];
export const MOMENTS: ShowpieceMoment[] = [];
