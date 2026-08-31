// ЗАГОТОВКИ ИЗ КОРОБКИ (PWEB-187/190, ПО СХЕМАМ — 2026-08-31) — по записи (несколько) на КАЖДЫЙ
// компонент, который реально объявил `entity/io.ts` (`IO`, `entities/component/model/io.ts`), а
// не руками подобранные тексты, случайно похожие на форму одного-двух компонентов. Раньше здесь
// лежали три темы под кнопку — аккордеон и селект не получали ни одной совместимой записи
// никогда, их форма ни с чем не пересекалась (постановка user, 2026-08-31: «данные должны
// строиться так же динамически, как компоненты подключаются к витрине»).
//
// МЕХАНИЗМ (`exampleOf`, `packages/io`) читает САМУ СХЕМУ компонента (`z.toJSONSchema`) и
// строит запись, гарантированно проходящую её `safeParse` — не гадает форму снаружи. РЕШЕНИЕ,
// какой текст класть в лист, — это файл, не механизм: faker остаётся зависимостью ПРОДУКТА
// (найдено раньше — фреймворк не должен тянуть его транзитивно ради того, кому заготовки не
// нужны вовсе).
//
// SEED ФИКСИРОВАН, тем же приёмом, что и у прежних тем — набор воспроизводим между прогонами,
// не новый случайный шум при каждой загрузке витрины.

import { exampleOf, z, type ExampleLeafGenerator } from "@omnifield/probe-web-io";
import { faker } from "@faker-js/faker";

import { IO } from "../../component/model/io.js";

/** Сколько примеров строить на каждый зарегистрированный компонент. */
const EXAMPLES_PER_COMPONENT = 3;

/** Последний НЕ числовой сегмент пути — числовой означает индекс внутри массива, не имя поля. */
function fieldNameOf(path: readonly string[]): string {
  for (let index = path.length - 1; index >= 0; index -= 1) {
    const segment = path[index]!;
    if (!/^\d+$/.test(segment)) return segment;
  }
  return "";
}

/** Текст листа — по ТИПУ схемы и, для строк, по ИМЕНИ поля (та же осмысленность, что и у прежних тем руками). */
const leaf: ExampleLeafGenerator = (node, path) => {
  if (node.enum && node.enum.length > 0) return faker.helpers.arrayElement(node.enum);
  if (node.type === "boolean") return faker.datatype.boolean();
  if (node.type === "number" || node.type === "integer") return faker.number.int({ min: 1, max: 100 });
  if (node.type !== "string") return null;

  const field = fieldNameOf(path).toLowerCase();

  if (field === "id" || field === "value" || field.endsWith("id")) return faker.string.alphanumeric(8);
  if (field === "placeholder") return `— ${faker.word.noun()} —`;
  if (field === "title" || field === "label" || field === "name") return faker.hacker.phrase();
  if (field.includes("description") || field.includes("text") || field.includes("content")) return faker.lorem.sentence();
  return faker.lorem.words(2);
};

function examplesFor(schema: z.ZodType): readonly unknown[] {
  return Array.from({ length: EXAMPLES_PER_COMPONENT }, () => exampleOf(schema, leaf));
}

function builtBySchema(): Readonly<Record<string, readonly unknown[]>> {
  faker.seed(0);

  const byComponent: Record<string, readonly unknown[]> = {};
  for (const entry of IO.list()) {
    byComponent[entry.meta.component] = examplesFor(entry.schema);
  }
  return byComponent;
}

/** Что показывает витрина из коробки — тема → её записи. Одна тема на компонент, по его же схеме. */
export const BUILTIN_PACKS: Readonly<Record<string, readonly unknown[]>> = builtBySchema();
