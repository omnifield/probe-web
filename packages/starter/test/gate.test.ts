// ГЕЙТ, КОТОРЫЙ ВЫПОЛНЯЕТ, А НЕ ЧИТАЕТ.
//
// Остальные пробы зоны судят шаблон ЧТЕНИЕМ ТЕКСТА: «содержит ли такую строку». Такая проба
// переживает любую поломку, лишь бы текст совпадал, — и ровно это случилось: маркер приезда
// базы переехал со строки на ПАРУ «свойство и значение», вызов в шаблоне сломался, а зона
// осталась зелёной. Поймал поломку замер соседа, а не гейт.
//
// Цена ошибки здесь несимметрична: скелет кладётся потребителю классом `placed-once` и не
// обновляется НИКОГДА. Строка, уехавшая туда сломанной, чинится только правкой руками в каждом
// уже созданном продукте. Значит хотя бы одна проба обязана вызов ВЫПОЛНИТЬ.
//
// ЧТО ИМЕННО ВЫПОЛНЯЕТСЯ. Не копия вызова, написанная здесь, а ТЕКСТ ИЗ ШАБЛОНА: проба
// достаёт из `template/main.tsx` сам вызов и исполняет его, подавая те же значения, какие
// шаблон получает импортом, — настоящий `checkStyleOrder` из рантайма и настоящую пару из
// стилевого слоя. Копия проверяла бы копию: разъехавшись с шаблоном, она осталась бы зелёной.
//
// ПОЧЕМУ ЗДЕСЬ HAPPY-DOM, А НЕ JSDOM. Проверка спрашивает ВЫЧИСЛЕННОЕ на корне значение, то
// есть ей нужен настоящий каскад, а базовый лист объявляет своё универсальным селектором со
// списком псевдоэлементов (`*, ::before, ::after`). JSDOM такое правило пропускает целиком —
// сверено 2026-08-22 прогоном настоящего `base.css`: на корне остаётся браузерное умолчание,
// и «с базой» покраснело бы по причине, к скелету отношения не имеющей. Happy-dom применяет
// это правило и даёт `border-box` — тот же ответ, что и живой браузер. Пакет только пробный,
// в поставку не едет: обвес везёт пять файлов шаблона и ни одного модуля.
//
// БАЗОВЫЙ ЛИСТ БЕРЁТСЯ ПОРОЖДЕНИЕМ, а не чтением файла с диска: зона значений объявляет
// способность подпутём `/generate`, и порождение отражает ТЕКУЩИЕ исходники, а не прошлую
// сборку. Читая файл, проба судила бы результат последней чужой сборки.

import { checkStyleOrder, type StyleOrderReport } from "@omnifield/probe-web-runtime";
import { BASE_MARKER } from "@omnifield/probe-web-style";
import { baseCss } from "@omnifield/probe-web-style/generate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readTemplate } from "./source.js";

/** Точка входа без строчных комментариев: исполняем КОД, а не пояснение над ним. */
const main = readTemplate("main.tsx").replace(/^\s*\/\/.*$/gm, "");

/**
 * Вызов проверки, ВЫНУТЫЙ ИЗ ШАБЛОНА.
 *
 * Ищем по имени функции и берём выражение целиком, до закрывающей скобки со точкой с запятой.
 * Форму аргумента проба не предполагает — иначе она снова судила бы текст.
 */
const CALL = /checkStyleOrder\s*\([\s\S]*?\)\s*;/.exec(main)?.[0] ?? "";

/**
 * Исполняет вызов из шаблона, подавая ему те же имена, какие шаблон получает импортом.
 *
 * `new Function` здесь не хитрость, а единственный способ выполнить ЧУЖОЙ текст: шаблон не
 * компилируется в этой зоне (он груз, а не исходник) и импортировать его нельзя.
 */
