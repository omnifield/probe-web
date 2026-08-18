/**
 * ОБЯЗАТЕЛЬСТВО зоны: имена зацепок `data-slot` и состояний, за которые цепляется чужое
 * оформление.
 *
 * Данные живут НЕ здесь, а в поставке — [`src/slots.json`](../src/slots.json), и отдаются
 * подпутём `@probe-web/tables/slots.json`. Этот файл их только читает и типизирует.
 *
 * ## Почему обещание уехало в пакет
 *
 * Раньше перечень лежал прямо здесь, и это было обещанием, которого потребитель не мог
 * достать: `test/` в поверхность пакета не входит, а после переезда зоны отдельным продуктом
 * путь `../tables/test/slot-list.ts` просто исчезнет. Проба потребителя, читающая чужой
 * тестовый файл, сверяется не с обещанием, а с его копией (заявка owner-skin 2026-08-17).
 *
 * JSON, а не TS: его читает и проба, и генератор, и человек, и он не тянет за собой сборку.
 * Цена — комментарии в JSON не живут, поэтому весь разбор «почему так» остался здесь, рядом с
 * гейтом, который это стережёт.
 *
 * ## Что именно обещано
 *
 * > **Имя из перечня не меняется и не исчезает без мажорного поднятия версии.**
 * > Добавить новое имя можно минором — тех, кто цеплялся за прежние, добавление не ломает.
 *
 * Перечень выписан РУКАМИ, а не снят с исходников: снятый с кода подтверждал бы сам себя и
 * переименование проезжало бы молча вместе с рефакторингом. Правка `slots.json` в сторону
 * удаления или переименования = ломающее изменение поставки, и она обязана быть решением, а
 * не побочным следствием.
 *
 * Стережёт перечень `test/slots.test.tsx` — с обеих сторон: имя из перечня обязано появиться в
 * живом документе, а зацепка из исходников обязана быть в перечне.
 *
 * ## `data-slot` — СПИСОК имён через пробел
 *
 * Как `class`, а не одно имя. Отсюда главное для потребителя: **цепляться через `~=`**.
 * Селектор `[data-slot="button"]` не совпадёт со значением `"button filter-preset"`, и не
 * совпадёт молча — оформление просто не применится.
 *
 * Тридцать наших частей стоят на примитивах кита и несут два имени: его и наше. Раньше своё
 * ПЕРЕКРЫВАЛО чужое, и узел переставал быть кнопкой для оформления кита — оставался с
 * браузерным умолчанием (находка owner-skin 2026-08-17).
 *
 * ## Семейство в имени обязательно
 *
 * `table-select-all`, а не `select-all`: «выделить всё» захотят и список выбора, и дерево, и
 * галерея, и в общем пространстве имён они столкнутся. Семейство — не украшение, а адрес.
 *
 * ## Состояния — атрибутами, и перечислены
 *
 * Класс как контракт не годится: класс уже значение вида, и, поставленный изнутри, зона стала
 * бы вторым источником оформления рядом с потребителем. Признак (`flag`) стоит ПУСТЫМ и
 * снимается совсем, а не выставляется в `"false"`: `[data-empty]` в CSS значит «пусто», и
 * `data-empty="false"` сломало бы этот селектор молча.
 *
 * Числа зацепок здесь нет и не будет: число устаревает при каждом добавлении части, а
 * обещание — нет. Контракт — перечень, а не его длина.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Чем состояние является для того, кто одевает. */
export type StateKind =
  /** Признак: атрибут либо стоит (пустым), либо его нет. Значений не имеет. */
  | "flag"
  /** Состояние со значением из закрытого набора. */
  | "enum"
  /** Тождество или место: по нему адресуются, а не одеваются. */
  | "identity"
  /** Машинное значение показанного: число, дата, флаг — до показа человеку. */
  | "value";

export interface StatePromise {
  /** Зацепка, на которой атрибут стоит. */
  slot: string;
  attr: string;
  kind: StateKind;
  /** Закрытый набор значений — только у `enum`. У остальных пуст. */
  values: readonly string[];
  /** Что атрибут означает. Одеваем по смыслу, а не по догадке об имени. */
  means: string;
}

