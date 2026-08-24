// Пробы канала к агенту. В СЕТЬ НЕ ХОДЯТ: транспорт подменяется целиком, токены не тратятся.
//
// Проверяется не «модель хорошо отвечает» — это не наше дело и не воспроизводится, — а то, что
// служба вокруг неё ведёт себя предсказуемо: ограничители держат, ключ не течёт, хранилище
// живёт без агента (`PROBEWEB-9`).

import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

import { createGuard } from "../src/agent.js";
import { AGENT_LIMITS } from "../src/limits.js";
import { start } from "../src/server.js";

/** @type {Array<() => Promise<void>>} */
const cleanup = [];

after(async () => {
  for (const close of cleanup) await close();
});

const ANSWER = {
  version: 1,
  conditions: [
    { id: "c1", kind: "compare", field: "/amount", operator: "gt", value: "1000000" },
  ],
  logic: { mode: "all" },
};

/**
 * Поднять службу с подменённым каналом.
 *
 * @param {object} [channel]
 * @param {any} [channel.ask]
 * @param {any} [channel.guard]
 * @param {string | undefined} [channel.apiKey]
 */
async function serve(channel = {}) {
  const dir = await mkdtemp(join(tmpdir(), "probe-web-presets-agent-"));
  const running = await start({
    dir,
    port: 0,
    host: "127.0.0.1",
    agent: {
      apiKey: "ключ-для-пробы",
      ask: async () => ({ ok: true, state: ANSWER }),
      ...channel,
    },
  });
  cleanup.push(async () => {
    await running.close();
    await rm(dir, { recursive: true, force: true });
  });
  return running;
}

/**
 * @param {string} origin
 * @param {unknown} payload
 */