function callFromTemplate(): StyleOrderReport {
  const run = new Function(
    "checkStyleOrder",
    "BASE_MARKER",
    `"use strict"; return (${CALL.replace(/;\s*$/, "")});`,
  ) as (check: typeof checkStyleOrder, marker: typeof BASE_MARKER) => StyleOrderReport;

  return run(checkStyleOrder, BASE_MARKER);
}

/** Настоящий базовый лист — тот самый, который скелет подключает побочкой. */
function givenBase(): void {
  const sheet = document.createElement("style");
  sheet.textContent = baseCss();
  document.head.appendChild(sheet);
}

/** Одетая страница: без неё «базы нет» — законное голое состояние, а не нарушенный порядок. */
function givenDressed(name = "фикстура"): void {
  document.documentElement.setAttribute("data-theme", name);
}

beforeEach(() => {
  document.head.innerHTML = "";
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-skin");
  document.documentElement.className = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("вызов из шаблона выполняется, а не сверяется строкой", () => {
  it("вообще находится в шаблоне", () => {
    // Без этого всё ниже проверяло бы пустоту и было бы зелёным на выброшенном вызове.
    expect(CALL).not.toBe("");
  });

  it("С БАЗОЙ ПРОХОДИТ: настоящий лист приехал — проверка молчит", () => {
    givenBase();
    givenDressed();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Сперва предъявим, что лист ДЕЙСТВИТЕЛЬНО приехал: проверка спрашивает вычисленное
    // значение, и если каскад не сработал, «ok» ниже был бы неправдой о движке, а не о нас.
    expect(getComputedStyle(document.documentElement).getPropertyValue(BASE_MARKER.property)).toBe(
      BASE_MARKER.value,
    );

    const report = callFromTemplate();

    expect(report.status).toBe("ok");
    expect(report.message).toBe("");
    expect(error).not.toHaveBeenCalled();
  });

  it("БЕЗ БАЗЫ КРАСНЕЕТ: оформление стоит, листа нет — сказано вслух", () => {
    givenDressed("фикстура");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Свойство маркера у корня ЕСТЬ и здесь — его объявляет сам браузер своим умолчанием.
    // Проверка «свойство объявлено» на этом месте сказала бы «база приехала».
    const seen = getComputedStyle(document.documentElement).getPropertyValue(BASE_MARKER.property);
    expect(seen).not.toBe(BASE_MARKER.value);

    const report = callFromTemplate();

    expect(report.status).toBe("missing-base");
    expect(report.seen).toBe(seen);
    expect(report.message).toContain("фикстура");
    expect(error).toHaveBeenCalledTimes(1);
  });

  it("голое приложение — не поломка: ни базы, ни оформления, и тишина", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(callFromTemplate().status).toBe("no-skin");
    expect(error).not.toHaveBeenCalled();
  });

  it("не роняет приложение: диагностика вида не имеет на это права", () => {
    givenDressed();
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => callFromTemplate()).not.toThrow();
  });
});

describe("значения приходят импортом, а не литералом", () => {
  it("в вызове нет ни одной строки-литерала", () => {
    // Пара принадлежит стилевому слою и уже переезжала. Литерал в `placed-once`-файле пережил
    // бы переезд молча и начал бы врать — кричать на исправном приложении либо промолчать на
    // сломанном. Проба судит ВЫЗОВ, а не файл: имена своего поставщика потребитель вправе
    // назвать строкой, это его файл и его имена.
    expect(CALL).not.toMatch(/["'`]/);
  });

  it("обе половины пары приезжают одним именем, и половины из него не выковырять", () => {
    // Свойство без ожидаемого значения — проверка, истинная всегда. Форму держит стилевой
    // слой: экспорт ОДИН. Здесь проверяем, что шаблон берёт именно его и целиком.
    expect(CALL).toContain("BASE_MARKER");
    expect(CALL).not.toMatch(/BASE_MARKER\s*\./);
    expect(BASE_MARKER.property.trim()).not.toBe("");
    expect(BASE_MARKER.value.trim()).not.toBe("");
  });
});