export interface SlotPromise {
  version: number;
  /** Чем имена разделены в значении атрибута. Пробел — как в `class`. */
  separator: string;
  families: Record<string, readonly string[]>;
  /** Имена кита, доезжающие до нашего документа. Обещает их он, не мы. */
  foreign: readonly string[];
  /** Какая наша зацепка на каком примитиве кита стоит. */
  kitBacked: Record<string, readonly string[]>;
  states: Record<string, readonly StatePromise[]>;
}

const STATE_KINDS = new Set(["flag", "enum", "identity", "value"]);

/**
 * Разбор поставленного перечня — С ПРОВЕРКОЙ ФОРМЫ, а не приведением типа.
 *
 * Читаем ровно тем же способом, каким его прочитает потребитель: файлом с диска, а не
 * импортом модуля. Иначе мы проверяли бы удобную нам форму, а он получал бы другую.
 *
 * Приведение (`as`) здесь было бы обещанием без покрытия: сломанный JSON проехал бы до первой
 * пробы, которая об него споткнётся, и краснота указала бы не туда. Форма — часть контракта с
 * потребителем, значит она проверяется, а не предполагается.
 */
function readPromise(): SlotPromise {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = resolve(here, "..", "src", "slots.json");
  const raw: unknown = JSON.parse(readFileSync(path, "utf8"));

  // Аннотация на ПЕРЕМЕННОЙ, а не только на стрелке: без неё TypeScript не считает вызов
  // обрывающим поток и не сужает тип после проверки.
  const fail: (why: string) => never = (why) => {
    throw new Error(`${path}: ${why}`);
  };

  if (typeof raw !== "object" || raw === null) return fail("ожидался объект");
  const data = raw as Record<string, unknown>;

  if (typeof data.version !== "number") fail("нет поля `version`");
  if (typeof data.separator !== "string") fail("нет поля `separator`");

  const names = (value: unknown, where: string): string[] => {
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
      return fail(`${where}: ожидался список строк`);
    }
    return value as string[];
  };

  const group = (value: unknown, where: string): Record<string, string[]> => {
    if (typeof value !== "object" || value === null) fail(`${where}: ожидался объект`);
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        names(item, `${where}.${key}`),
      ]),
    );
  };

  const states = (value: unknown, where: string): StatePromise[] => {
    if (!Array.isArray(value)) return fail(`${where}: ожидался список`);
    return value.map((item, index): StatePromise => {
      const at = `${where}[${index}]`;
      if (typeof item !== "object" || item === null) fail(`${at}: ожидался объект`);
      const state = item as Record<string, unknown>;
      if (typeof state.slot !== "string") fail(`${at}: нет поля \`slot\``);
      if (typeof state.attr !== "string") fail(`${at}: нет поля \`attr\``);
      if (typeof state.kind !== "string" || !STATE_KINDS.has(state.kind)) {
        fail(`${at}: неизвестный \`kind\``);
      }
      if (typeof state.means !== "string" || state.means === "") {
        fail(`${at}: состояние без смысла — по нему нельзя одеть`);
      }
      return {
        slot: state.slot,
        attr: state.attr,
        kind: state.kind as StateKind,
        values: names(state.values, `${at}.values`),
        means: state.means,
      };
    });
  };

  return {
    version: data.version as number,
    separator: data.separator as string,
    families: group(data.families, "families"),
    foreign: names(data.foreign, "foreign"),
    kitBacked: group(data.kitBacked, "kitBacked"),
    states: Object.fromEntries(
      Object.entries((data.states ?? {}) as Record<string, unknown>).map(([key, item]) => [
        key,
        states(item, `states.${key}`),
      ]),
    ),
  };
}

export const PROMISE: SlotPromise = readPromise();

export const FAMILIES = PROMISE.families;

export const TABLE_SLOTS = PROMISE.families.table!;
export const FILTER_SLOTS = PROMISE.families.filter!;
export const CHART_SLOTS = PROMISE.families.chart!;
export const ADAPTER_SLOTS = PROMISE.families.adapter!;

export const PROMISED_SLOTS: readonly string[] = Object.values(PROMISE.families).flat();

export const FOREIGN_SLOTS = PROMISE.foreign;
export const KIT_BACKED_SLOTS = PROMISE.kitBacked;
export const SLOT_SEPARATOR = PROMISE.separator;

export const PROMISED_TABLE_STATES = PROMISE.states.table!;
export const PROMISED_FILTER_STATES = PROMISE.states.filter!;
export const PROMISED_CHART_STATES = PROMISE.states.chart!;