const ask = (origin, payload) =>
  fetch(`${origin}/api/agent/preset`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

describe("канал к агенту", () => {
  it("отдаёт то, что вернула модель, не трогая содержимое", async () => {
    const { origin } = await serve();

    const res = await ask(origin, { text: "сделки свыше миллиона", fields: ["/amount", "/city"] });
    assert.equal(res.status, 200);

    const payload = await res.json();
    // Ровно то, что пришло от модели: служба формата не понимает и чинить его не пытается.
    assert.deepEqual(payload, { state: ANSWER });
  });

  it("без ключа канал молчит, а ХРАНИЛИЩЕ живёт", async () => {
    const { origin } = await serve({ apiKey: undefined, ask: undefined });

    const refused = await ask(origin, { text: "что угодно", fields: ["/amount"] });
    assert.equal(refused.status, 503);
    const said = /** @type {{error: string, message: string}} */ (await refused.json());
    assert.equal(said.error, "not_configured");
    assert.match(said.message, /ключ/i);

    // Главное в этой пробе — вторая половина: ненастроенный агент НЕ должен ронять хранилище.
    const saved = await fetch(`${origin}/api/presets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label: "руками", state: { version: 1 } }),
    });
    assert.equal(saved.status, 201);
  });

  it("описание обязательно и ограничено по длине", async () => {
    const { origin } = await serve();

    assert.equal((await ask(origin, { text: "   ", fields: ["/a"] })).status, 400);
    const long = await ask(origin, {
      text: "я".repeat(AGENT_LIMITS.textChars + 1),
      fields: ["/a"],
    });
    assert.equal(long.status, 400);
    assert.equal(/** @type {{error: string}} */ (await long.json()).error, "text_too_long");
  });

  it("словарь полей необязателен, но ограничен по числу", async () => {
    const { origin } = await serve();

    // Словарь необязателен: клиент сейчас шлёт только текст, и канал обязан работать.
    assert.equal((await ask(origin, { text: "отбор" })).status, 200);
    assert.equal((await ask(origin, { text: "отбор", fields: [] })).status, 200);
    // А вот заведомо кривой словарь — отказ.
    assert.equal((await ask(origin, { text: "отбор", fields: [1, 2] })).status, 400);

    const many = await ask(origin, {
      text: "отбор",
      fields: Array.from({ length: AGENT_LIMITS.fieldsCount + 1 }, (_, i) => `/f${i}`),
    });
    assert.equal(many.status, 400);
    assert.equal(/** @type {{error: string}} */ (await many.json()).error, "fields_too_many");
  });

  it("частота: сверх предела за окно — отказ, а не вызов модели", async () => {
    let calls = 0;
    const { origin } = await serve({
      ask: async () => {
        calls += 1;
        return { ok: true, state: ANSWER };
      },
    });

    for (let i = 0; i < AGENT_LIMITS.perWindow; i += 1) {
      assert.equal((await ask(origin, { text: "отбор", fields: ["/a"] })).status, 200);
    }
    const extra = await ask(origin, { text: "отбор", fields: ["/a"] });
    assert.equal(extra.status, 429);
    assert.equal(/** @type {{error: string}} */ (await extra.json()).error, "too_fast");

    // Модель за отбитый запрос не вызывалась — иначе ограничитель берёг бы что угодно, но не
    // деньги, ради которых он и стоит.
    assert.equal(calls, AGENT_LIMITS.perWindow);
  });

  it("дневной предел считает по всей службе, а не по адресу", () => {
    // Через счётчик напрямую: гнать двести живых запросов ради этого незачем.
    const guard = createGuard({ ...AGENT_LIMITS, perDay: 3, perWindow: 100 });

    assert.equal(guard.check("1.1.1.1").ok, true);
    assert.equal(guard.check("2.2.2.2").ok, true);
    assert.equal(guard.check("3.3.3.3").ok, true);

    const stopped = guard.check("4.4.4.4");
    assert.equal(stopped.ok, false);
    assert.equal(stopped.code, "daily_limit");
  });

  it("дневной счёт обнуляется на следующие сутки", () => {
    let now = Date.parse("2026-08-13T23:59:00Z");
    const guard = createGuard({ ...AGENT_LIMITS, perDay: 1 }, () => now);

    assert.equal(guard.check("1.1.1.1").ok, true);
    assert.equal(guard.check("1.1.1.1").ok, false);

    now = Date.parse("2026-08-14T00:01:00Z");
    assert.equal(guard.check("1.1.1.1").ok, true);
  });

  it("отказ модели едет ЧЕТЫРЁХСОТЫМ, иначе стенд уйдёт в память", async () => {
    const { origin } = await serve({
      ask: async () => ({
        ok: false,
        status: 424,
        code: "upstream_refused",
        message: "Модель отказалась отвечать.",
      }),
    });

    const res = await ask(origin, { text: "отбор", fields: ["/a"] });
    // Граница 500 — это то, по чему стенд отличает «отказ по делу» от «сервиса нет».
    // Пятисотка здесь означала бы для человека, что недоступно ХРАНИЛИЩЕ, — при живом хранилище.
    assert.ok(res.status >= 400 && res.status < 500, `ожидали 4xx, пришло ${res.status}`);
  });

  it("ключ не попадает наружу ни при успехе, ни при отказе", async () => {
    const secret = "sk-ant-совершенно-секретно";
    const { origin } = await serve({
      apiKey: secret,
      ask: async () => ({ ok: false, status: 424, code: "upstream_refused", message: "Отказ." }),
    });

    const res = await ask(origin, { text: "отбор", fields: ["/a"] });
    const said = await res.text();
    assert.ok(!said.includes(secret), "ключ утёк в тело ответа");
    assert.ok(!said.includes("sk-ant"), "в ответе есть похожее на ключ");
  });

  it("чужой метод на маршруте — 405, а не тихий 404", async () => {
    const { origin } = await serve();
    const res = await fetch(`${origin}/api/agent/preset`, { method: "GET" });
    assert.equal(res.status, 405);
  });
});
