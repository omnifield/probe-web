// РАЗГОВОР СО СЛУЖБОЙ ПРЕСЕТОВ — Node-версия того же клиента, что и
// `products/skin/src/entities/outfit/api/store.ts`, не переиспользование того файла: тот читает
// адрес из `import.meta.env` (Vite, браузер), здесь адреса нет — обычный `process.env`. Проводок
// (`ask`/`StoreRefused`/`StoreDown`) минимально свои, потому что рантайм другой, но wire-формат и
// правило зоны те же: служба непрозрачна, ярлык (`kind`) не толкует, кладём/читаем целиком.
//
// Общий с браузерным клиентом приём НЕ дублируется отдельно — четыре ярлыка вида
// (`palette`/`form`/`outfit`/`assembly`) здесь не перечень «известных», а просто строка,
// которую передаёт вызывающая ручка: сама служба ярлык не толкует, и эта зона тоже не должна.

const BASE = process.env["SKIN_MCP_PRESETS_URL"] ?? "http://127.0.0.1:8787/api/presets";

export class StoreRefused extends Error {}
export class StoreDown extends Error {}

/**
 * @param {string} url
 * @param {RequestInit} [init]
 */
async function ask(url, init) {
  let response;

  try {
    response = await fetch(url, init);
  } catch (cause) {
    throw new StoreDown(`служба пресетов не отвечает по адресу ${new URL(url).origin} — ${SERVICE_HINT}`, { cause });
  }

  if (response.ok) return response;

  if (response.status < 500) {
    const said = (await response.text().catch(() => "")).trim();
    throw new StoreRefused(said === "" ? `служба отказала (${response.status})` : said);
  }

  throw new StoreDown(`служба ответила ${response.status}`);
}

export const SERVICE_HINT = "pnpm --filter @probe-web/presets start";

/**
 * @typedef {{id:string,label:string,name?:string,kind?:string,savedAt:string}} StoreRecord
 * @typedef {StoreRecord & {state: unknown}} StoreEntry
 */

/**
 * @param {string} kind
 * @returns {Promise<StoreRecord[]>}
 */
export async function list(kind) {
  const response = await ask(`${BASE}?kind=${encodeURIComponent(kind)}`);
  const body = /** @type {{items: StoreRecord[]}} */ (await response.json());
  return body.items;
}

/**
 * @param {string} id
 * @returns {Promise<StoreEntry>}
 */
export async function read(id) {
  const response = await ask(`${BASE}/${encodeURIComponent(id)}`);
  return /** @type {StoreEntry} */ (await response.json());
}

/**
 * @param {string} kind
 * @param {string} name
 */
export async function findByName(kind, name) {
  const items = await list(kind);
  return items.find((item) => item.name === name);
}

/**
 * @param {string} kind
 * @param {string} name
 * @param {unknown} state
 * @param {string} [label]
 */
export async function save(kind, name, state, label) {
  const response = await ask(BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind, name, label: label ?? name, state }),
  });
  return await response.json();
}

/** @param {string} id */
export async function remove(id) {
  await ask(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * Кладёт запись ВМЕСТО прежней с тем же именем — снять, потом положить, тем же порядком, что и
 * браузерный клиент (`replace`, `products/skin/src/entities/outfit/api/store.ts`): обратный
 * порядок оставил бы в службе две записи одного имени.
 *
 * @param {string} kind
 * @param {string} name
 * @param {unknown} state
 * @param {string} [label]
 */
export async function replace(kind, name, state, label) {
  const existing = await findByName(kind, name);
  if (existing) await remove(existing.id);
  return await save(kind, name, state, label);
}

/**
 * Все записи одного вида, СОДЕРЖИМЫМ (`state`, не конвертом) — как `readParts` браузерного
 * клиента, но для любого `kind`.
 *
 * @param {string} kind
 * @returns {Promise<unknown[]>}
 */
export async function readAllOf(kind) {
  const items = await list(kind);
  const entries = await Promise.all(items.map((item) => read(item.id)));
  return entries.map((entry) => entry.state);
}

/**
 * Типизированные обёртки поверх `readAllOf` — служба содержимого не проверяет, а мы, зная свой
 * `kind`, вправе назвать себе тип на границе. Одно место каста на весь пакет, а не по вызову.
 *
 * @returns {Promise<import("@omnifield/probe-web-skin/model").Palette[]>}
 */
export async function readPalettes() {
  return /** @type {import("@omnifield/probe-web-skin/model").Palette[]} */ (await readAllOf("palette"));
}

/** @returns {Promise<import("@omnifield/probe-web-skin/model").Form[]>} */
export async function readForms() {
  return /** @type {import("@omnifield/probe-web-skin/model").Form[]} */ (await readAllOf("form"));
}
