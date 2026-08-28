// STRUCTURAL assembly templates for the workspace — read by `./index.ts`'s `defineEditorInfo`
// call (`PWEB-154`, expanded `PWEB-161`). Same physical shape as every other component's
// `playground/assemblies.ts`.
//
// EIGHT assemblies — real, named layout patterns from the market, not our own invention (user
// asked to check how these are conventionally named, not to make names up):
//
//   • `stacked`, `sidebar`, `multi-column` — Tailwind UI's own names for exactly these shapes
//     (`tailwindcss.com/plus/ui-blocks/application-ui/application-shells`);
//   • `holy-grail` — the classic header+footer+three-column pattern, named this way since the
//     early 2000s (`web.dev/patterns/layout/holy-grail`);
//   • `dashboard`, `right-rail`, `sidebar-header`, `sidebar-footer` — common, widely-understood
//     shorthand for the remaining slot combinations, not a coined term with its own citation.
//
// PLAIN TEXT PLACEHOLDERS, NOT `extra` NODES — same reasoning as before `PWEB-161`'s revert: this
// component's own assemblies exist to prove the LAYOUT structurally in the gallery, not to double
// as the real app's composition (that's `products/skin/src/app/shell.tsx`, plain JSX).
//
// The `header-first`/`sidebar-first` VARIATION (`playground/recipe.ts`) and the `data-outlined`
// SETTING apply orthogonally to every assembly below — switching them has no visible effect on
// assemblies missing the slots they touch (e.g. `sidebar-first` vs. `header-first` look identical
// on `stacked`, which has no sidebar), the same as any axis that doesn't apply to a given case.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type WorkspacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const RAIL = { part: "sidebar", children: [{ genus: "text", value: "Рельсы" }] } as const;
const TOPBAR = { part: "header", children: [{ genus: "text", value: "Шапка" }] } as const;
const STAGE = { part: "main", children: [{ genus: "text", value: "Показ" }] } as const;
const PANEL = { part: "rightbar", children: [{ genus: "text", value: "Панель" }] } as const;
const BOTTOM = { part: "footer", children: [{ genus: "text", value: "Подвал" }] } as const;

export const assemblies: readonly PassportAssembly<WorkspacePart>[] = [
  {
    name: "stacked",
    means: "«stacked» (Tailwind UI) — шапка во всю ширину, показ под ней, без колонок вовсе",
    tree: { part: "root", children: [TOPBAR, STAGE] },
  },
  {
    name: "sidebar",
    means: "«sidebar» (Tailwind UI) — только левая колонка и показ, без шапки",
    tree: { part: "root", children: [RAIL, STAGE] },
  },
  {
    name: "sidebar-header",
    means: "рельсы плюс шапка над показом — тот же «sidebar», с верхней полосой",
    tree: { part: "root", children: [RAIL, TOPBAR, STAGE] },
  },
  {
    name: "right-rail",
    means: "правая колонка при показе, без шапки и рельсов — «right rail» блога или документации",
    tree: { part: "root", children: [STAGE, PANEL] },
  },
  {
    name: "multi-column",
    means: "«multi-column» (Tailwind UI) — рельсы, показ и правая колонка, без шапки: почта, доска задач",
    tree: { part: "root", children: [RAIL, STAGE, PANEL] },
  },
  {
    name: "dashboard",
    means: "«dashboard» — шапка, рельсы, показ и правая панель разом, без подвала",
    tree: { part: "root", children: [TOPBAR, RAIL, STAGE, PANEL] },
  },
  {
    name: "sidebar-footer",
    means: "рельсы и шапка над показом плюс подвал снизу, без правой панели",
    tree: { part: "root", children: [TOPBAR, RAIL, STAGE, BOTTOM] },
  },
  {
    name: "holy-grail",
    means: "«Holy Grail Layout» целиком — шапка, подвал и три колонки, все шесть слотов сразу",
    tree: { part: "root", children: [TOPBAR, RAIL, STAGE, PANEL, BOTTOM] },
  },
];
