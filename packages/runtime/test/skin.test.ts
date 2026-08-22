// Механика подключения скина: применение, чтение, память выбора и проверка порядка
// (`tasker:PROBEWEB-52`, контракт `kb:PROBEWEB-13`, инварианты `kb:SKIN-7`).
//
// Проект `skin` в `vitest.config.ts` — JSDOM без JSX-трансформа и без Solid: предмет проверки
// здесь ровно тот, что механика НЕ ЗНАЕТ про Solid и работает со средой документа. Проба,
// поднимающая Solid, доказывала бы обратное тому, что мы утверждаем.
//
// Проверка порядка подключения ставится НАСТОЯЩИМИ листами стилей, а не подставленным
// значением: она спрашивает вычисленный на корне токен, и подмена ответа проверяла бы саму
// подмену. JSDOM разрешает кастом-свойства и из `<style>`, и из inline — сверено 2026-08-19.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applySkin,
  checkStyleOrder,
  readSkin,
  restoreSkin,
  type SkinMode,
} from "../src/index.js";

const STORAGE_KEY = "probe-web:skin";

/** Имя маркерного токена — здесь оно ПРОБНОЕ. Механика его не знает, ей его сообщают. */
const MARKER = "--space";

const root = () => document.documentElement;

/** Базовый CSS: объявляет на корне маркер, который обязан приехать вместе с ним. */
function givenBaseCss(): HTMLStyleElement {
  const sheet = document.createElement("style");
  sheet.textContent = `:root { ${MARKER}: 0.25rem; }`;
  document.head.appendChild(sheet);
  return sheet;
}

/** Файл пресета: объявляет своё под своим `data-theme` и маркера НЕ несёт — он не базовый. */
function givenPresetCss(id: string): HTMLStyleElement {
  const sheet = document.createElement("style");
  sheet.textContent = `[data-theme="${id}"] { --radius: 1.3rem; }`;
  document.head.appendChild(sheet);
  return sheet;
}

/**
 * Одетая страница — скин надет.
 *
 * Нужна почти каждой пробе про режим: он половина СКИНА, и на голой странице ставить его
 * некуда. Ставим опознание руками, а не механикой, намеренно — так проверяется ровно то, что
 * механика читает состояние из документа, а не из своей памяти.
 */
function givenDressed(name = "фикстура"): void {
  root().setAttribute("data-skin", name);
}

function givenSystemMode(mode: SkinMode): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: mode === "dark" && query.includes("dark"),
    media: query,
  }));
}

