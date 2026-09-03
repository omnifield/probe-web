// Design notes: ../README.md#presets
//
// РАЗГОВОР СО СЛУЖБОЙ РАЗДАЧИ (`products/presets`) — один провод на все три её записи. Контракт
// службы стабильный и один на все записи (`kind=palette|form|outfit`), и это не продуктовое
// знание: понимание формата теперь принадлежит механике, а не тому, кто её зовёт (`PWEB-214`).
//
// Раньше этот же провод жил в продукте (`products/skin/entities/outfit/api/store.ts`, снесён при
// переезде на `createSkinConnection`) и был там на один адрес службы, взятый один раз из
// `import.meta.env`. Здесь адрес — АРГУМЕНТ КАЖДОГО ВЫЗОВА, не модульная константа: фабрика
// заводится не по разу на приложение, а по разу на каждый её вызов, и не переживает конфликта, у
// какого из них какой адрес.

import type { Form, Outfit, Palette } from "../look/index.js";

/** Ярлыки вида: по ним служба отбирает записи, не толкуя ни одной. */
const KIND = {
  palette: "palette",
  form: "form",
  outfit: "outfit",
} as const;

/**
 * Служба ОТВЕТИЛА и отказала: имя занято, предел, кривой конверт.
 *
 * Отличать от {@link PresetsDown} обязательно: приложение обязано говорить по-разному «службы
 * нет» и «служба отказала» — молчаливо слить их значило бы показать человеку не то лечение.
 */
export class PresetsRefused extends Error {}

/** Службы нет по названному адресу: обрыв связи или пятисотка. */
export class PresetsDown extends Error {}

/** Запись в перечне: то, что служба отдаёт БЕЗ содержимого. */
interface PresetRecord {
  readonly id: string;
  readonly label: string;
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
    // Обрыв связи — не отказ: службы просто нет по этому адресу. Человеку нужен адрес, а не
    // текст ошибки движка: «Failed to fetch» не говорит, что делать, а адрес говорит.
    throw new PresetsDown(`служба раздачи не отвечает по адресу ${new URL(url).origin}`, { cause });
  }

  if (response.ok) return response;

  // Граница ровно на 500: ниже — ответ по делу, выше — сломанная служба.
  if (response.status < 500) {
    const said = (await response.text().catch(() => "")).trim();
    throw new PresetsRefused(said === "" ? `служба раздачи отказала (${response.status})` : said);
  }

  throw new PresetsDown(`служба раздачи ответила ${response.status}`);
}

/** Перечень записей одного вида — без содержимого. Записи без машинного имени неадресуемы. */
async function listOf(base: string, kind: string): Promise<PresetRecord[]> {
  const response = await ask(`${base}?kind=${kind}`);
  const body: unknown = await response.json();
  const items: unknown = (body as { items?: unknown }).items;

  if (!Array.isArray(items)) throw new PresetsRefused("служба раздачи ответила не перечнем");

  return items
    .map((item) => item as WireRecord)
    .filter((item) => text(item.name) !== "" && text(item.id) !== "")
    .map((item) => ({
      id: text(item.id),
      label: text(item.label) === "" ? text(item.name) : text(item.label),
      name: text(item.name),
    }));
}

async function readState<T>(base: string, id: string): Promise<T> {
  const response = await ask(`${base}/${encodeURIComponent(id)}`);
  const body = (await response.json()) as WireRecord;

  if (body.state === null || typeof body.state !== "object") {
    throw new PresetsRefused(`запись «${id}» пуста`);
  }

  return body.state as T;
}

/** Имена нарядов службы. */
export async function listOutfitNames(base: string): Promise<readonly string[]> {
  return (await listOf(base, KIND.outfit)).map((record) => record.name);
}

/** Наряд по имени, либо `undefined` — такого в службе нет. */
export async function readOutfit(base: string, name: string): Promise<Outfit | undefined> {
  const record = (await listOf(base, KIND.outfit)).find((item) => item.name === name);
  return record === undefined ? undefined : readState<Outfit>(base, record.id);
}

/**
 * Части, из которых складывается наряд: все палитры и все формы службы, ЦЕЛИКОМ.
 *
 * Не по именам из наряда: перечни короткие, а какие части нужны — решает сборка (`assemble`), не
 * этот провод.
 */
export async function readParts(base: string): Promise<{ palettes: Palette[]; forms: Form[] }> {
  const [palettes, forms] = await Promise.all([listOf(base, KIND.palette), listOf(base, KIND.form)]);

  return {
    palettes: await Promise.all(palettes.map((record) => readState<Palette>(base, record.id))),
    forms: await Promise.all(forms.map((record) => readState<Form>(base, record.id))),
  };
}
