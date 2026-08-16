// ПРОБА: обе темы дают РАЗНЫЙ вид на одном и том же примитиве.
//
// Это главная проба против тихой поломки «тема переключилась, а кусок остался прежним». Она же
// — та, которой у рынка нет: механизмы (снимки, линтеры) есть, объявленного средства именно под
// вопрос «различается ли вид между темами» никто не декларирует
// (`canons/ui-skin/gaps/hard-visual-proofs.md`).
//
// Как проверяем без браузера. Вид примитива различается тогда и только тогда, когда он читает
// хотя бы один токен, значение которого в светлой и тёмной паре РАЗНОЕ. Значение берём не из
// своих ожиданий, а проходом по той же цепочке, по которой пойдёт браузер: роль базового слоя
// → ступень шкалы → значение в теме.

import { describe, expect, it } from "vitest";

import { deprecatedTokens, resolveToken, roleLinks, skinFiles, themeValues, usedTokens } from "./css.js";

const light = themeValues(":root");
const dark = themeValues(".dark");
const roles = roleLinks();
const deprecated = deprecatedTokens();

/**
 * Файлы, которые НАСЛЕДУЮТ цвет вместо того, чтобы назначать его, и почему.
 *
 * Запись сюда — утверждение о примитиве, а не способ обойти пробу: проба отдельно проверяет,
 * что `currentColor` в файле действительно есть.
 */
const INHERITS_COLOR: Record<string, string> = {
  "spinner.css":
    "кольцо рисуется currentColor — цвет приходит от места установки (кнопка, текст, поле), " +
    "и вместе с темой меняется через наследование",
};

/** Токен различается между парами, если различаются значения на конце его цепочки. */
function differsBetweenThemes(name: string): boolean {
  const a = resolveToken(name, ":root");
  const b = resolveToken(name, ".dark");
  return a !== undefined && b !== undefined && a !== b;
}

describe("обе темы дают разный вид", () => {
  it("тема слоя style прочитана и содержит обе пары ступеней", () => {
    expect(light.size).toBeGreaterThan(0);
    expect(dark.size).toBeGreaterThan(0);
  });

  it("в теме вообще есть различающиеся ступени", () => {
    // Если это упадёт — сломана тема, а не оформление. Отдельная проба, чтобы причина не
    // приезжала под видом нашей поломки.
    const differing = [...light.keys()].filter((n) => dark.has(n) && light.get(n) !== dark.get(n));
    expect(differing.length).toBeGreaterThan(0);
  });

  for (const file of skinFiles()) {
    if (file.name === "base.css") continue;

    it(`${file.name}: читает хотя бы один токен, меняющийся вместе с темой`, () => {
      const used = [...usedTokens(file.text)];
      const differing = used.filter((name) => differsBetweenThemes(name));

      // Исключение — и оно ИМЕННОЕ, а не общее послабление: примитив, который рисуется
      // `currentColor`, наследует цвет от места установки и меняется вместе с темой через
      // наследование. Ослабить пробу для всех значило бы разрешить забыть про тему везде.
      const inheritsColor = INHERITS_COLOR[file.name] !== undefined;
      if (inheritsColor) {
        expect(
          file.text.includes("currentColor"),
          `${file.name} числится наследующим цвет, но currentColor в нём нет — запись устарела`,
        ).toBe(true);
        return;
      }

      expect(
        differing.length,
        `${file.name} не читает ни одного токена, который меняется вместе с темой. ` +
          `Использованы: ${used.join(", ") || "нет вовсе"}. ` +
          `Такой примитив выглядит одинаково в светлой и тёмной паре.`,
      ).toBeGreaterThan(0);
    });

    it(`${file.name}: все прочитанные токены существуют в слое style`, () => {
      // Опечатка в имени не роняет страницу: неразрешённый `var()` делает свойство
      // недействительным, и браузер молча берёт свой дефолт. Ровно поэтому проверяем текстом.
      const SEEDS = new Set(["--radius", "--space", "--font-size", "--control-height", "--border-width", "--tracking", "--density"]);
      const unknown = [...usedTokens(file.text)].filter(
        (name) => !roles.has(name) && !light.has(name) && !SEEDS.has(name),
      );

      expect(unknown, `токены, которых нет в слое style (${file.name})`).toEqual([]);
    });

    it(`${file.name}: не цепляется за имена, объявленные устаревшими`, () => {
      // База сохранила прежний плоский набор псевдонимами и обещала снять их мажором. Взяв
      // такое имя, оформление уедет вместе с ним — и узнает об этом при обновлении базы.
      const stale = [...usedTokens(file.text)].filter((name) => deprecated.has(name));

      expect(stale, `устаревшие имена токенов в ${file.name}`).toEqual([]);
    });
  }

  it("роли базового слоя прочитаны, и список устаревших не пуст", () => {
    // Обе проверки выше опираются на разбор чужого файла: если он сменит форму, пробы обязаны
    // упасть здесь, а не молча начать всё пропускать.
    expect(roles.size).toBeGreaterThan(0);
    expect(deprecated.size).toBeGreaterThan(0);
  });
});
