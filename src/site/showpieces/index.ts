import * as A from "./a";
import * as B from "./b";
import * as C from "./c";
import * as D from "./d";
import * as E from "./e";
import * as F from "./f";
import * as G from "./g";
import * as H from "./h";
import * as I from "./i";
import * as J from "./j";

const BATCHES = [A, B, C, D, E, F, G, H, I, J];
export const SHOWPIECE_DEMOS = Object.assign({}, ...BATCHES.map((b) => b.DEMOS)) as typeof A.DEMOS;
export const SHOWPIECE_TILES = BATCHES.flatMap((b) => b.TILES);
export const SHOWPIECE_MOMENTS = BATCHES.flatMap((b) => b.MOMENTS);