beforeEach(() => {
  document.head.innerHTML = "";
  root().removeAttribute("data-theme");
  root().removeAttribute("data-skin");
  root().classList.remove("dark");
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("применение и чтение", () => {
  it("ставит пресет и режим на КОРЕНЬ документа и читает их обратно", () => {
    givenDressed();

    const applied = applySkin({ preset: "twitter", mode: "dark" });

    expect(root().getAttribute("data-theme")).toBe("twitter");
    expect(root().classList.contains("dark")).toBe(true);
    expect(applied).toEqual({ preset: "twitter", mode: "dark", dressed: true });
    expect(readSkin()).toEqual({ preset: "twitter", mode: "dark", dressed: true });
  });

  it("светлый режим — ОТСУТСТВИЕ класса, а не второй класс", () => {
    givenDressed();
    applySkin({ preset: "twitter", mode: "dark" });
    applySkin({ mode: "light" });

    expect(root().classList.contains("dark")).toBe(false);
    expect(root().className).toBe("");
    expect(readSkin().mode).toBe("light");
  });

  it("снимает пресет по null — состояние «пресета нет» настоящее", () => {
    applySkin({ preset: "twitter" });
    applySkin({ preset: null });

    expect(root().hasAttribute("data-theme")).toBe(false);
    expect(readSkin().preset).toBeNull();
  });

  it("пустой идентификатор — отказ, а не молча пустой data-theme", () => {
    expect(() => applySkin({ preset: "  " })).toThrow(/preset: null/);
    expect(root().hasAttribute("data-theme")).toBe(false);
  });

  it("читает то, что стоит в документе, даже если ставили не мы", () => {
    root().setAttribute("data-theme", "чужое");
    root().setAttribute("data-skin", "чужой");
    root().classList.add("dark");

    expect(readSkin()).toEqual({ preset: "чужое", mode: "dark", dressed: true });
  });
});

// Режим — ПОЛОВИНА СКИНА, а не свойство документа: цвета у того, чего не сшили, быть не может.
// Прежняя редакция этого блока утверждала обратное — что режим ортогонален пресету, — и была
// верна, пока пресет существовал. Пресет перестал быть единицей, ортогональность пережила свой
// предмет, и правило заменено (решение архитектора 2026-08-22).
describe("режим принадлежит скину", () => {
  it("переключатель на ГОЛОЙ странице не меняет документ ни на пиксель", () => {
    const before = root().outerHTML;

    const applied = applySkin({ mode: "dark" });

    expect(root().classList.contains("dark")).toBe(false);
    expect(root().outerHTML).toBe(before);
    expect(applied.dressed).toBe(false);
  });

  it("бездействие ОТЛИЧИМО от «поменяли» — по ответу, а не по догадке", () => {
    expect(applySkin({ mode: "dark" })).toEqual({ preset: null, mode: "light", dressed: false });

    givenDressed();

    expect(applySkin({ mode: "dark" })).toEqual({ preset: null, mode: "dark", dressed: true });
  });

  it("выбор режима на голой странице ЗАПОМИНАЕТСЯ — человек его сделал", () => {
    applySkin({ mode: "dark" });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toMatchObject({ mode: "dark" });
  });

  it("снятие скина возвращает голое состояние, и переключатель снова бездействует", () => {
    givenDressed();
    applySkin({ mode: "dark" });

    root().removeAttribute("data-skin");
    root().classList.remove("dark");

    expect(applySkin({ mode: "dark" }).dressed).toBe(false);
    expect(root().classList.contains("dark")).toBe(false);
  });

  it("страница, одетая РУКАМИ, ведёт себя так же — механика необязательна", () => {
    root().setAttribute("data-skin", "своими-руками");

    expect(applySkin({ mode: "dark" }).dressed).toBe(true);
    expect(root().classList.contains("dark")).toBe(true);
  });

  it("смена режима не трогает пресет", () => {
    givenDressed();
    applySkin({ preset: "twitter", mode: "light" });
    applySkin({ mode: "dark" });

    expect(readSkin()).toEqual({ preset: "twitter", mode: "dark", dressed: true });
  });

  it("смена пресета не трогает режим", () => {
    givenDressed();
    applySkin({ preset: "twitter", mode: "dark" });
    applySkin({ preset: "dense" });

    expect(readSkin()).toEqual({ preset: "dense", mode: "dark", dressed: true });
  });

  it("правка без режима не затирает запомненный выбор светлым", () => {
    applySkin({ mode: "dark" });
    applySkin({ preset: "twitter" });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toMatchObject({ mode: "dark" });
  });
});

describe("память выбора", () => {
  it("выбор переживает перезагрузку страницы", () => {
    givenDressed();
    applySkin({ preset: "dense", mode: "dark" });

    // Перезагрузка: документ пришёл чистым, память — нет. Скин в разметке страницы стоит:
    // так выглядит приложение, подключившее свой скин само.
    root().removeAttribute("data-theme");
    root().classList.remove("dark");
    givenDressed();

    expect(restoreSkin({ presets: ["twitter", "dense"] })).toEqual({
      preset: "dense",
      mode: "dark",
      dressed: true,
    });
    expect(root().getAttribute("data-theme")).toBe("dense");
    expect(root().classList.contains("dark")).toBe(true);
  });

  it("чужое умолчание применяется, но своим выбором не становится", () => {
    applySkin({ preset: "twitter", mode: "light", remember: false });

    expect(readSkin().preset).toBe("twitter");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("восстановление НЕ запоминает — человек этого выбора не делал", () => {
    restoreSkin({ presets: ["twitter"] });

    expect(root().getAttribute("data-theme")).toBe("twitter");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("своим ключом хранилища не мешает соседу", () => {
    givenDressed();
    applySkin({ preset: "twitter", mode: "dark", storageKey: "своё" });

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(restoreSkin({ presets: ["twitter"], storageKey: "своё" }).mode).toBe("dark");
  });

  it("битая запись в хранилище не роняет запуск", () => {
    localStorage.setItem(STORAGE_KEY, "{это не json");

    expect(() => restoreSkin({ presets: ["twitter"] })).not.toThrow();
    expect(readSkin().preset).toBe("twitter");
  });

  it("недоступное хранилище не роняет запуск — память это удобство", () => {
    const denied = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("доступ к данным сайта запрещён");
      },
    });

    try {
      givenDressed();
      expect(() => applySkin({ preset: "twitter", mode: "dark" })).not.toThrow();
      expect(readSkin()).toEqual({ preset: "twitter", mode: "dark", dressed: true });
      expect(() => restoreSkin({ presets: ["twitter"] })).not.toThrow();
    } finally {
      if (denied) Object.defineProperty(globalThis, "localStorage", denied);
    }
  });

  it("переполненная квота не роняет запуск — вид всё равно верный", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => applySkin({ preset: "twitter" })).not.toThrow();
    expect(readSkin().preset).toBe("twitter");
  });
});

describe("перечень пресетов — ПРИНИМАЕТСЯ, а не объявляется", () => {
  it("запомненный пресет, которого в перечне больше нет, не ставится", () => {
    givenDressed();
    applySkin({ preset: "уехавший", mode: "dark" });
    root().removeAttribute("data-theme");

    const restored = restoreSkin({ presets: ["twitter", "dense"] });

    // Пресета нет — берётся первый из перечня. Режим при этом СВОЙ, запомненный:
    // негодный пресет не повод забыть про режим.
    expect(restored).toEqual({ preset: "twitter", mode: "dark", dressed: true });
  });

  it("умолчание — первый в перечне, пока своё не названо", () => {
    expect(restoreSkin({ presets: ["dense", "twitter"] }).preset).toBe("dense");
  });

  it("названное умолчание перебивает порядок перечня", () => {
    expect(
      restoreSkin({ presets: ["dense", "twitter"], fallback: { preset: "twitter" } }).preset,
    ).toBe("twitter");
  });

  it("умолчание null означает «без пресета», а не «возьми первый»", () => {
    expect(restoreSkin({ presets: ["dense"], fallback: { preset: null } }).preset).toBeNull();
    expect(root().hasAttribute("data-theme")).toBe(false);
  });

  it("пустой перечень — законное «пресетов нет»: ставится только режим", () => {
    givenSystemMode("dark");
    givenDressed();

    expect(restoreSkin({ presets: [] })).toEqual({ preset: null, mode: "dark", dressed: true });
    expect(root().hasAttribute("data-theme")).toBe(false);
  });

  it("перечень чужого поставщика встаёт без правок — это обычные строки", () => {
    const foreign = ["acme-light", "acme-contrast"];

    expect(restoreSkin({ presets: foreign }).preset).toBe("acme-light");
  });
});

describe("режим до первой отрисовки", () => {
  it("нечего вспоминать — берётся системный режим, а не светлый по умолчанию", () => {
    givenSystemMode("dark");
    givenDressed();

    expect(restoreSkin({ presets: ["twitter"] }).mode).toBe("dark");
    expect(root().classList.contains("dark")).toBe(true);
  });

  it("на ГОЛОЙ странице восстановление режим не ставит — за человеком следует браузер", () => {
    givenSystemMode("dark");

    const restored = restoreSkin({ presets: ["twitter"] });

    expect(restored.dressed).toBe(false);
    expect(root().classList.contains("dark")).toBe(false);
  });

  it("запомненный режим сильнее системного — человек уже выбрал", () => {
    givenSystemMode("dark");
    givenDressed();
    applySkin({ preset: "twitter", mode: "light" });
    root().classList.add("dark");

    expect(restoreSkin({ presets: ["twitter"] }).mode).toBe("light");
    expect(root().classList.contains("dark")).toBe(false);
  });

  it("движок без matchMedia не роняет запуск", () => {
    vi.stubGlobal("matchMedia", undefined);

    expect(restoreSkin({ presets: ["twitter"] }).mode).toBe("light");
  });

  it("зовётся ДО mount(): ей не нужны ни #root, ни body, ни один лист стилей", () => {
    // Ровно та обстановка, в которой скелет зовёт её из <head>: тела ещё нет.
    document.body.innerHTML = "";
    document.head.innerHTML = "";

    expect(() => restoreSkin({ presets: ["twitter"] })).not.toThrow();
    expect(root().getAttribute("data-theme")).toBe("twitter");
    expect(document.getElementById("root")).toBeNull();
  });
});

describe("проверка порядка подключения", () => {
  it("база на месте — молчит", () => {
    givenBaseCss();
    givenPresetCss("twitter");
    applySkin({ preset: "twitter" });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(checkStyleOrder({ marker: MARKER })).toEqual({
      status: "ok",
      marker: MARKER,
      preset: "twitter",
      message: "",
    });
    expect(error).not.toHaveBeenCalled();
  });

  it("ЗАВЕДОМО НЕВЕРНОЕ подключение — пресет есть, базы нет — ловится и называется вслух", () => {
    givenPresetCss("twitter"); // базовый лист НЕ подключён — это и есть неверный порядок
    applySkin({ preset: "twitter" });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const report = checkStyleOrder({ marker: MARKER });

    expect(report.status).toBe("missing-base");
    expect(report.preset).toBe("twitter");
    expect(report.message).toContain("twitter");
    expect(report.message).toContain(MARKER);
    expect(report.message).toMatch(/порядок подключения нарушен/);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0]?.[0]).toBe(report.message);
  });

  it("голый кит — ни базы, ни пресета — НЕ ругань: оформление необязательно (инвариант 4)", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(checkStyleOrder({ marker: MARKER }).status).toBe("no-skin");
    expect(error).not.toHaveBeenCalled();
  });

  it("база без пресета — тоже законно: это приложение на голой базе", () => {
    givenBaseCss();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(checkStyleOrder({ marker: MARKER })).toMatchObject({
      status: "ok",
      preset: null,
    });
    expect(error).not.toHaveBeenCalled();
  });

  it("имя маркера принимается снаружи — механика не знает НИ ОДНОГО имени токена", () => {
    const sheet = document.createElement("style");
    sheet.textContent = ":root { --совершенно-другой-маркер: 1; }";
    document.head.appendChild(sheet);
    applySkin({ preset: "twitter" });

    expect(checkStyleOrder({ marker: "--совершенно-другой-маркер" }).status).toBe("ok");
    expect(checkStyleOrder({ marker: MARKER }).status).toBe("missing-base");
  });

  it("маркер не кастом-свойство — отказ, а не вечная ложная тревога", () => {
    expect(() => checkStyleOrder({ marker: "space" })).toThrow(/начинаться с/);
  });

  it("не роняет приложение — диагностика вида не имеет права этого делать", () => {
    givenPresetCss("twitter");
    applySkin({ preset: "twitter" });
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => checkStyleOrder({ marker: MARKER })).not.toThrow();
  });
});

