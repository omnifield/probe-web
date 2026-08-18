// Проба, которая стережёт правило зоны (`kb:PROBEWEB-8`): служба НЕ заглядывает внутрь
// состояния. Кладём заведомую чушь — она обязана вернуться неизменной.
//
// Это не формальность и не украшение. Стоит кому-нибудь «на минутку» добавить сюда проверку
// условий, миграцию версии или нормализацию полей — знание о формате окажется в двух местах,
// обязанных меняться синхронно, и на второй версии формата они разъедутся молча. Красный
// прогон здесь и есть тот сигнал, что правило нарушено.

import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

import { start } from "../src/server.js";

/** @type {Array<() => Promise<void>>} */
const cleanup = [];

after(async () => {
  for (const close of cleanup) await close();
});

async function serve() {
  const dir = await mkdtemp(join(tmpdir(), "probe-web-presets-opaque-"));
  const running = await start({ dir, port: 0, host: "127.0.0.1" });
  cleanup.push(async () => {
    await running.close();
    await rm(dir, { recursive: true, force: true });
  });
  return running;
}

/**
 * Сохранить состояние и взять его обратно.
 *
 * @param {string} origin
 * @param {unknown} state
 * @returns {Promise<{ status: number, state: unknown, raw: string }>}
 */
async function roundtrip(origin, state) {
  const created = await fetch(`${origin}/api/presets`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ label: "чушь", state }),
  });
  if (created.status !== 201) return { status: created.status, state: undefined, raw: "" };

  const { id } = /** @type {{ id: string }} */ (await created.json());
  const back = await fetch(`${origin}/api/presets/${id}`);
  const raw = await back.text();
  const record = /** @type {{ state: unknown }} */ (JSON.parse(raw));
  return { status: back.status, state: record.state, raw };
}

describe("служба не понимает, что внутри", () => {
  it("заведомая чушь возвращается неизменной — вплоть до порядка ключей", async () => {
    const { origin } = await serve();

    // Ничего из этого не является фильтром. Служба обязана этого не заметить.
    const nonsense = {
      version: "не число",
      conditions: "не список",
      "поле с пробелами": { "": null, "🙂": "\u0000\u001f" },
      логика: [1, [2, [3, [4]]]],
      "": false,
      число: 1e308,
    };

    const { status, state, raw } = await roundtrip(origin, nonsense);

    assert.equal(status, 200);
    assert.deepEqual(state, nonsense);
    // Побайтовое сравнение: сериализация не переставила ключи и ничего не дописала.
    assert.ok(
      raw.includes(JSON.stringify(nonsense)),
      "состояние обязано лежать в ответе ровно тем же куском JSON",
    );
  });

  it("состояние — любой JSON, а не обязательно объект", async () => {
    const { origin } = await serve();

    for (const state of [42, "строка", [1, 2, 3], null, true, {}, []]) {
      const { status, state: back } = await roundtrip(origin, state);
      assert.equal(status, 200, `не принято состояние ${JSON.stringify(state)}`);
      assert.deepEqual(back, state);
    }
  });

  it("пресет чужой версии формата и с неизвестным оператором принимается молча", async () => {
    const { origin } = await serve();

    // Версия 99 не существует, оператора `превыше` нет. Отсекать это — работа читателя
    // (`parseFilter` в зоне `tables`), а не хранилища: только у него есть чем.
    const alien = {
      version: 99,
      conditions: [{ id: "c1", kind: "compare", field: "/сумма", op: "превыше", value: "много" }],
      logic: { mode: "формула", expr: "1 И 2 И 3" },
    };

    const { status, state } = await roundtrip(origin, alien);

    assert.equal(status, 200);
    assert.deepEqual(state, alien);
  });

  it("ярлык вида ничего не меняет: под `skin` лежит та же чушь и возвращается неизменной", async () => {
    const { origin } = await serve();

    // Служба не знает, что значит `skin`, и не проверяет, похоже ли это на оформление. Начни
    // она смотреть внутрь под ярлыком — перечень видов оказался бы у неё, и знание о каждом
    // формате пришлось бы держать здесь (`kb:PROBEWEB-8`).
    const nonsense = { это: "не оформление", шкалы: [null, false, ""], "": { "🙂": 0 } };

    // Третий ярлык — тот, которого сегодня нет ни у кого: новый вид не требует правки службы.
    for (const kind of ["skin", "filter", "map-2"]) {
      const created = await fetch(`${origin}/api/presets`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: `чушь под ${kind}`, kind, state: nonsense }),
      });
      assert.equal(created.status, 201);

      const { id } = /** @type {{ id: string }} */ (await created.json());
      const raw = await (await fetch(`${origin}/api/presets/${id}`)).text();
      const record = /** @type {{ state: unknown }} */ (JSON.parse(raw));

      assert.deepEqual(record.state, nonsense, `состояние изменилось под ярлыком ${kind}`);
      assert.ok(
        raw.includes(JSON.stringify(nonsense)),
        "состояние обязано лежать в ответе ровно тем же куском JSON",
      );
    }
  });

  it("глубокая вложенность не разбирается и не обходится", async () => {
    const { origin } = await serve();

    /** @type {Record<string, unknown>} */
    let deep = { дно: true };
    for (let i = 0; i < 200; i++) deep = { уровень: i, внутри: deep };

    const { status, state } = await roundtrip(origin, deep);

    assert.equal(status, 200);
    assert.deepEqual(state, deep);
  });
});
