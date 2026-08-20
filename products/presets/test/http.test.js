// Пробы поверхности: четыре действия против живой службы и каждый отказ — со своим кодом.
// Служба поднимается на свободном порту (`port: 0`), поэтому пробы не спорят за 8787.

import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

import { LIMITS } from "../src/limits.js";
import { start } from "../src/server.js";
import { skin } from "./skin.fixture.js";

/** @type {Array<() => Promise<void>>} */
const cleanup = [];

after(async () => {
  for (const close of cleanup) await close();
});

/**
 * Поднять службу на пустом каталоге.
 *
 * @param {Partial<import("../src/limits.js").Limits>} [limits]
 */
async function serve(limits = {}) {
  const dir = await mkdtemp(join(tmpdir(), "probe-web-presets-http-"));
  const running = await start({ dir, port: 0, host: "127.0.0.1", limits: { ...LIMITS, ...limits } });
  cleanup.push(async () => {
    await running.close();
    await rm(dir, { recursive: true, force: true });
  });
  return running;
}

/**
 * @param {Response} res
 * @returns {Promise<any>}
 */
const body = (res) => res.json();

describe("поверхность службы", () => {
  it("четыре действия: сохранить · перечень · взять · удалить", async () => {
    const { origin } = await serve();

    const created = await fetch(`${origin}/api/presets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label: "Срочные", description: "что горит", state: { v: 1 } }),
    });
    assert.equal(created.status, 201);
    const saved = await body(created);
    assert.match(saved.id, /^[0-9a-f-]{36}$/);
    assert.equal(created.headers.get("location"), `/api/presets/${saved.id}`);
    assert.equal("state" in saved, false, "в ответе на сохранение содержимое незачем");

    const listed = await body(await fetch(`${origin}/api/presets`));
    assert.equal(listed.items.length, 1);
    assert.deepEqual(listed.items[0], {
      id: saved.id,
      label: "Срочные",
      description: "что горит",
      savedAt: saved.savedAt,
    });

    const one = await fetch(`${origin}/api/presets/${saved.id}`);
    assert.equal(one.status, 200);
    assert.deepEqual(await body(one), { ...listed.items[0], state: { v: 1 } });

    const removed = await fetch(`${origin}/api/presets/${saved.id}`, { method: "DELETE" });
    assert.equal(removed.status, 204);
    assert.equal((await fetch(`${origin}/api/presets/${saved.id}`)).status, 404);
    assert.equal((await body(await fetch(`${origin}/api/presets`))).items.length, 0);
  });

  it("идентификатор выдаёт служба — присланный клиентом не берётся", async () => {
    const { origin } = await serve();

    const saved = await body(
      await fetch(`${origin}/api/presets`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: "хочу-такой", savedAt: "1999-01-01", label: "Свой id", state: {} }),
      }),
    );

    assert.notEqual(saved.id, "хочу-такой");
    assert.notEqual(saved.savedAt, "1999-01-01");
  });

  it("имя обязательно, пояснение — нет", async () => {
    const { origin } = await serve();

    /** @param {unknown} payload */
    const post = (payload) =>
      fetch(`${origin}/api/presets`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

    for (const bad of [{ state: {} }, { label: "", state: {} }, { label: "   ", state: {} }, { label: 5, state: {} }]) {
      const res = await post(bad);
      assert.equal(res.status, 400, `ожидался отказ на ${JSON.stringify(bad)}`);
      const failure = await body(res);
      assert.equal(failure.error, "label_required");
      assert.ok(failure.message.length > 0, "отказ обязан говорить человеку, что не так");
    }

    const ok = await post({ label: "Без пояснения", state: {} });
    assert.equal(ok.status, 201);
    assert.equal("description" in (await body(ok)), false);
  });

  it("состояние обязательно, а тело — JSON", async () => {
    const { origin } = await serve();

    const noState = await fetch(`${origin}/api/presets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label: "без состояния" }),
    });
    assert.equal(noState.status, 400);
    assert.equal((await body(noState)).error, "state_required");

    const notJson = await fetch(`${origin}/api/presets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ поло",
    });
    assert.equal(notJson.status, 400);
    assert.equal((await body(notJson)).error, "bad_json");
  });

  it("предел размера записи: отказ 413 и внятное тело", async () => {
    const { origin } = await serve({ bodyBytes: 2 * 1024 });

    const res = await fetch(`${origin}/api/presets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label: "жирный", state: { payload: "я".repeat(4000) } }),
    });

    assert.equal(res.status, 413);
    const failure = await body(res);
    assert.equal(failure.error, "too_large");
    assert.ok(failure.message.includes("КБ"), "человеку надо назвать предел");
    assert.equal((await body(await fetch(`${origin}/api/presets`))).items.length, 0);
  });

  it("предел размера держится и без объявленной длины — по факту накопленного", async () => {
    const { port } = await serve({ bodyBytes: 1024 });

    // Тело по частям (`chunked`): длины в заголовке НЕТ вовсе, и отказать по ней нельзя.
    // Ровно тот случай, ради которого предел проверяется дважды: заголовок пишет клиент.
    const { connect } = await import("node:net");
    const answer = await new Promise((resolve, reject) => {
      const socket = connect(port, "127.0.0.1", () => {
        socket.write(
          "POST /api/presets HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\n" +
            "Transfer-Encoding: chunked\r\n\r\n",
        );
        const chunk = "я".repeat(1000); // 2000 байт в UTF-8
        for (let i = 0; i < 4; i++) {
          socket.write(`${Buffer.byteLength(chunk).toString(16)}\r\n${chunk}\r\n`);
        }
        socket.write("0\r\n\r\n");
      });
      let text = "";
      socket.on("data", (part) => {
        text += part.toString();
      });
      socket.on("close", () => resolve(text));
      socket.on("error", reject);
    });

    assert.ok(
      String(answer).includes("413"),
      `ожидался 413, получено: ${String(answer).slice(0, 120)}`,
    );
  });

  it("предел числа записей: отказ 409, и он говорит, что делать", async () => {
    const { origin } = await serve({ records: 2 });

    /** @param {string} label */
    const post = (label) =>
      fetch(`${origin}/api/presets`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label, state: {} }),
      });

    assert.equal((await post("раз")).status, 201);
    assert.equal((await post("два")).status, 201);

    const full = await post("три");
    // Именно 4xx: для читателя 5xx значит «сервиса нет», и отказ по пределу утонул бы в этом.
    assert.equal(full.status, 409);
    assert.ok(full.status < 500, "отказ по делу обязан отличаться от поломки службы");
    const failure = await body(full);
    assert.equal(failure.error, "storage_full");
    assert.ok(failure.message.includes("Удалите"), "отказ обязан называть выход");

    // Освободили место — снова можно.
    const items = (await body(await fetch(`${origin}/api/presets`))).items;
    await fetch(`${origin}/api/presets/${items[0].id}`, { method: "DELETE" });
    assert.equal((await post("снова")).status, 201);
  });

  it("чужие адреса и методы — свои коды, а не пятисотка", async () => {
    const { origin } = await serve();

    assert.equal((await fetch(`${origin}/api/нет-такого`)).status, 404);
    assert.equal((await fetch(`${origin}/api/presets/не-тот-id`)).status, 404);

    const wrong = await fetch(`${origin}/api/presets`, { method: "DELETE" });
    assert.equal(wrong.status, 405);
    assert.equal(wrong.headers.get("allow"), "GET, POST");
    assert.equal((await body(wrong)).error, "method_not_allowed");
  });

  it("отвечает на проверку живости и на предполётный запрос браузера", async () => {
    const { origin } = await serve();

    const health = await fetch(`${origin}/healthz`);
    assert.equal(health.status, 200);
    assert.equal((await body(health)).ok, true);

    const preflight = await fetch(`${origin}/api/presets`, { method: "OPTIONS" });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("access-control-allow-origin"), "*");
  });
});