describe("границы механики", () => {
  it("ни одного инлайнового стиля на корне (инвариант 6)", () => {
    applySkin({ preset: "twitter", mode: "dark" });
    restoreSkin({ presets: ["twitter"] });

    expect(root().getAttribute("style")).toBeNull();
    expect(root().style.length).toBe(0);
  });

  it("трогает ровно два места: атрибут и класс на корне, и ничего больше", () => {
    document.body.innerHTML = '<div id="root"><p>уже нарисовано</p></div>';
    const before = document.body.innerHTML;

    applySkin({ preset: "twitter", mode: "dark" });
    applySkin({ preset: "dense" });

    expect(document.body.innerHTML).toBe(before);
    expect(root().getAttributeNames().sort()).toEqual(["class", "data-theme"]);
  });
});

describe("perf-трейсы механики", () => {
  const FLAG = "__PROBE_WEB_RUNTIME_TRACE__";

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)[FLAG];
  });

  it("по умолчанию молчат", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    applySkin({ preset: "twitter" });
    restoreSkin({ presets: ["twitter"] });
    checkStyleOrder({ marker: MARKER });

    expect(debug).not.toHaveBeenCalled();
  });

  it("под флагом печатают длительность каждого участка", () => {
    (globalThis as Record<string, unknown>)[FLAG] = true;
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    applySkin({ preset: "twitter" });
    restoreSkin({ presets: ["twitter"] });
    checkStyleOrder({ marker: MARKER });

    expect(debug.mock.calls.map((call) => String(call[0]).split(" — ")[0])).toEqual([
      "[probe-web-runtime] applySkin",
      "[probe-web-runtime] restoreSkin",
      "[probe-web-runtime] checkStyleOrder",
    ]);
  });
});
