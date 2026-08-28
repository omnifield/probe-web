// STRUCTURAL assembly template for the accordion — read by `../playground/index.ts`'s
// `defineEditorInfo` call (`PWEB-116`, decomposed `PWEB-124`).
//
// ONE assembly, and it carries NO content of its own (postscript 2026-08-28, replaces the earlier
// two-entry/hardcoded-text version): count is not a structural question — how many sections exist
// is answered by DATA (`repeat`, `PWEB-156`), not by the assembly declaring two literal items —
// and WHAT sits in a section is not this assembly's business either, same reasoning the accordion
// itself is held to (disclosure mechanics — show/hide — plus a slot for content; the shape of that
// content belongs to whoever fills it, same as `Grid`'s cell or `Menu`'s item accept any
// component). Filling is a SEPARATE concern (`playground/data.ts`'s presets, or the assembly's
// consumer bringing real data of its own) — this file only says WHERE things go, never what they
// are made of.
//
// Two gaps found while looking at this, NEITHER fixed here:
//   • `root.accepts` only admits `{ kind: "part", name: "item" }` — a divider BETWEEN items
//     cannot be assembled at all under the current nesting rule. Showing one would mean
//     extending `root.accepts` first, in `../playground/index.ts` — a passport-contract change.
//   • a `{ kind: "content", genus: "component" }` node (legal inside `itemContent`) cannot
//     actually carry a nested component's own tree — `PassportAssemblyContent` is a LEAF
//     (`value: string`, no `children`). "A nested accordion inside an item's content" is not
//     buildable with today's assembly-tree type at all, not merely undemonstrated — the type
//     would need a variant that nests a whole `PassportAssemblyPart` tree under a foreign
//     component's own address.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

// The literal part-name union (`"root" | "item" | …`), read off the passport itself rather than
// spelled out by hand: `part` fields below type-check against ANATOMY, not a copy of its names
// that could drift from it. Contextual typing does not reach across a module boundary — a plain
// object literal passed straight to `defineEditorInfo` gets its typing for free from the call
// itself, but `assemblies` lives in ITS OWN module here, and this explicit derivation is what
// stands in for that contextual typing.
type AccordionPart =
  typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<AccordionPart>[] = [
  {
    name: "basic",
    means:
      "рабочий аккордеон без своего контента — сколько разделов и что в каждом, решают данные " +
      "(playground/data.ts либо свои), не эта сборка (PWEB-156)",
    // Число разделов НЕ выбор этой сборки — оно решается тем, кто принесёт данные в `RenderTree`
    // (`data`, PWEB-156). Сборка объявляет ОДИН узел-шаблон под `repeat`; без данных шаблон
    // разворачивается в ноль узлов — законное состояние, не отказ, тем же приёмом, что и у любого
    // содержимого без данных.
    tree: {
      part: "root",
      children: [
        {
          repeat: { path: "/sections" },
          template: {
            part: "item",
            // "id" — относительный путь: читается от ТЕКУЩЕГО элемента массива (`/sections/N/id`),
            // не от корня данных. `value` нужен Ark для отслеживания, какой раздел раскрыт —
            // синтетический индекс здесь не годится: он не переживает пересортировку/фильтр
            // данных, а значение из САМИХ данных переживает.
            bind: { value: "id" },
            children: [
              {
                part: "itemTrigger",
                // Клик по этому узлу — настоящий переключатель раздела, и наружу об этом стоит
                // сказать: "id" резолвится относительно ТЕКУЩЕГО элемента (`PWEB-157`), тем же
                // приёмом, что и `bind` выше, — вызывающий получает готовый JSON, не сырое
                // DOM-событие.
                on: { click: { event: { name: "toggle", context: { section: { path: "id" } } } } },
                children: [
                  { genus: "text", value: { path: "title" } },
                  { part: "itemIndicator", children: [{ genus: "icon", value: "▾" }] },
                ],
              },
              { part: "itemContent", children: [{ genus: "text", value: { path: "body" } }] },
            ],
          },
        },
      ],
    },
  },
];
