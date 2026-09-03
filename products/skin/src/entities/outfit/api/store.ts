// ХРАНИЛИЩЕ ВИДА — разговор со службой (`PWEB-13`, `PWEB-78`), ЧТЕНИЕ.
//
// ## Три записи вида, а не одна
//
// Вид делится на палитру, форму и наряд (страница раздела «Вид складывается из частей»). Каждая
// лежит своей записью и помечена своим ярлыком вида: служба ярлык не толкует — она по нему
// только отбирает, не заглядывая внутрь.
//
// Ярлыки наши: понимание формата принадлежит владельцу вида, то есть нам. Служба хранит
// непрозрачные куски и одинаково безразлична ко всем им.
//
// ## Только чтение — писать сюда сегодня некому
//
// Воркспейс сегодня показывает вид (`SkinSwitcher` надевает, `ComponentPreview` рисует), но не
// редактирует его — прежний редактор скина (`SettingsPanel`/черновик) снят вместе со старым
// рантаймом витрины (`PWEB-173`, 2026-08-29). Пишущая половина (`save`/`replace`/`remove`,
// сохранённые сборки) и четвёртый ярлык (`assembly`) были её частью и без неё не читаются
// ниоткуда — убраны вместе с ней; появится редактор — вернутся тем же приёмом, каким `packages/
// skin` уже сохраняет и читает `assembly`-записи через MCP (`.mcp/src/store.js`), эта служба
// прекрасно переживает второго писателя.
//
// ## Скинов в коде зоны нет
//
// Ни перечня, ни семени, ни встроенного «на крайний случай». Содержимое живёт в службе, и только
// там: части делает человек, хранилище их держит, витрина показывает.
//
// ## Три состояния, и они говорятся врозь
//
// Служба ответила и перечень есть · служба ответила, но пуста · службы нет. Лечатся они разным,
// поэтому и называются разно: пустая служба ждёт первого наряда, отсутствие службы — её подъёма.
// Слепи их в одно «ничего нет» — человек пойдёт чинить не то.

import type { Form, Outfit, Palette } from "@omnifield/probe-web-skin/model";

/**
 * Адрес службы.
 *
 * Задаётся снаружи, умолчание — служба на этой машине. Относительный путь здесь не годится:
 * через пульт разработки всё, кроме его собственных путей, уезжает в зону, и `/api/presets`
 * попал бы в наш дев-сервер, а не в службу.
 */
const BASE =
  (import.meta.env["VITE_PRESETS_URL"] as string | undefined) ?? "http://127.0.0.1:8787/api/presets";

/** Ярлыки вида: по ним служба отбирает записи, не толкуя ни одной. */
export const KINDS = {
  palette: "palette",
  form: "form",
  outfit: "outfit",
} as const;

/** Команда, которой поднимают службу. Человеку нужен адрес и команда, а не текст ошибки движка. */
export const SERVICE_HINT = "pnpm --filter @probe-web/presets start";

/** Что делать, когда служба отвечает, а нарядов в ней нет. */
export const EMPTY_HINT = "наряды собирает человек — соберите первый из палитры и форм";

/**
 * Служба ОТВЕТИЛА и отказала: имя занято, предел, кривой конверт.
 *
 * Отличать от «службы нет» обязательно. Спутай их — и человеку покажут «сохранено» там, где
 * служба как раз отказалась: он уйдёт, считая наряд общим, а тот не сохранён нигде.
 */
export class StoreRefused extends Error {}

/** Службы нет: обрыв связи или пятисотка. Витрина это переживает и говорит человеку. */
export class StoreDown extends Error {}

/** Запись в перечне: то, что служба отдаёт БЕЗ содержимого. */
export interface StoreRecord {
  /** Идентификатор записи — им её читают и удаляют. Выдаёт служба. */
  readonly id: string;
  /** Имя для человека. */
  readonly label: string;
  /** Имя для машины — им запись зовут наряд и источник. */
  readonly name: string;
}

/** Чужой ответ разбирается, а не приводится типом. */
interface WireRecord {
  id?: unknown;
  label?: unknown;
  name?: unknown;
  state?: unknown;
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");

async function ask(url: string, init?: RequestInit): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (cause) {
    // Обрыв связи — не отказ: службы просто нет по этому адресу. Человеку показывается АДРЕС, а
    // не текст ошибки движка: «Failed to fetch» не говорит ему, что делать, а адрес говорит.
    console.debug("служба вида недоступна", cause);
    throw new StoreDown(`служба не отвечает по адресу ${new URL(url).origin}`);
  }

  if (response.ok) return response;

  // Граница ровно на 500: ниже — ответ по делу, выше — сломанная служба.
  if (response.status < 500) {
    const said = (await response.text().catch(() => "")).trim();
    throw new StoreRefused(said === "" ? `служба отказала (${response.status})` : said);
  }

  throw new StoreDown(`служба ответила ${response.status}`);
}

/**
 * Перечень записей одного вида — без содержимого.
 *
 * Записи без машинного имени отбрасываются: имя это то, чем запись зовут наряд и источник, и
 * запись без него не адресуема. Молча подставить ей идентификатор значило бы завести второе имя,
 * которого автор не давал.
 *
 * @param kind ярлык вида
 */
export async function listOf(kind: string): Promise<StoreRecord[]> {
  const response = await ask(`${BASE}?kind=${kind}`);
  const body: unknown = await response.json();
  const items: unknown = (body as { items?: unknown }).items;

  if (!Array.isArray(items)) throw new StoreRefused("служба ответила не перечнем");

  return items
    .map((item) => item as WireRecord)
    .filter((item) => text(item.name) !== "" && text(item.id) !== "")
    .map((item) => ({
      id: text(item.id),
      label: text(item.label) === "" ? text(item.name) : text(item.label),
      name: text(item.name),
    }));
}

/**
 * Содержимое записи по идентификатору.
 *
 * Разбор здесь минимальный и намеренно такой: под `state` лежит наш формат, и проверять его по
 * полю значило бы завести вторую проверку рядом с той, что делает сборка. Кривая запись
 * отвергнется ею, с именованными изъянами и адресом каждого.
 */
async function readState<T>(id: string): Promise<T> {
  const response = await ask(`${BASE}/${encodeURIComponent(id)}`);
  const body = (await response.json()) as WireRecord;

  if (body.state === null || typeof body.state !== "object") {
    throw new StoreRefused(`запись «${id}» пуста`);
  }

  return body.state as T;
}

/** Наряды: то, что человек выбирает и надевает. Части по отдельности не надеваются. */
export async function listOutfits(): Promise<StoreRecord[]> {
  return listOf(KINDS.outfit);
}

/**
 * Части, из которых собирается наряд: все палитры и все формы службы.
 *
 * Берутся ЦЕЛИКОМ, а не по именам из наряда: перечни короткие, а выбирать нужные — работа
 * сборки, и второго правила «какие части нужны этому наряду» мы не заводим.
 */
export async function readParts(): Promise<{ palettes: Palette[]; forms: Form[] }> {
  const [palettes, forms] = await Promise.all([listOf(KINDS.palette), listOf(KINDS.form)]);

  return {
    palettes: await Promise.all(palettes.map((record) => readState<Palette>(record.id))),
    forms: await Promise.all(forms.map((record) => readState<Form>(record.id))),
  };
}

/** Наряд по имени, либо `undefined` — если такого в службе нет. */
export async function readOutfit(name: string): Promise<Outfit | undefined> {
  const record = (await listOutfits()).find((item) => item.name === name);

  return record === undefined ? undefined : readState<Outfit>(record.id);
}