describe("ярлык вида", () => {
  /**
   * @param {string} origin
   * @param {unknown} payload
   */
  const post = (origin, payload) =>
    fetch(`${origin}/api/presets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

  it("кладётся, отдаётся и отбирает перечень", async () => {
    const { origin } = await serve();

    const skin = await body(await post(origin, { label: "Twitter", kind: "skin", state: { s: 1 } }));
    const filter = await body(await post(origin, { label: "Срочные", kind: "filter", state: { f: 1 } }));

    // Ярлык виден там же, где и остальной конверт: в ответе на запись, в перечне и в записи
    // целиком. Иначе стенд не может показать, какого вида запись, — а он показывает.
    assert.equal(skin.kind, "skin");
    assert.equal((await body(await fetch(`${origin}/api/presets/${skin.id}`))).kind, "skin");

    const skins = await body(await fetch(`${origin}/api/presets?kind=skin`));
    assert.deepEqual(
      skins.items.map((/** @type {{id: string}} */ item) => item.id),
      [skin.id],
      "по ярлыку обязаны приезжать только записи этого вида",
    );
    assert.equal(skins.items[0].kind, "skin");

    const filters = await body(await fetch(`${origin}/api/presets?kind=filter`));
    assert.deepEqual(
      filters.items.map((/** @type {{id: string}} */ item) => item.id),
      [filter.id],
    );

    // Без ярлыка в запросе — перечень целиком: старый вызов работает как прежде.
    assert.equal((await body(await fetch(`${origin}/api/presets`))).items.length, 2);

    // Ярлык, которым никто не помечался, — пустой перечень, а не отказ: вида просто нет ещё.
    assert.deepEqual((await body(await fetch(`${origin}/api/presets?kind=map`))).items, []);
  });

  it("совместимость: запись без ярлыка кладётся и читается как прежде", async () => {
    const { origin } = await serve();

    // Ровно то, что шлёт зона `tables` сегодня, — конверт прошлой версии, без ярлыка.
    const created = await post(origin, { label: "Старый конверт", state: { version: 1 } });
    assert.equal(created.status, 201);
    const saved = await body(created);
    assert.equal("kind" in saved, false, "непомеченная запись не обзаводится ярлыком сама");

    const listed = await body(await fetch(`${origin}/api/presets`));
    assert.deepEqual(listed.items[0], {
      id: saved.id,
      label: "Старый конверт",
      savedAt: saved.savedAt,
    });

    const one = await body(await fetch(`${origin}/api/presets/${saved.id}`));
    assert.equal("kind" in one, false);
    assert.deepEqual(one.state, { version: 1 });

    // В отбор по чужому ярлыку она не попадает: её вид не назван, и приписывать ей чужой
    // значило бы толковать за отправителя.
    assert.deepEqual((await body(await fetch(`${origin}/api/presets?kind=skin`))).items, []);
  });

  it("ярлык не той формы — отказ 400, и на записи, и на отборе", async () => {
    const { origin } = await serve();

    for (const bad of ["", " ", "Skin", "skin/1", "скин", "a".repeat(33), "-skin"]) {
      const refused = await post(origin, { label: "Кривой ярлык", kind: bad, state: {} });
      assert.equal(refused.status, 400, `ожидался отказ на ярлык ${JSON.stringify(bad)}`);
      const failure = await body(refused);
      assert.equal(failure.error, "bad_kind");
      assert.ok(failure.message.length > 0, "отказ обязан говорить человеку, что не так");

      // На отборе — тот же отказ, а НЕ пустой перечень: пустой список читался бы как «таких
      // записей нет», и опечатка выглядела бы как чистое хранилище.
      const asked = await fetch(`${origin}/api/presets?kind=${encodeURIComponent(bad)}`);
      assert.equal(asked.status, 400, `ожидался отказ на отбор по ${JSON.stringify(bad)}`);
      assert.equal((await body(asked)).error, "bad_kind");
    }

    // Ярлык-не-строка — тот же отказ: конверт проверяется по форме, а не по вежливости.
    const notString = await post(origin, { label: "Ярлык числом", kind: 5, state: {} });
    assert.equal(notString.status, 400);
    assert.equal((await body(notString)).error, "bad_kind");

    // `null` читается как «ярлыка нет» — так же, как у пояснения.
    const nulled = await post(origin, { label: "Ярлык null", kind: null, state: {} });
    assert.equal(nulled.status, 201);
    assert.equal("kind" in (await body(nulled)), false);
  });
});

describe("скин как единица хранения", () => {
  /**
   * @param {string} origin
   * @param {unknown} payload
   */
  const post = (origin, payload) =>
    fetch(`${origin}/api/presets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

  it("ГЕЙТ: скин на весь кит проходит через службу целиком, без потери частей", async () => {
    const { origin } = await serve();

    // Единица хранения — скин, а не набор значений (`PWEB-13`): переменные плюс рецепты, по
    // одному на компонент. Кит Ark — 69 компонентов, одеваем все.
    const state = skin(69);
    const created = await post(origin, { label: "Тёмный", name: "dark", kind: "skin", state });

    assert.equal(created.status, 201, "скин целиком обязан проходить одной записью");
    const saved = await body(created);

    const back = await body(await fetch(`${origin}/api/presets/${saved.id}`));
    assert.deepEqual(back.state, state, "скин обязан вернуться до последнего рецепта");
  });

  it("приложение получает перечень скинов и выбирает по имени", async () => {
    const { origin } = await serve();

    await post(origin, { label: "Тёмный", name: "dark", kind: "skin", state: skin(1) });
    await post(origin, { label: "Светлый", name: "light", kind: "skin", state: skin(1) });
    await post(origin, { label: "Срочные", kind: "filter", state: { f: 1 } });

    const listed = await body(await fetch(`${origin}/api/presets?kind=skin`));

    // Имя приезжает В ПЕРЕЧНЕ — иначе приложению пришлось бы скачать все скины целиком, чтобы
    // узнать, как они называются, и выбор стоил бы столько же, сколько применение.
    assert.deepEqual(
      listed.items.map((/** @type {{name: string}} */ item) => item.name).sort(),
      ["dark", "light"],
    );
    assert.equal(listed.items.length, 2, "отбор по ярлыку остаётся отбором");

    // Выбрали имя — берём эту запись и получаем скин целиком, одним запросом.
    const chosen = listed.items.find((/** @type {{name: string}} */ item) => item.name === "dark");
    const one = await body(await fetch(`${origin}/api/presets/${chosen.id}`));
    assert.equal(one.name, "dark");
    assert.ok(one.state.recipes, "по выбранному имени приезжает сам скин");
  });

  it("имя не той формы — отказ 400: оно уезжает на корень страницы, а не в текст", async () => {
    const { origin } = await serve();

    for (const bad of ["", " ", "Dark", "dark/1", "тёмный", "a".repeat(33), "-dark"]) {
      const refused = await post(origin, { label: "Кривое имя", name: bad, state: {} });
      assert.equal(refused.status, 400, `ожидался отказ на имя ${JSON.stringify(bad)}`);
      assert.equal((await body(refused)).error, "bad_name");
    }

    // Имя-не-строка — тот же отказ; `null` читается как «имени нет», как у пояснения и ярлыка.
    assert.equal((await post(origin, { label: "Имя числом", name: 5, state: {} })).status, 400);
    const nulled = await post(origin, { label: "Имя null", name: null, state: {} });
    assert.equal(nulled.status, 201);
    assert.equal("name" in (await body(nulled)), false);
  });

  it("занятое имя — отказ 409, и он называет занятое имя", async () => {
    const { origin } = await serve();

    assert.equal((await post(origin, { label: "Тёмный", name: "dark", state: {} })).status, 201);

    const taken = await post(origin, { label: "Другой тёмный", name: "dark", state: {} });
    assert.equal(taken.status, 409);
    assert.ok(taken.status < 500, "конфликт имён — отказ по делу, а не поломка службы");
    const failure = await body(taken);
    assert.equal(failure.error, "name_taken");
    assert.ok(failure.message.includes("dark"), "человеку надо назвать, какое имя занято");

    // Второй записи не появилось: отказ — это отказ, а не «сохранили под другим именем».
    assert.equal((await body(await fetch(`${origin}/api/presets`))).items.length, 1);
  });

  it("предел объёма: отказ 409 говорит про место, а не про число записей", async () => {
    // Записей разрешено двести — упираемся именно в объём.
    const { origin } = await serve({ totalBytes: 8 * 1024 });

    assert.equal((await post(origin, { label: "Раз", state: { p: "x".repeat(6000) } })).status, 201);

    const full = await post(origin, { label: "Два", state: { p: "y".repeat(6000) } });
    assert.equal(full.status, 409);
    const failure = await body(full);
    assert.equal(failure.error, "storage_full");
    assert.ok(failure.message.includes("Удалите"), "отказ обязан называть выход");
    assert.ok(
      !failure.message.includes("пресетов"),
      "текст про число записей увёл бы человека удалять не то",
    );
  });
});
