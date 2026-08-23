// Проверка порядка подключения: приехал ли базовый CSS под надетым скином.
//
// Проект `skin` в `vitest.config.ts` — JSDOM без JSX-трансформа и без Solid: предмет проверки
// здесь ровно тот, что механика НЕ ЗНАЕТ про Solid и работает со средой документа.
//
// Проверка ставится НАСТОЯЩИМИ листами стилей, а не подставленным значением: она спрашивает
// вычисленное на корне свойство, и подмена ответа проверяла бы саму подмену. JSDOM разрешает
// и кастом-свойства, и обычные — из `<style>` с селектором корня, сверено 2026-08-19 и
// 2026-08-22.

import { BASE_MARKER } from "@omnifield/probe-web-style";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { checkStyleOrder } from "../src/index.js";

/**
 * Маркерная пара — здесь она ПРОБНАЯ: механика маркера не знает, ей его сообщают.
 *
 * Настоящая пара проверяется отдельно и настоящая — см. «маркер настоящий, а не наш» ниже.
 * Разница между этими двумя местами оплачена: пока все пробы ходили собственным маркером,
 * переезд настоящего (кастом-свойство → свойство сброса) прошёл мимо них целиком.
 */
const MARKER = { property: "--space", value: "0.25rem" };

const root = () => document.documentElement;

/** Базовый CSS: даёт маркерному свойству ровно то значение, которым предъявляется приезд. */
function givenBaseCss(marker = MARKER): HTMLStyleElement {
  const sheet = document.createElement("style");
  sheet.textContent = `:root { ${marker.property}: ${marker.value}; }`;
  document.head.appendChild(sheet);
  return sheet;
}

/** Лист скина: объявляет своё и маркера НЕ несёт — он не базовый. */
function givenSkinCss(name: string): HTMLStyleElement {
  const sheet = document.createElement("style");
  sheet.textContent = `[data-skin="${name}"] { --radius: 1.3rem; }`;
  document.head.appendChild(sheet);
  return sheet;
}

/**
 * Одетая страница. Опознание ставится руками, а не механикой, намеренно: проверка спрашивает
 * ДОКУМЕНТ, и одеться могли без неё — разметкой страницы, соседним скриптом.
 */
function givenDressed(name = "фикстура"): void {
  root().setAttribute("data-skin", name);
}

