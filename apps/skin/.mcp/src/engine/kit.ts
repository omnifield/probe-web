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

/** Паспорт компонента — ровно то, что называет имя тула, ничего сверх: не анатомия (дублирует
 * parts[].name), не сборки, не io, не editor-слайс (тот уже есть в listComponents). */
export function getPassport(component: string) {
  const passport = PASSPORTS[component];
  if (!passport) return undefined;

  return {
    component,
    root: passport.root,
    parts: passport.parts,
    variantAxis: passport.variantAxis,
    settings: passport.settings,
    selfAssembly: passport.selfAssembly,
  };
}

export interface AssemblyCard {
  readonly name: string;
  readonly means: string;
}

/** Список сборок компонента — карточка (дёшево), не полное дерево. `undefined` — компонента нет. */
export function getAssemblies(component: string): readonly AssemblyCard[] | undefined {
  if (!PASSPORTS[component]) return undefined;
  return (EDITOR_INFOS[component]?.assemblies ?? []).map((assembly) => ({
    name: assembly.name,
    means: assembly.means,
  }));
}

export type GetAssemblyResult =
  | { readonly ok: true; readonly assembly: unknown }
  | { readonly ok: false; readonly reason: "unknown-component" | "unknown-assembly" };

/** Полное дерево ОДНОЙ сборки по имени — дорого, по запросу, не в списке. */
export function getAssembly(component: string, name: string): GetAssemblyResult {
  if (!PASSPORTS[component]) return { ok: false, reason: "unknown-component" };

  const assembly = EDITOR_INFOS[component]?.assemblies.find((candidate) => candidate.name === name);
  return assembly ? { ok: true, assembly } : { ok: false, reason: "unknown-assembly" };
}

/** io-схема компонента — своя сущность, не часть паспорта. `undefined` — компонента нет. */
export function getIoSchema(component: string) {
  if (!PASSPORTS[component]) return undefined;

  const io = IO[component];
  return {
    input: io?.input ? z.toJSONSchema(io.input) : undefined,
    output: io?.output ? z.toJSONSchema(io.output) : undefined,
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
