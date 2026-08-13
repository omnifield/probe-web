// Сохранение и запрос к агенту В ИНТЕРФЕЙСЕ: то, что человек делает руками.
//
// Хранилище подменяется памятью — сеть здесь не проверяется (для неё есть `stand-remote`), а
// проверяется поведение: сохранил · применил · удалил · получил внятный отказ. Отдельно —
// главное правило шва: сохранённое проходит `parseFilter`, и кривой пресет не роняет стенд.

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createMemoryPresetStore,
  EMPTY_FILTER,
  type FilterState,
  type PresetStore,
  serializeFilter,
} from "../src/filters/index.js";
import type { AgentAnswer } from "../src/playground/agent.js";
import { App } from "../src/playground/app.jsx";
import { AskAgent } from "../src/playground/ask-agent.jsx";
import type { StandStore, StoreMode } from "../src/playground/remote-store.js";
import { createStand } from "../src/playground/stand.js";
import { all, cleanup, mount, one, press, type } from "./dom.jsx";

afterEach(() => {
  cleanup();
  globalThis.location.hash = "";
});

/** Хранилище стенда на памяти: то же поведение, но без сети. */
function standStore(mode: StoreMode = "service", store: PresetStore = createMemoryPresetStore()): StandStore {
  return { store, mode: () => mode, reason: () => null, subscribe: () => {} };
}

/** Дать промисам хранилища доехать: интерфейс обновляется после `await`. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Стенд на странице отбора, уже дождавшийся первого обращения к хранилищу.
 *
 * Ждать обязательно: пока список тянется, кнопки выключены — и это не придирка пробы, а то же
 * самое, что видит человек, нажимая раньше времени.
 */
async function standOnFilters(store: StandStore = standStore()) {
  globalThis.location.hash = "#/filters";
  const host = mount(() => <App store={store} />);
  await settle();
  return host;
}

const nameField = (host: ParentNode) => one<HTMLInputElement>(host, ".page__save-name");

async function saveCurrent(host: ParentNode, label: string): Promise<void> {
  type(nameField(host), label);
  press(one(host, ".page__save-run"));
  await settle();
}

describe("сохранение текущего отбора", () => {
  it("сохранять нечего, пока не поставлено ни одного условия", async () => {
    const host = await standOnFilters();

    expect(one<HTMLButtonElement>(host, ".page__save-run").disabled).toBe(true);
  });

  it("собрал кейс, назвал, сохранил — отбор появился в списке", async () => {
    const host = await standOnFilters();

    press(one(host, ".page__case"));
    await saveCurrent(host, "Мой отбор");

    expect(all(host, "[data-stand='saved-list'] .page__case-label").map((n) => n.textContent)).toEqual(
      ["Мой отбор"],
    );
  });

  it("без имени кнопка не нажимается: список без названий бесполезен", async () => {
    const host = await standOnFilters();
    press(one(host, ".page__case"));
    await settle();

    expect(one<HTMLButtonElement>(host, ".page__save-run").disabled).toBe(true);
  });

  it("сохранённое ОБЩЕЕ, и это сказано вслух", async () => {
    const host = await standOnFilters();
    press(one(host, ".page__case"));
    await saveCurrent(host, "Мой отбор");

    expect(one(host, "[data-stand='saved'] .page__saved-notice").textContent).toContain(
      "видят все",
    );
  });

  it("хранилища нет — сохранение работает, но интерфейс НЕ врёт про общее", async () => {
    const host = await standOnFilters(standStore("local"));
    press(one(host, ".page__case"));
    await saveCurrent(host, "Мой отбор");

    expect(one(host, "[data-stand='saved']").textContent).toContain("только в этой вкладке");
  });

  it("отказ хранилища показывается человеку, а не проглатывается", async () => {
    const refusing: PresetStore = {
      list: async () => [],
      load: async () => null,
      save: async () => {
        throw new Error("Сохранено уже 200 отборов — предел 200.");
      },
      remove: async () => {},
    };

    const host = await standOnFilters(standStore("service", refusing));
    press(one(host, ".page__case"));
    await saveCurrent(host, "Мой отбор");

    expect(one(host, ".page__saved-notice").textContent).toContain("предел 200");
  });
});

