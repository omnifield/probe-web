// STRUCTURAL assembly for the xy family — read by `./index.ts`'s `defineEditorInfo` call. Same
// physical shape as every kit component's `playground/assemblies.ts` (`PWEB-127`).
//
// NOT LEFT EMPTY, unlike the rest of this wave's `assemblies.ts` files — and that is a deliberate
// exception, not a drift from the split (`playground-is-mine`/`ark-component-playground-split`
// memory): a composite component's PROVIDER is obligated to declare at least one working assembly
// (`packages/ui/src/entities/catalog/model/instance.ts`'s own file header: "Кнопке этого хватает,
// составному компоненту нет, и его поставщик обязан сборку объявить" — a plain part is fine bare,
// a composite one is not, and its provider must supply the assembly). Without one, the showcase's
// bare-anatomy fallback mounts `axis` with NO `scale` at all — legitimate (`../components/
// index.tsx`'s own file header, the crash this fixed, `DI-2`/live report 2026-08-27), but visibly
// EMPTY: an address with nothing drawn inside it. `means`/prose elsewhere in this wave stays
// "TODO" for another session; the TREE below is structural, not prose, and nothing renders
// without it — the same category as `accordion`'s own real "basic" tree, not the same category as
// `means`.
//
// `scale` is a REAL `ScaleLinear` instance, not a placeholder value — `d3-scale`'s own object,
// built the same way a real caller would (`../components/index.tsx`'s own doc example). Assembly
// trees in this codebase are TypeScript values, not JSON (`products/skin/src/app/shell.ts`'s own
// file header: "узел живёт в TypeScript, а не в JSON") — a function-valued prop flows through
// untouched.

import { scaleLinear } from "d3-scale";
import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type XyPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

// MARGINS ARE THIS ASSEMBLY'S OWN CHOICE, not a component default — `Xy`/`XyAxis` stay
// unopinionated about layout (visx's own "not a charting library" stance, `../components/
// index.tsx`'s own file header); a real caller picks margins for their own chart the same way.
// Found live, 2026-08-27: without a left margin, the y-axis's own tick labels (drawn at
// `x = offset - 9`) sit at negative x — outside the `viewBox`, invisible not because nothing
// rendered but because it rendered off-canvas. `left: 40` gives them room; `bottom: 30` does the
// same for the x-axis labels below its own line.
const WIDTH = 360;
const HEIGHT = 240;
const MARGIN = { top: 10, right: 10, bottom: 30, left: 40 };

const x = scaleLinear()
  .domain([0, 100])
  .range([MARGIN.left, WIDTH - MARGIN.right]);
const y = scaleLinear()
  .domain([0, 50])
  .range([HEIGHT - MARGIN.bottom, MARGIN.top]);

export const assemblies: readonly PassportAssembly<XyPart>[] = [
  {
    name: "basic",
    means: "a coordinate system: one x-axis (bottom), one y-axis (left), no series drawn on it yet",
    tree: {
      part: "root",
      props: { width: WIDTH, height: HEIGHT },
      children: [
        { part: "axis", props: { scale: x, orientation: "x", offset: HEIGHT - MARGIN.bottom } },
        { part: "axis", props: { scale: y, orientation: "y", offset: MARGIN.left } },
      ],
    },
  },
];