beforeEach(() => {
  document.head.innerHTML = "";
  root().removeAttribute("data-skin");
  root().classList.remove("dark");
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("проверка порядка подключения", () => {
  it("база на месте — молчит", () => {
    givenBaseCss();
    givenDressed("twitter");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(checkStyleOrder({ marker: MARKER })).toEqual({
      status: "ok",
      marker: MARKER,
      seen: MARKER.value,
      skin: "twitter",
      message: "",
    });
    expect(error).not.toHaveBeenCalled();
  });

  it("ЗАВЕДОМО НЕВЕРНОЕ подключение — скин надет, базы нет — ловится и называется вслух", () => {
    givenSkinCss("twitter"); // базовый лист НЕ подключён — это и есть неверный порядок
    givenDressed("twitter");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const report = checkStyleOrder({ marker: MARKER });

    expect(report.status).toBe("missing-base");
    expect(report.skin).toBe("twitter");
    expect(report.message).toContain("twitter");
    expect(report.message).toContain(MARKER.property);
    expect(report.message).toContain(MARKER.value);
    expect(report.message).toMatch(/порядок подключения нарушен/);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0]?.[0]).toBe(report.message);
  });

  it("голый кит — ни базы, ни скина — НЕ ругань: оформление необязательно (инвариант 4)", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(checkStyleOrder({ marker: MARKER }).status).toBe("no-skin");
    expect(error).not.toHaveBeenCalled();
  });

  it("база без скина — тоже законно: это приложение на голой базе", () => {
    givenBaseCss();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(checkStyleOrder({ marker: MARKER })).toMatchObject({
      status: "ok",
      skin: null,
    });
    expect(error).not.toHaveBeenCalled();
  });

  it("маркер принимается снаружи — механика не знает НИ ОДНОЙ пары", () => {
    const foreign = { property: "--совершенно-другой-маркер", value: "1" };
    givenBaseCss(foreign);
    givenDressed("twitter");

    expect(checkStyleOrder({ marker: foreign }).status).toBe("ok");
    expect(checkStyleOrder({ marker: MARKER }).status).toBe("missing-base");
  });

  it("ЗНАЧЕНИЕ, а не наличие: свойство есть, но чужое — это НЕ приезд базы", () => {
    givenBaseCss({ property: MARKER.property, value: "999rem" });
    givenDressed("twitter");
    vi.spyOn(console, "error").mockImplementation(() => {});

    const report = checkStyleOrder({ marker: MARKER });

    expect(report.status).toBe("missing-base");
    expect(report.seen).toBe("999rem");
  });

  it("половина пары — отказ: свойство без значения врало бы ЗЕЛЁНЫМ", () => {
    expect(() => checkStyleOrder({ marker: { property: "box-sizing", value: "" } })).toThrow(
      /врёт зелёным/,
    );
    expect(() => checkStyleOrder({ marker: { property: " ", value: "border-box" } })).toThrow(
      /ПАРА/,
    );
  });

  it("обычное свойство маркером ЗАКОННО — требования «кастом-свойство» больше нет", () => {
    givenBaseCss({ property: "box-sizing", value: "border-box" });

    expect(checkStyleOrder({ marker: { property: "box-sizing", value: "border-box" } }).status).toBe(
      "ok",
    );
  });

  // ── МАРКЕР НАСТОЯЩИЙ, А НЕ НАШ ──────────────────────────────────────────────────────────
  //
  // Пары выше пробные, и этого мало. Настоящий маркер уже переезжал — с кастом-свойства на
  // свойство сброса, — и переезд прошёл мимо всех проб зоны: они ходили собственным именем,
  // поэтому остались зелёными, пока вызов в скелете ломался. Хотя бы одна проба обязана ходить
  // ТОЙ ЖЕ парой, что получит скелет; тогда следующий переезд не пройдёт молча, а покраснеет
  // здесь. Ради этого зона держит `@omnifield/probe-web-style` в пробных зависимостях: в
  // поставку он не едет, а перечень зависимостей поставки стережёт `surface.test.ts`.
  describe("маркер настоящий, а не наш", () => {
    it("ГЛАВНОЕ: краснеет без базового листа — при том что свойство браузером ОБЪЯВЛЕНО", () => {
      givenDressed("twitter");
      vi.spyOn(console, "error").mockImplementation(() => {});

      // Ни одного нашего листа в документе — и при этом свойство маркера у корня есть: его
      // объявляет сам браузер своим умолчанием. Прежняя проверка («свойство объявлено») на
      // этом месте сказала бы «база приехала» — и была бы зелёной ровно там, где всё сломано.
      const seen = getComputedStyle(root()).getPropertyValue(BASE_MARKER.property);
      expect(seen).not.toBe("");
      expect(seen).not.toBe(BASE_MARKER.value);

      const report = checkStyleOrder({ marker: BASE_MARKER });

      expect(report.status).toBe("missing-base");
      expect(report.seen).toBe(seen);
    });

    it("с приехавшей базой — зелено, и это та же пара", () => {
      // Настоящий лист объявляет маркер универсальным селектором (`*`), а JSDOM его к корню не
      // применяет — сверено 2026-08-22 прогоном настоящего `base.css`. Поэтому лист здесь наш,
      // а ПАРА настоящая: предмет пробы — сравнение значения, а не разбор чужого файла.
      givenBaseCss(BASE_MARKER);
      givenDressed("twitter");

      expect(checkStyleOrder({ marker: BASE_MARKER }).status).toBe("ok");
    });

    it("пара приезжает целиком — половины из неё не выковырять", () => {
      expect(BASE_MARKER.property.trim()).not.toBe("");
      expect(BASE_MARKER.value.trim()).not.toBe("");
      expect(String(BASE_MARKER)).toBe(BASE_MARKER.property);
    });
  });

  it("не роняет приложение — диагностика вида не имеет права этого делать", () => {
    givenDressed("twitter");
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => checkStyleOrder({ marker: MARKER })).not.toThrow();
  });
});

describe("perf-трейсы проверки", () => {
  const FLAG = "__PROBE_WEB_RUNTIME_TRACE__";

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)[FLAG];
  });

  it("по умолчанию молчат", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    checkStyleOrder({ marker: MARKER });

    expect(debug).not.toHaveBeenCalled();
  });

  it("под флагом печатают длительность участка", () => {
    (globalThis as Record<string, unknown>)[FLAG] = true;
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    checkStyleOrder({ marker: MARKER });

    expect(debug.mock.calls.map((call) => String(call[0]).split(" — ")[0])).toEqual([
      "[probe-web-runtime] checkStyleOrder",
    ]);
  });
});