describe("применение и удаление", () => {
  it("нажал сохранённое — условия встали в конструктор", async () => {
    const host = await standOnFilters();

    press(one(host, ".page__case"));
    const conditions = all(host, "[data-slot='filter-condition']").length;
    await saveCurrent(host, "Мой отбор");

    // Сбрасываем и применяем сохранённое заново.
    press(one(host, ".page__reset"));
    expect(all(host, "[data-slot='filter-condition']").length).toBe(0);

    press(one(host, "[data-stand='saved-list'] .page__case"));
    await settle();

    expect(all(host, "[data-slot='filter-condition']").length).toBe(conditions);
  });

  it("удаление убирает отбор из списка", async () => {
    const host = await standOnFilters();
    press(one(host, ".page__case"));
    await saveCurrent(host, "Мой отбор");

    press(one(host, ".page__saved-drop"));
    await settle();

    expect(host.querySelector("[data-stand='saved-list']")).toBeNull();
  });

  it("КРИВОЙ пресет из хранилища не роняет стенд, а называет причину", async () => {
    const store = createMemoryPresetStore();
    await store.save({ label: "Из будущего", state: { version: 999, conditions: [] } });

    const host = await standOnFilters(standStore("service", store));
    await settle();

    press(one(host, "[data-stand='saved-list'] .page__case"));
    await settle();

    expect(one(host, ".page__saved-notice").textContent).toMatch(/не читается/);
    // Стенд жив: конструктор на месте, таблица на месте.
    expect(host.querySelector("[data-slot='filter-builder']")).not.toBeNull();
    expect(host.querySelector("[data-stand='table']")).not.toBeNull();
  });

  it("сохранённое читается обратно тем же разбором, которым пишется", async () => {
    const state: FilterState = {
      ...EMPTY_FILTER,
      conditions: [{ id: "c-1", kind: "compare", field: "/amount", operator: "gt", value: "100" }],
    };
    const store = createMemoryPresetStore();
    await store.save({ label: "Крупные", state: serializeFilter(state) });

    const host = await standOnFilters(standStore("service", store));
    await settle();
    press(one(host, "[data-stand='saved-list'] .page__case"));
    await settle();

    expect(all(host, "[data-slot='filter-condition']").length).toBe(1);
  });
});

describe("запрос к агенту в интерфейсе", () => {
  function askStand(answer: AgentAnswer | Promise<AgentAnswer>) {
    const stand = createStand();
    const ask = vi.fn(async () => answer);
    const host = mount(() => <AskAgent stand={stand} ask={ask as never} />);
    return { host, stand, ask };
  }

  it("пустой запрос не отправляется — кнопка выключена", () => {
    const { host } = askStand({ ok: true, state: null });

    expect(one<HTMLButtonElement>(host, ".page__ask-run").disabled).toBe(true);
  });

  it("пришёл отбор — он применился к стенду", async () => {
    const state: FilterState = {
      ...EMPTY_FILTER,
      conditions: [{ id: "a-1", kind: "compare", field: "/amount", operator: "gt", value: "500" }],
    };
    const { host, stand } = askStand({ ok: true, state: serializeFilter(state) });

    type(one<HTMLTextAreaElement>(host, ".page__ask-text"), "крупные заявки");
    press(one(host, ".page__ask-run"));
    await settle();

    expect(stand.filter().conditions.length).toBe(1);
    expect(one(host, "[data-stand='ask-agent']").getAttribute("data-phase")).toBe("done");
  });

  it("СЕРВИСА НЕТ — внятный отказ, кнопка снова живая, стенд цел", async () => {
    const { host, stand } = askStand({ ok: false, error: "Агент пока недоступен: сервис не отвечает." });

    type(one<HTMLTextAreaElement>(host, ".page__ask-text"), "крупные заявки");
    press(one(host, ".page__ask-run"));
    await settle();

    expect(one(host, ".page__ask-said").textContent).toContain("пока недоступен");
    expect(one(host, "[data-stand='ask-agent']").getAttribute("data-phase")).toBe("failed");
    expect(one<HTMLButtonElement>(host, ".page__ask-run").disabled).toBe(false);
    expect(stand.filter().conditions.length).toBe(0);
  });

  it("агент прислал МУСОР — он не доезжает до таблицы", async () => {
    const { host, stand } = askStand({ ok: true, state: { version: 1, conditions: "нет" } });

    type(one<HTMLTextAreaElement>(host, ".page__ask-text"), "что-нибудь");
    press(one(host, ".page__ask-run"));
    await settle();

    expect(one(host, ".page__ask-said").textContent).toMatch(/не читается/);
    expect(stand.filter().conditions.length).toBe(0);
  });

  it("удался запрос — его текст ПРЕДЛАГАЕТСЯ как имя, а не сохраняется сам", async () => {
    const store = standStore();
    globalThis.location.hash = "#/filters";
    const host = mount(() => <App store={store} />);

    // Тем же путём, что и человек: собрать отбор кейсом, потом назвать его.
    press(one(host, ".page__case"));
    await settle();

    // Имя — обычное поле ввода: заготовку правят, хранится то, что оставили.
    type(nameField(host), "Крупные без документов");
    press(one(host, ".page__save-run"));
    await settle();

    expect(all(host, "[data-stand='saved-list'] .page__case-label").map((n) => n.textContent)).toEqual(
      ["Крупные без документов"],
    );
  });
});
