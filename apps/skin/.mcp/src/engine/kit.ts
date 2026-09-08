import { EDITOR_INFOS, PASSPORTS } from "@web-core/ui/passport";
import { IO } from "@web-core/ui/io";
import { z } from "@web-core/io";
import { footprintOf, groupOf, type ComponentFootprint, type ComponentGroup } from "@web-core/skin/editor";
import { zocker } from "zocker";

export function exampleDataFor(component: string): unknown {
  const input = IO[component]?.input;
  return input ? zocker(input).generate() : undefined;
}

// Наши собственные, реалистичные данные (kind:"content" в службе пресетов) наполняют компонент
// куда честнее, чем случайный zocker — но должны реально подходить под io-схему компонента, иначе
// сами станут источником непонятных багов вместо инструмента их поиска. Компонент без io-схемы
// (например table — своя игра с props.data, не bind по IO) — проверять нечем, не отказ.
export function checkContentData(component: string, data: unknown): { ok: boolean; flaws: string[] } {
  const input = IO[component]?.input;
  if (!input) return { ok: true, flaws: [] };

  const result = input.safeParse(data);
  if (result.success) return { ok: true, flaws: [] };

  return {
    ok: false,
    flaws: result.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`),
  };
}

/** Чем сузить перечень. Пусто — весь кит. */
export interface ComponentFilter {
  readonly group?: ComponentGroup;
  readonly footprint?: ComponentFootprint;
}

/** Карточка на выбор компонента; части и описания сборок — в `getPassport`. Разбор — FAQ.md. */
export function listComponents(filter: ComponentFilter = {}) {
  return Object.keys(PASSPORTS)
    .toSorted()
    .map((name) => {
      const editor = EDITOR_INFOS[name];
      return {
        component: name,
        genus: editor?.genus,
        group: editor ? groupOf(editor) : undefined,
        footprint: editor ? footprintOf(editor) : undefined,
        package: editor?.package,
        partsCount: PASSPORTS[name]?.anatomy.keys().length ?? 0,
        assemblies: (editor?.assemblies ?? []).map((a) => a.name),
      };
    })
    .filter(
      (card) =>
        (filter.group === undefined || card.group === filter.group) &&
        (filter.footprint === undefined || card.footprint === filter.footprint),
    );
}

export function getPassport(component: string) {
  const passport = PASSPORTS[component];
  if (!passport) return undefined;

  const editor = EDITOR_INFOS[component];
  const io = IO[component];

  return {
    component,
    passport: {
      root: passport.root,
      anatomyKeys: passport.anatomy.keys(),
      parts: passport.parts,
      variantAxis: passport.variantAxis,
      settings: passport.settings,
      selfAssembly: passport.selfAssembly,
    },
    editor,
    io: io
      ? {
          input: io.input ? z.toJSONSchema(io.input) : undefined,
          output: io.output ? z.toJSONSchema(io.output) : undefined,
        }
      : undefined,
  };
}

export function allPassports() {
  return Object.values(PASSPORTS);
}

export function allEditorInfos() {
  return Object.values(EDITOR_INFOS);
}

export function passportOf(component: string) {
  return PASSPORTS[component];
}

export function editorInfoOf(component: string) {
  return EDITOR_INFOS[component];
}
