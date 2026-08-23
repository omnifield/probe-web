// ПОДСТАВНАЯ СЛУЖБА для проб — минимальный конверт, без понимания содержимого.
//
// Подменяется `fetch`, а не наш клиент: проверять надо ШОВ со службой — адрес, ярлык вида,
// разбор ответа, — а подмена клиента проверяла бы только то, что мы умеем звать сами себя.
//
// Служба здесь ровно такая, какой её описывает контракт хранилища: кладёт непрозрачный кусок под
// `state`, отдаёт перечень БЕЗ содержимого и запись целиком по идентификатору. Никакого разбора
// скина в ней нет — его нет и в настоящей.

import type { Skin } from "@omnifield/probe-web-skin/model";

interface StoredRecord {
  id: string;
  label: string;
  name: string;
  kind: string;
  state: unknown;
}

/** Что положено в подставную службу за текущую пробу. */
const stored: StoredRecord[] = [];

/** Настоящий `fetch` — возвращается на место в `restoreStore()`. */
let original: typeof fetch | undefined;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

/**
 * Поднимает подставную службу и кладёт в неё скины.
 *
 * Служба отбирает по ярлыку вида, не заглядывая внутрь, — проба идёт тем же путём.
 *
 * @param skins что должно лежать в хранилище на момент пробы
 */
export function serveSkins(skins: readonly Skin[] | Skin): void {
  const list = Array.isArray(skins) ? skins : [skins];

  stored.length = 0;

  for (const [index, skin] of list.entries()) {
    stored.push({
      id: `rec-${index + 1}`,
      label: skin.name,
      name: skin.name,
      kind: "skin",
      state: skin,
    });
  }

  original ??= globalThis.fetch;

  globalThis.fetch = ((input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const id = url.pathname.split("/").at(-1);

    // Перечень отдаётся БЕЗ содержимого — ровно как настоящая служба: содержимое приезжает
    // отдельным запросом, и проба обязана пройти тот же путь, что живая витрина.
    if (url.pathname.endsWith("/presets")) {
      const kind = url.searchParams.get("kind");
      const items = stored
        .filter((record) => kind === null || record.kind === kind)
        .map(({ id: recordId, label, name }) => ({ id: recordId, label, name }));

      return Promise.resolve(json({ items }));
    }

    const found = stored.find((record) => record.id === id);

    return Promise.resolve(
      found ? json(found) : json({ error: "not_found", message: "нет такой записи" }, 404),
    );
  }) as typeof fetch;
}

/** Роняет службу: любой запрос обрывается, как при неподнятой службе. */
export function dropStore(): void {
  original ??= globalThis.fetch;
  globalThis.fetch = (() => Promise.reject(new TypeError("Failed to fetch"))) as typeof fetch;
}

/** Возвращает настоящий `fetch` на место. */
export function restoreStore(): void {
  if (original) globalThis.fetch = original;
  stored.length = 0;
}
