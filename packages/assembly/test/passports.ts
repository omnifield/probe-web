// Паспорта и правило допуска для проб.
//
// Паспорта свои: у кнопки одна часть, и на ней не проверить ни «часть внутри части», ни
// «место занято самим компонентом». Настоящий паспорт проверяется отдельно
// (`passport.test.ts`) — и проверяется там ровно то, ради чего он нужен: что форма кита
// подходит механике как есть.
//
// Правило допуска — НАСТОЯЩЕЕ, из кита. Своего здесь нет намеренно: пробы механики обязаны
// проверять её на том самом правиле, с которым она работает у потребителя. Напиши мы здесь
// упрощённый двойник — зелёными были бы пробы, а не механика.

import { admits } from "@omnifield/probe-web-ui/passport";

import type { Admission, ReadablePart, ReadablePassport } from "../src/passport-read.js";

/** Собирает паспорт: анатомия отдаёт перечень частей, добавка — правило вложенности. */
function passport(
  component: string,
  genus: string,
  root: string,
  parts: readonly ReadablePart[],
): ReadablePassport {
  return {
    component,
    genus,
    anatomy: { keys: () => parts.map((part) => part.name) },
    root,
    parts,
  };
}

const content = (genus: string): Admission => ({ kind: "content", genus });
const part = (name: string): Admission => ({ kind: "part", name });

/** Раскладка: принимает внутрь любой компонент — это и есть «страница». */
export const layout = passport("layout", "component", "root", [
  { name: "root", accepts: [content("component")] },
]);

/** Кнопка: одна часть, внутрь — текст или значок. Как настоящая. */
export const button = passport("button", "component", "root", [
  { name: "root", accepts: [content("text"), content("icon")] },
]);

/** Значок: место занято самим компонентом — пустой перечень не пускает НИЧЕГО. */
export const icon = passport("icon", "icon", "root", [{ name: "root", accepts: [] }]);

/**
 * Гармошка: пять частей, вложенность объявлена. Проверка «часть внутри части» — на ней.
 *
 * Кнопка раздела списана с настоящей: она допускает СРАЗУ и свою часть-указатель, и содержимое
 * двух родов. Это то самое место, где прежняя форма теряла подпись (`PWEB-83`), — потому оно и
 * стоит здесь, а не подобрано покороче.
 */
export const accordion = passport("accordion", "component", "root", [
  { name: "root", accepts: [part("item")] },
  { name: "item", accepts: [part("itemTrigger"), part("itemContent")] },
  { name: "itemTrigger", accepts: [part("itemIndicator"), content("text"), content("icon")] },
  { name: "itemContent", accepts: [content("text"), content("component")] },
  { name: "itemIndicator", accepts: [content("text"), content("icon")] },
]);

/**
 * Всплывающее окно — составной компонент с триггером: на нём проверяется композиция.
 *
 * Триггер пускает внутрь компонент — им и становится кнопка, вставленная в него. Что именно
 * туда допустимо, решает паспорт: механика об этом собственного мнения не имеет.
 */
export const popover = passport("popover", "component", "root", [
  { name: "root", accepts: [part("trigger"), part("content")] },
  { name: "trigger", accepts: [content("component")] },
  { name: "content", accepts: [content("component")] },
]);

/**
 * Компонент, чья часть правила вложенности не объявила вовсе.
 *
 * Третье состояние поля `accepts` — «не запрещает ничего». Отличать его от пустого перечня
 * обязаны и паспорт, и механика: иначе первая же незаполненная часть перестала бы принимать
 * содержимое, и паспорт соврал бы за неё.
 */
export const открытый = passport("открытый", "component", "root", [{ name: "root" }]);

/**
 * Компонент, чью часть паспорт объявил анатомией и забыл в добавке.
 *
 * Не выдумка: паспорт пишет человек, а перечень частей приходит из анатомии — разойтись им
 * есть где. Механика обязана сказать «неизвестно», а не «нельзя» и не «можно».
 */
export const halfDeclared: ReadablePassport = {
  component: "half",
  genus: "component",
  anatomy: { keys: () => ["root", "forgotten"] },
  root: "root",
  parts: [{ name: "root", accepts: [part("forgotten")] }],
};

/** Паспорта по адресу в карте компонентов — так их индексирует реестр. */
export const PASSPORTS = {
  layout,
  button,
  icon,
  accordion,
  popover,
  открытый,
  half: halfDeclared,
  // Тот же компонент под чужим пространством имён: адрес и имя совпадать не обязаны.
  "ui.button": button,
} as const;

/** Правило допуска кита — то самое, что читают все читатели паспорта. */
export const RULE = { admits };

/** Реестр для проб: карту компонентов подставляет вызывающий. */
export const spec = (components: Record<string, unknown>) => ({
  components,
  passports: PASSPORTS,
  ...RULE,
});
