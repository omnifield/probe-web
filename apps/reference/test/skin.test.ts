// ШОВ СО СКИНОМ — то, чем эта страница одета, и единственный путь, которым вид сюда приходит.
//
// Гейт ступени 2 роадмапа звучит машинно: оформление не берёт из общего листа НИ ОДНОГО
// значения, а всё, что оно адресует, объявляет скин. Обе половины проверяются здесь, и обе — на
// настоящих текстах: лист порождается генератором зоны значений, лист скина — механикой скина.
//
// Чего здесь НЕТ и почему. Вид, порождённый скином, едет в каскадном слое, а слои `jsdom`
// игнорирует целиком — вычисленное значение он вернёт как без скина, и проба была бы зелёной на
// сломанном. Поэтому «страница обязана потерять вид, если снять скин» проверяется живым
// браузером (`tools/live-check/`), а след замера живёт в узле задачи.

import { withPassports } from "@omnifield/probe-web-skin";
import { baseCss } from "@omnifield/probe-web-style/generate";
import { passportOf } from "@omnifield/probe-web-ui/passport";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { dressApp, REFERENCE_SKIN } from "../src/skin";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/** Источник паспортов назван один раз — тем же способом, каким его называет сама страница. */
const { generateSkinCss } = withPassports(passportOf);

/** Текст оформления потребителя — тот самый файл, который уедет в бандл. */
function styling(): string {
  return readFileSync(join(ROOT, "src/app.css"), "utf8");
}

/** Имена, которые файл АДРЕСУЕТ: `var(--имя)`. */
function referenced(css: string): Set<string> {
  return new Set([...css.matchAll(/var\(\s*(--[\w-]+)/g)].map((hit) => hit[1] as string));
}

/** Имена, которые файл ОБЪЯВЛЯЕТ: `--имя: значение`. */
function declared(css: string): Set<string> {
  return new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((hit) => hit[1] as string));
}

describe("значения приходят скином, а не общим листом", () => {
  it("оформление не адресует ни одного имени из общего листа", () => {
    // Лист берётся ПОРОЖДЁННЫМ, а не переписанным перечнем: имена в нём заводит зона значений,
    // и второй копии этого знания здесь быть не должно — она разъехалась бы молча.
    const sheet = declared(baseCss());
    const used = [...referenced(styling())].filter((name) => sheet.has(name));

    expect(used).toEqual([]);
  });

  it("всё, что оформление адресует, объявляет скин", () => {
    // Обратная сторона того же гейта. Без неё «из листа не берём» выполнялось бы и опечаткой:
    // имя, которого не объявляет никто, тоже не из листа — а страница осталась бы без вида.
    const skin = declared(generateSkinCss(REFERENCE_SKIN));
    const orphans = [...referenced(styling())].filter((name) => !skin.has(name));

    expect(orphans).toEqual([]);
  });

  it("скругления посеяны, а не выписаны ступенями", () => {
    // Пересеваемость — то, ради чего семя вообще существует: поменял одно значение, поехал весь
    // вид. Выписанные ступени дали бы тот же кадр и отняли бы это свойство молча.
    const css = generateSkinCss(REFERENCE_SKIN);

    expect(REFERENCE_SKIN.variables?.dimensions).toEqual({ radius: "0.5rem" });
    expect(css).toContain("--radius-md: calc(var(--radius) - 2px)");
    // Запасного значения в ступени скина нет и быть не может: подстраховка — это умолчание в
    // обход скина, ровно тот второй путь, который снимается.
    expect(css).not.toContain("var(--radius,");
  });

  it("скин одевает кнопку рецептом, а не переменными", () => {
    // Половин у скина не бывает: набор значений без единого правила вида — это то, что
    // фреймворк только что перестал возить. Адрес собран из анатомии, руками не написан.
    const css = generateSkinCss(REFERENCE_SKIN);

    expect(css).toContain('[data-scope="button"][data-part="root"]');
    expect(css).toContain("border-radius: var(--app-round)");
  });
});

describe("надевание — механикой скина, тем же путём, что у потребителя", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-skin");
    for (const sheet of document.querySelectorAll("style")) sheet.remove();
  });

  it("после одевания на корне стоит имя скина, а его лист — в документе", async () => {
    const skins = dressApp();

    // `wear()` асинхронен: источник вправе ходить в службу, и механика не делает вид, что это
    // мгновенно. Ждём ответа, а не таймера.
    await skins.names();
    await Promise.resolve();

    expect(document.documentElement.getAttribute("data-skin")).toBe("reference");
    expect(document.documentElement.innerHTML).toContain("--app-round");
  });

  it("скин снимается — имя и лист уходят, остаётся голый кит", async () => {
    const skins = dressApp();
    await skins.names();
    await Promise.resolve();

    skins.takeOff();

    expect(document.documentElement.getAttribute("data-skin")).toBeNull();
    expect(document.documentElement.innerHTML).not.toContain("--app-round");
  });
});
