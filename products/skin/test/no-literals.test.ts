// ПРОБА: ни одного литерального значения там, где обязан быть токен.
//
// Правило третье зоны (kb:PROBEWEB-11): цвета, скругления и длительности — только токенами
// слоя `style`. Литерал не переключается вместе с темой: продукт уйдёт в тёмную, а наш кусок
// останется светлым, и прогон об этом промолчит.
//
// Машинная опора у рынка есть — `stylelint-declaration-strict-value`, — но её граница названа
// в выписке: правило ловит литерал и НЕ знает семантики токена. Здесь проверяется то же самое
// плюс то, чего линтер не умеет: перечень известного долга по размерам не должен расти.

import { describe, expect, it } from "vitest";

import { declarations, skinFiles } from "./css.js";

/** Ключевые слова, которые цветом в нашем смысле не являются. */
const COLOR_KEYWORDS_OK = new Set(["transparent", "currentcolor", "inherit", "none", "initial"]);

const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
const TIME_LITERAL = /\b\d+(?:\.\d+)?m?s\b/;
const EASING_LITERAL = /\b(?:cubic-bezier|steps)\(|\b(?:ease|ease-in|ease-out|ease-in-out|linear)\b/;

/** Свойства, где значение обязано быть токеном. */
const COLOR_PROPS = /(?:^|-)color$|^background$|^background-color$|^border(?:-[a-z-]+)?-color$|^outline-color$|^fill$|^stroke$|^box-shadow$/;

/**
 * ШИРИНЫ ПОВЕРХНОСТЕЙ — реестр ПУСТ, и это его рабочее состояние, а не забытая уборка.
 *
 * ЧТО ЗДЕСЬ БЫЛО. Пять литеральных ширин — окно, всплывающая панель, подсказка, меню,
 * уведомление — единственное место, где оформление задавало размер абсолютной единицей. Причина
 * была названа: в базе не было шкалы ширин. Ширину окна можно было получить и кратностью
 * интервалу (`calc(var(--space-32) * 3.5)`) — число вышло бы то же, а связь придуманной: длина
 * строки происходит не от ритма отступов.
 *
 * ЧТО СТАЛО. Заявка (`tasker:PROBEWEB-64`, пункт 2) принята, база завела шкалу читаемой колонки
 * (`--column-*`, имя ступени равно числу знаков), и все пять мест переведены на неё
 * (`tasker:PROBEWEB-73`). Долг закрыт, реестр опустел.
 *
 * ПОЧЕМУ РЕЕСТР ОСТАЛСЯ. Он перестал быть списком долга и стал ЗАМКОМ: пустая запись означает,
 * что абсолютной ширины в оформлении нет ни одной, и любая новая уронит прогон. Удалить механизм
 * вместе с долгом значило бы снять замок в тот момент, когда он наконец начал работать.
 *
 * Появится случай, которому шкала не отвечает, — запись заводится СЮДА, с причиной, и это
 * становится видно на ревью. Исчезнувшая запись тоже роняет пробу (проверка ниже): реестр,
 * разрешающий несуществующее, завтра прикроет настоящее нарушение.
 */
const SURFACE_WIDTHS: Record<string, string> = {};

describe("ни одного литерала там, где обязан быть токен", () => {
  for (const file of skinFiles()) {
    it(`${file.name}: цвета только токенами`, () => {
      const bad = declarations(file.text)
        .filter(({ property, value }) => {
          if (!COLOR_PROPS.test(property) && !/\bcolor\b/.test(property)) return false;
          if (COLOR_KEYWORDS_OK.has(value.toLowerCase())) return false;
          return COLOR_LITERAL.test(value) || /^[a-z]+$/i.test(value.replace(/\s+/g, ""));
        })
        .map(({ property, value }) => `${property}: ${value}`);

      expect(bad, `цветовые литералы в ${file.name}`).toEqual([]);
    });

    it(`${file.name}: скругления только токенами`, () => {
      // Ноль — это СБРОС, а не значение вида: панель внутри общей рамки своего скругления иметь
      // не должна, иначе рамка в рамке. Токена «никакого скругления» не существует и не нужен.
      const bad = declarations(file.text)
        .filter(({ property, value }) => property.includes("border-radius") && !value.includes("var(") && value.trim() !== "0")
        .map(({ property, value }) => `${property}: ${value}`);

      expect(bad, `литеральные скругления в ${file.name}`).toEqual([]);
    });

    it(`${file.name}: длительности и кривые только токенами`, () => {
      const bad = declarations(file.text)
        .filter(({ property, value }) => {
          if (!/^transition|^animation/.test(property)) return false;
          // `calc(var(--motion-slow) * 6)` — токен, умноженный на число: значение всё равно
          // приходит из шкалы, и смена шкалы его подвинет.
          const withoutTokens = value.replaceAll(/var\(\s*--[a-z0-9-]+\s*\)/gi, "");
          return TIME_LITERAL.test(withoutTokens) || EASING_LITERAL.test(withoutTokens);
        })
        .map(({ property, value }) => `${property}: ${value}`);

      expect(bad, `литеральное движение в ${file.name}`).toEqual([]);
    });
  }

  // Размеры — тоже из шкал. Абсолютная единица (`px`, `rem`) в оформлении означает значение
  // мимо шкалы: плотный режим его не сожмёт, смена семени не подвинет, и компонент разъедется
  // с соседями. До приезда шкал интервалов таких значений здесь была четыре десятка; теперь
  // ноль, и проба стережёт, чтобы они не вернулись.
  //
  // ОТНОСИТЕЛЬНЫЕ значения нарушением НЕ считаются и вот почему: `em` следует за кеглем,
  // который сам приходит из шкалы; `%` и `auto` — доля от родителя, то есть раскладка, а не
  // размер; `0` и безразмерные — не значения шкалы вовсе.
  it("ни одного размера абсолютной единицей — всё из шкал", () => {
    const SIZE_PROPS =
      /^(?:padding|margin|gap|font-size|line-height|inline-size|block-size|min-|max-|border-width|outline-width|outline-offset|border$|outline$|top|inset)/;
    const ABSOLUTE = /\b\d*\.?\d+(?:px|rem|pt|cm|mm|in|pc)\b/;

    const bad = skinFiles().flatMap((file) =>
      declarations(file.text)
        .filter(({ property, value }) => {
          if (!SIZE_PROPS.test(property)) return false;
          if (SURFACE_WIDTHS[`${file.name}: ${property}`] !== undefined) return false;
          const withoutTokens = value.replaceAll(/var\(\s*--[a-z0-9-]+[^)]*\)/gi, "");
          return ABSOLUTE.test(withoutTokens);
        })
        .map(({ property, value }) => `${file.name}: ${property}: ${value}`),
    );

    expect(bad, "размеры мимо шкал").toEqual([]);
  });

  it("слои только из шкалы — ни одного z-index числом", () => {
    // Поймано мутацией: `z-index: 40` вместо `var(--z-dialog)` проходил молча, потому что
    // проба размеров про слои ничего не знает. А это ровно тот класс ошибки, ради которого
    // шкала слоёв и вводилась: число из головы спорит с чужими числами, и порядок панелей
    // рушится там, где встретятся два слоя от разных авторов.
    const bad = skinFiles().flatMap((file) =>
      declarations(file.text)
        .filter(({ property, value }) => property === "z-index" && !value.includes("var(--z-"))
        .map(({ property, value }) => `${file.name}: ${property}: ${value}`),
    );

    expect(bad, "слои мимо шкалы").toEqual([]);
  });

  it("список ширин поверхностей не разошёлся с кодом", () => {
    // Запись, под которой в файле уже нет абсолютного значения, — забытая: она молча
    // разрешает то, чего не существует, и завтра прикроет настоящее нарушение.
    const stale = Object.keys(SURFACE_WIDTHS).filter((key) => {
      const [name, property] = key.split(": ");
      const file = skinFiles().find((f) => f.name === name);
      if (!file) return true;
      return !declarations(file.text).some(
        (d) => d.property === property && /\b\d*\.?\d+(?:px|rem)\b/.test(d.value),
      );
    });

    expect(stale, "записи в реестре ширин, которым уже нечего разрешать").toEqual([]);
  });
});
