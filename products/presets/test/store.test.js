// Пробы хранилища: то, что нельзя увидеть через HTTP, — переживание перезапуска, поведение
// при одновременной записи, уборка хвостов.

import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

import { LIMITS } from "../src/limits.js";
import { openStore, StorageFull } from "../src/store.js";

/** @type {string[]} */
const made = [];

async function scratch() {
  const dir = await mkdtemp(join(tmpdir(), "probe-web-presets-"));
  made.push(dir);
  return dir;
}

after(async () => {
  const { rm } = await import("node:fs/promises");
  for (const dir of made) await rm(dir, { recursive: true, force: true });
});

/**
 * @param {number} records
 * @returns {Readonly<import("../src/limits.js").Limits>}
 */
const withRecords = (records) => ({ ...LIMITS, records });

describe("хранилище", () => {
  it("кладёт и отдаёт как есть, идентификатор выдаёт само", async () => {
    const store = await openStore(await scratch());

    const created = await store.create({ label: "Срочные", state: { anything: [1, 2, 3] } });

    assert.match(created.id, /^[0-9a-f-]{36}$/);
    assert.equal(created.label, "Срочные");
    assert.equal(Number.isNaN(Date.parse(created.savedAt)), false);

    const read = await store.read(created.id);
    assert.deepEqual(read?.state, { anything: [1, 2, 3] });
  });

  it("в перечне нет содержимого — только имена и время", async () => {
    const store = await openStore(await scratch());
    await store.create({ label: "С пояснением", description: "зачем", state: { big: "x" } });
    await store.create({ label: "Без пояснения", state: { big: "y" } });

    const items = store.list();

    assert.equal(items.length, 2);
    for (const item of items) {
      assert.equal("state" in item, false, "перечень обязан идти без состояний");
      assert.equal(typeof item.label, "string");
    }
    // Пояснения может не быть вовсе — это нормальная запись, а не ущербная.
    assert.equal(items.some((item) => item.description === undefined), true);
  });

  it("перечень отбирается по ярлыку — сравнением строки, без взгляда внутрь", async () => {
    const store = await openStore(await scratch());

    const skin = await store.create({ label: "Twitter", kind: "skin", state: { seeds: {} } });
    await store.create({ label: "Срочные", kind: "filter", state: { version: 1 } });
    const unlabelled = await store.create({ label: "Без ярлыка", state: { version: 1 } });

    assert.deepEqual(
      store.list({ kind: "skin" }).map((item) => item.id),
      [skin.id],
    );
    // Ярлык виден в перечне: без него читатель не знает, какого вида запись.
    assert.equal(store.list({ kind: "skin" })[0]?.kind, "skin");

    // Отбор без ярлыка — всё, что лежит, включая непомеченное.
    assert.equal(store.list().length, 3);
    assert.equal(store.list().some((item) => item.id === unlabelled.id), true);

    // Непомеченная запись не попадает ни в один отбор по ярлыку: её вид не назван.
    assert.deepEqual(store.list({ kind: "filter" }).map((item) => item.id).includes(unlabelled.id), false);

    // Ярлык, которым никто не помечался, — пусто, а не поломка.
    assert.deepEqual(store.list({ kind: "map" }), []);
  });

  it("файл ПРОШЛОГО конверта — без ярлыка — подхватывается как есть", async () => {
    const dir = await scratch();

    // Ровно то, что уже лежит на томе у `tables`: запись, сохранённая до появления ярлыка.
    const id = "11111111-2222-3333-4444-555555555555";
    await writeFile(
      join(dir, `${id}.json`),
      JSON.stringify({ id, label: "Лежит с прошлой версии", savedAt: "2026-08-13T10:00:00.000Z", state: { version: 1 } }),
      "utf8",
    );

    const store = await openStore(dir);

    assert.equal(store.size, 1);
    const [item] = store.list();
    assert.equal(item?.label, "Лежит с прошлой версии");
    assert.equal("kind" in (item ?? {}), false, "ярлык не выдумывается за отправителя");
    assert.deepEqual((await store.read(id))?.state, { version: 1 });
  });

  it("данные переживают перезапуск: новое хранилище на том же каталоге видит старое", async () => {
    const dir = await scratch();

    const first = await openStore(dir);
    const saved = await first.create({ label: "Пережить", state: { keep: true } });

    // Перезапуск процесса — это ровно новое открытие того же каталога.
    const second = await openStore(dir);

    assert.equal(second.size, 1);
    assert.equal(second.list()[0]?.label, "Пережить");
    assert.deepEqual((await second.read(saved.id))?.state, { keep: true });
  });

  it("одновременная запись не рвёт файлы: все записи целы и читаются", async () => {
    const dir = await scratch();
    const store = await openStore(dir);

    const saved = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        store.create({ label: `Разом ${i}`, state: { i, payload: "x".repeat(500) } }),
      ),
    );

    assert.equal(new Set(saved.map((r) => r.id)).size, 25, "идентификаторы обязаны быть разными");

    // Проверяем не память, а ДИСК — и разбираем каждый файл целиком: порванный файл здесь и
    // проявился бы.
    const reopened = await openStore(dir);
    assert.equal(reopened.size, 25);
    for (const record of saved) {
      const fromDisk = await reopened.read(record.id);
      assert.deepEqual(fromDisk?.state, { i: /** @type {{i:number}} */ (record.state).i, payload: "x".repeat(500) });
    }

    // Временных файлов после записи не остаётся.
    const left = (await readdir(dir)).filter((name) => name.startsWith(".tmp-"));
    assert.deepEqual(left, []);
  });

  it("предел числа записей: сверх него не кладёт, после удаления место освобождается", async () => {
    const store = await openStore(await scratch(), withRecords(3));

    const kept = [];
    for (let i = 0; i < 3; i++) kept.push(await store.create({ label: `№${i}`, state: {} }));

    await assert.rejects(() => store.create({ label: "лишний", state: {} }), StorageFull);
    assert.equal(store.size, 3);

    const first = kept[0];
    assert.ok(first);
    await store.remove(first.id);
    await store.create({ label: "теперь можно", state: {} });
    assert.equal(store.size, 3);
  });

  it("предел держится и на ОДНОВРЕМЕННЫХ записях — место занимается сразу", async () => {
    const store = await openStore(await scratch(), withRecords(1));

    const results = await Promise.allSettled([
      store.create({ label: "первый", state: {} }),
      store.create({ label: "второй", state: {} }),
    ]);

    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(store.size, 1);
  });

  it("хвост от убитой записи убирается при открытии и не попадает в перечень", async () => {
    const dir = await scratch();
    await writeFile(join(dir, ".tmp-brokenbroken"), "{ поло");

    const store = await openStore(dir);

    assert.equal(store.size, 0);
    assert.deepEqual(await readdir(dir), []);
  });

  it("битый файл пропускается, а не роняет службу", async () => {
    const dir = await scratch();
    const store = await openStore(dir);
    const good = await store.create({ label: "целый", state: { ok: true } });
    await writeFile(join(dir, "00000000-0000-0000-0000-000000000000.json"), "не json вовсе");

    const reopened = await openStore(dir);

    assert.equal(reopened.size, 1);
    assert.equal(reopened.list()[0]?.id, good.id);
  });

  it("удаление несуществующего — это `false`, а не поломка", async () => {
    const store = await openStore(await scratch());
    assert.equal(await store.remove("00000000-0000-0000-0000-000000000000"), false);
    assert.equal(await store.remove("../../etc/passwd"), false);
    assert.equal(await store.read("../../etc/passwd"), null);
  });

  it("на диск уходит ровно то, что положили — вместе с выданным конвертом", async () => {
    const dir = await scratch();
    const store = await openStore(dir);
    const record = await store.create({ label: "На диске", state: { сырое: "значение" } });

    const raw = JSON.parse(await readFile(join(dir, `${record.id}.json`), "utf8"));

    assert.deepEqual(raw, {
      id: record.id,
      label: "На диске",
      savedAt: record.savedAt,
      state: { сырое: "значение" },
    });
  });
});
