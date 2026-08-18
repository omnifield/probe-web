import { describe, expect, it } from "vitest";

import {
  DENSITY_CEILING,
  DENSITY_DEFAULT,
  DENSITY_FLOOR,
  DENSITY_NOTE,
  DENSITY_TOKEN,
  DERIVED_SCALES,
  DERIVED_TOKENS,
  FIXED_TOKENS,
  GRID_NOTE,
  GRID_STEP,
  derivedCss,
  stepValue,
  type DerivedScale,
  type DerivedStep,
} from "../src/dimension.js";
import { THEME_META_TOKENS } from "../src/tokens.js";

// Размерные шкалы — гейт того же обещания, что и у цвета: значение выводится из ОДНОГО семени,
// а не набирается россыпью. Россыпь проверить нечем — она просто есть; шкалу проверить можно.
//
// ЧТО ЗДЕСЬ ПРОВЕРЯЕМО, А ЧТО НЕТ. Вычисленных значений у зоны нет: пробы идут в jsdom, а он
// `calc()` с `var()` не считает. Поэтому «плотность поменяла кегль на экране» проверить нечем
// и требовать этого нельзя (`kb:PROBEWEB-16`). Проверяемо другое, и оно проверяется ниже:
// ВЫРАЖЕНИЕ, которое уедет в CSS, и ОТНОШЕНИЯ ступеней, посчитанные из этого же выражения.

const GRID_REM = Number.parseFloat(GRID_STEP);

/** Длина в `rem` или безразмерный множитель — ровно те два вида, что порождает генератор. */
const toRem = (text: string): number => {
  const match = /^(-?[\d.]+)(rem)?$/.exec(text.trim());
  if (!match) throw new Error(`не длина в rem и не множитель: ${text}`);
  return Number(match[1]);
};

/**
 * Считает СГЕНЕРИРОВАННОЕ выражение ступени при заданной плотности.
 *
 * Читает то, что уедет в поставку, а не формулу, переписанную в пробу: иначе проба проверяла бы
 * саму себя и молчала бы ровно тогда, когда выражение перестало округлять. Семантика `round()`,
 * `calc()` и `var()` повторена в том объёме, в котором генератор их порождает.
 *
 * Сторона округления половины совпадает с `Math.round()` намеренно, а не случайно:
 * `round(nearest, …)` уводит ровную середину шага ВВЕРХ (MDN, CSS `round()`, сверено 2026-08-18).
 */
const evaluate = (expr: string, density: number): number => {
  const text = expr.trim();

  const rounded = /^round\(nearest, (.+), ([\d.]+rem)\)$/.exec(text);
  if (rounded) {
    const step = toRem(rounded[2]);
    return Math.round(evaluate(rounded[1], density) / step) * step;
  }

  const product = /^calc\((.+)\)$/.exec(text);
  if (product) {
    return product[1].split(" * ").reduce((acc, term) => acc * evaluate(term, density), 1);
  }

  const reference = /^var\(--([\w-]+), ([^)]+)\)$/.exec(text);
  if (reference) {
    return reference[1] === DENSITY_TOKEN ? density : toRem(reference[2]);
  }

  return toRem(text);
};

/** Значение ступени в `rem` при заданной плотности — из выражения, а не из формулы. */
const valueOf = (scale: DerivedScale, step: DerivedStep, density: number): number =>
  evaluate(stepValue(scale, step), density);

/** Значение ДО округления — им проверяется вывод границы, а не поставка. */
const unrounded = (scale: DerivedScale, factor: number, density: number): number =>
  Number.parseFloat(scale.fallback) * factor * density;

const factorOf = (step: DerivedStep): number => ("factor" in step ? step.factor : Number.NaN);

const scaleBySeed = (seed: string): DerivedScale =>
  DERIVED_SCALES.find((scale) => scale.seed === seed)!;

const stepByName = (scale: DerivedScale, name: string): DerivedStep =>
  scale.steps.find((step) => step.name === name)!;

/** Множители для проб: оба края объявленного диапазона, единица и неудобные середины. */
const MULTIPLIERS = [
  DENSITY_FLOOR,
  0.8,
  0.875,
  0.9,
  Number(DENSITY_DEFAULT),
  1.1,
  1.125,
  1.25,
  4 / 3,
  DENSITY_CEILING,
];

/** На сетке ли значение. Допуск — на двоичную арифметику, а не на «почти попал». */
const onGrid = (value: number): boolean =>
  Math.abs(value / GRID_REM - Math.round(value / GRID_REM)) < 1e-9;

describe("производные шкалы", () => {
  it("каждая ступень выведена из семени и несёт его значение по умолчанию", () => {
    for (const scale of DERIVED_SCALES) {
      for (const step of scale.steps) {
        const value = stepValue(scale, step);
        if ("value" in step) continue; // литерал вроде `9999px` — не производная
        expect(value, `--${step.name}`).toContain(`var(--${scale.seed}, ${scale.fallback})`);
      }
    }
  });

  it("семя каждой шкалы объявлено контрактом темы", () => {
    // Иначе шкала считается от токена, которого в контракте нет: тема его не задаст, и
    // работать всё будет только на подставленном по умолчанию значении.
    for (const scale of DERIVED_SCALES) {
      expect(THEME_META_TOKENS, `семя --${scale.seed}`).toContain(scale.seed);
    }
  });

  it("ни один токен не объявлен дважды", () => {
    const names = [...DERIVED_TOKENS, ...FIXED_TOKENS.map((token) => token.name)];
    expect(names.length).toBe(new Set(names).size);
  });

  it("семя не объявлено ступенью самого себя — это цикл, и браузер такое свойство отменяет", () => {
    for (const scale of DERIVED_SCALES) {
      expect(DERIVED_TOKENS, `семя --${scale.seed}`).not.toContain(scale.seed);
    }
  });

  it("имя ступени интервалов равно её множителю", () => {
    // Считается из ДАННЫХ шкалы, а не сверяется со списком в пробе: список пришлось бы
    // править вместе со шкалой, и он подтверждал бы сам себя. Порядковое имя было причиной,
    // по которой ступень нельзя вставить, — теперь вставлять ничто не мешает
    // (`kb:PROBEWEB-16`, часть Б).
    const space = scaleBySeed("space");
    for (const step of space.steps) {
      expect(step.name, `ступень ${step.name}`).toBe(`space-${factorOf(step)}`);
    }
  });

  it("состав ступеней интервалов не менялся — переименование не добавляет и не убирает", () => {
    // Здесь список УМЕСТЕН: это контракт того, что уезжает потребителю, а не пересказ данных.
    // Переименование обязано быть переименованием, а не тихой правкой набора ступеней.
    const space = scaleBySeed("space");
    expect(space.steps.map(factorOf)).toEqual([1, 2, 3, 4, 6, 8, 12, 16, 24, 32]);
  });

  it("шкалы растут по ступеням, а не как придётся", () => {
    for (const scale of DERIVED_SCALES) {
      const factors = scale.steps.flatMap((step) => ("factor" in step ? [step.factor] : []));
      expect([...factors].sort((a, b) => a - b), `шкала ${scale.seed}`).toEqual(factors);
    }
  });

  it("у каждой шкалы объявлено основание шага", () => {
    // Рынок публикует значения и почти нигде не говорит, ПОЧЕМУ шаг такой
    // (`canons/ui-skin/gaps/scale-step-basis-and-rhythm.md`). Здесь основание — поле, а не
    // фраза в чьей-то голове.
    for (const scale of DERIVED_SCALES) expect(scale.basis.length).toBeGreaterThan(20);
  });

  it("основание плотной шкалы говорит про сетку 0.25rem, а не про пиксели", () => {
    // `basis` уезжает комментарием в поставку. «Сетка 4px» при корневом кегле ≠ 16px —
    // неправда, а комментарий в поставке обязан говорить правду.
    for (const scale of DERIVED_SCALES.filter((item) => item.density)) {
      // `\w` кириллицу не берёт — отсюда `\S*` вместо привычного `\w+`.
      expect(scale.basis, `основание ${scale.seed}`).toMatch(/сетк\S* 0\.25rem/);
      expect(scale.basis, `основание ${scale.seed} в пикселях`).not.toMatch(/\d+px/);
    }
  });
});

describe("ось плотности", () => {
  const byDensity = (want: boolean): string[] =>
    DERIVED_SCALES.filter((scale) => scale.density === want).map((scale) => scale.seed);

  it("умножает интервалы, высоты контролов и кегль", () => {
    expect(byDensity(true).sort()).toEqual(["control-height", "font-size", "space"]);
  });

  it("НЕ трогает форму — скругления, толщины границ и трекинг", () => {
    // Плотность — равномерное изменение всей ВЕЩИ, а форма при этом не меняется: скругление
    // и толщина границы это не размер, а очертание.
    expect(byDensity(false).sort()).toEqual(["border-width", "radius", "tracking"]);
  });

  it("ось объявлена в CSS со значением по умолчанию", () => {
    expect(derivedCss()).toContain(`--${DENSITY_TOKEN}: ${DENSITY_DEFAULT};`);
  });

  it("ступени плотных шкал ссылаются на ось, остальные — нет", () => {
    for (const scale of DERIVED_SCALES) {
      for (const step of scale.steps) {
        if ("value" in step) continue;
        const uses = stepValue(scale, step).includes(`var(--${DENSITY_TOKEN}`);
        expect(uses, `--${step.name}`).toBe(scale.density);
      }
    }
  });

  it("кегль участвует в оси — это видно в выражении каждой его ступени", () => {
    // Вычисленный кегль в jsdom не проверить: `calc()` с `var()` тут не считается. Проверяемо
    // выражение — оно и уезжает в поставку.
    const font = scaleBySeed("font-size");
    for (const step of font.steps) {
      expect(stepValue(font, step), `--${step.name}`).toContain(`var(--${DENSITY_TOKEN}`);
    }
  });

  it("кегль едет плотностью ровно, без потерь на отношениях", () => {
    // Второе проверяемое — отношения ступеней. Они обязаны остаться теми же при любой
    // плотности: кегль задан отношениями к базовому, и множитель их не переписывает.
    const font = scaleBySeed("font-size");
    const base = stepByName(font, "font-size-md");

    for (const density of MULTIPLIERS) {
      for (const step of font.steps) {
        const ratio = valueOf(font, step, density) / valueOf(font, base, density);
        expect(ratio, `--${step.name} при плотности ${density}`).toBeCloseTo(factorOf(step), 10);
      }
    }
  });

  it("основание оси описывает то, что ось делает на самом деле", () => {
    // `DENSITY_NOTE` уезжает комментарием в поставку. Основание, оставшееся врать, хуже
    // отсутствующего — поэтому перечень в тексте сверяется с данными, а не с памятью.
    const title: Record<string, string> = {
      space: "интервалы",
      "control-height": "высоты контролов",
      "font-size": "кегль",
      radius: "скругления",
      "border-width": "толщины границ",
      tracking: "трекинг",
    };
    // Сверяется именно ПЕРЕЧЕНЬ, а не текст целиком: слово «кегль» встречается в основании и
    // в разборе прежней причины, и проверка «слово есть где-то» пропустила бы перечень, из
    // которого кегль выпал.
    const moves = DENSITY_NOTE.split("Умножает:")[1]?.split("Форму она не трогает")[0] ?? "";
    const keeps = DENSITY_NOTE.split("Форму она не трогает")[1] ?? "";
    expect(moves, "в основании нет перечня того, что ось умножает").not.toBe("");
    expect(keeps, "в основании нет части про то, чего ось не трогает").not.toBe("");

    for (const scale of DERIVED_SCALES) {
      const name = title[scale.seed];
      expect(name, `у шкалы ${scale.seed} нет человеческого имени в пробе`).toBeDefined();
      if (scale.density) {
        expect(moves, `${name} — ось умножает, а основание молчит`).toContain(name);
      } else {
        expect(keeps, `${name} — ось не трогает, а основание не говорит`).toContain(name);
        expect(moves, `${name} назван среди умножаемого`).not.toContain(name);
      }
    }
  });

  it("разворот прежнего основания объявлен, а не совершён молча", () => {
    // Раньше здесь стояло обратное: «кегль НЕ трогаем, иначе 1.4.4 Resize Text». Разворот
    // законен, но он обязан приехать в поставку вместе со своей причиной.
    expect(DENSITY_NOTE).toMatch(/Прежнее основание/);
    expect(DENSITY_NOTE).toMatch(/1\.4\.4/);
    expect(DENSITY_NOTE).not.toMatch(/[Кк]егль она НЕ трогает/);
  });
});

describe("сетка 0.25rem", () => {
  const snapped = DERIVED_SCALES.filter((scale) => scale.snap);

  it("на сетку садится ровно то, что должно", () => {
    // Перечень ЯВНЫЙ, а не «те, у кого стоит поле»: иначе снятый флаг просто сузил бы область
    // остальных проб, и шкала уехала бы с сетки при зелёном прогоне.
    expect(snapped.map((scale) => scale.seed).sort()).toEqual(["control-height", "space"]);
  });

  it("на сетку садится только то, что умножается плотностью", () => {
    // Неплотной шкале садиться некуда: её значения не съезжают. Округлять их значило бы
    // объявить сетку там, где её нет.
    for (const scale of DERIVED_SCALES) {
      if (scale.snap) expect(scale.density, `шкала ${scale.seed}`).toBe(true);
    }
  });

  it("выражение ступени возвращает значение на сетку", () => {
    for (const scale of snapped) {
      for (const step of scale.steps) {
        expect(stepValue(scale, step), `--${step.name}`).toMatch(
          new RegExp(`^round\\(nearest, .+, ${GRID_STEP.replace(".", "\\.")}\\)$`),
        );
      }
    }
  });

  it("значения попадают на сетку при множителях по краям и в середине диапазона", () => {
    for (const scale of snapped) {
      for (const step of scale.steps) {
        for (const density of MULTIPLIERS) {
          const value = valueOf(scale, step, density);
          expect(onGrid(value), `--${step.name} при плотности ${density} = ${value}rem`).toBe(true);
        }
      }
    }
  });

  it("законен ЛЮБОЙ множитель из диапазона, а не набор ступеней", () => {
    // Подтверждение данными к тому, что объявлено полем `continuous` в `AXES`: «правильных»
    // ступеней у базы нет. Множители нарочно неудобные — непериодические и с длинным хвостом;
    // если бы база втайне ждала «свои» значения, на них бы это и вылезло.
    const awkward = [0.7654321, 0.8137, 1 / 3 + 0.7, 1.0101, Math.PI / 2.5, DENSITY_CEILING - 1e-9];
    const control = scaleBySeed("control-height");
    const smallest = stepByName(control, "control-height-sm");
    const minRem = Number.parseFloat(
      FIXED_TOKENS.find((token) => token.name === "control-target-min")!.value,
    );

    for (const density of awkward) {
      expect(density, "множитель взят из объявленного диапазона").toBeGreaterThanOrEqual(
        DENSITY_FLOOR,
      );
      for (const scale of DERIVED_SCALES.filter((item) => item.snap)) {
        for (const step of scale.steps) {
          const value = valueOf(scale, step, density);
          expect(onGrid(value), `--${step.name} при плотности ${density} = ${value}rem`).toBe(true);
        }
      }
      expect(valueOf(control, smallest, density), `норма при плотности ${density}`,
      ).toBeGreaterThanOrEqual(minRem);
    }
  });

  it("сетка не переворачивает шкалу — ступени не убывают", () => {
    // Соседние ступени на низкой плотности могут сойтись в одно значение: это цена сетки, и
    // она приемлема для ритма. Чего быть не может — старшая ступень мельче младшей.
    for (const scale of snapped) {
      for (const density of MULTIPLIERS) {
        const values = scale.steps.map((step) => valueOf(scale, step, density));
        expect([...values].sort((a, b) => a - b), `${scale.seed} при плотности ${density}`).toEqual(
          values,
        );
      }
    }
  });

  it("сетка схлопнула бы шкалу кегля — потому кегль на неё и не садится", () => {
    // Причина исключения проверяемая, а не вкусовая, и держится пробой: при плотности 1 —
    // у всех, кто плотность не трогал вовсе, — шкала потеряла бы две ступени.
    const font = scaleBySeed("font-size");
    const toGrid = (value: number): number => Math.round(value / GRID_REM) * GRID_REM;
    const at = (name: string): number => toGrid(valueOf(font, stepByName(font, name), 1));

    expect(at("font-size-sm")).toBe(at("font-size-md"));
    expect(at("font-size-lg")).toBe(at("font-size-xl"));
    expect(new Set(font.steps.map((step) => toGrid(valueOf(font, step, 1)))).size).toBeLessThan(
      font.steps.length,
    );
  });

  it("сетка объявлена в поставке вместе с причиной", () => {
    expect(derivedCss()).toContain(GRID_NOTE);
  });
});

describe("границы оси", () => {
  const control = scaleBySeed("control-height");
  const smallest = stepByName(control, "control-height-sm");
  const targetMin = FIXED_TOKENS.find((token) => token.name === "control-target-min")!;
  const minRem = Number.parseFloat(targetMin.value);

  it("порог нормы лежит на сетке — потому округление и не может его пробить", () => {
    // Ключ всего вывода: `round(nearest, …)` монотонна, а 1.5rem = 6 × 0.25rem. Значит любое
    // значение не ниже порога остаётся не ниже него и после округления.
    expect(onGrid(minRem)).toBe(true);
  });

  it("нижняя граница выведена из нормы и держится ПОСЛЕ округления", () => {
    // При плотности `d` нижняя ступень контрола обязана остаться не ниже минимального размера
    // цели 24×24 CSS-пикселя (WCAG 2.2, 2.5.8 Target Size (Minimum), AA).
    expect(valueOf(control, smallest, DENSITY_FLOOR)).toBeCloseTo(minRem, 10);
    for (const density of MULTIPLIERS) {
      expect(
        valueOf(control, smallest, density),
        `нижняя ступень контрола при плотности ${density}`,
      ).toBeGreaterThanOrEqual(minRem);
    }
  });

  it("округление съедает запас, но не норму", () => {
    // Потеря — до половины шага, 0.125rem: при 0.8 ступень 1.6rem садится ровно на минимум.
    // Это и есть «с учётом потери»: запаса не остаётся, нормы не теряем.
    expect(unrounded(control, factorOf(smallest), 0.8)).toBeCloseTo(1.6, 10);
    expect(valueOf(control, smallest, 0.8)).toBeCloseTo(minRem, 10);
  });

  it("ниже границы норма нарушается ДО округления — пол держится по обе стороны", () => {
    // Формально норму удержало бы и 0.6875: 1.375rem — ровно середина шага, а её округление
    // уводит вверх, до 1.5rem. Но тогда норму держит сторона округления, а не геометрия:
    // объявленная высота 22px, поставленная 24px. Пол обязан держаться и без округления.
    expect(unrounded(control, factorOf(smallest), DENSITY_FLOOR)).toBeCloseTo(minRem, 10);
    expect(unrounded(control, factorOf(smallest), DENSITY_FLOOR - 0.01)).toBeLessThan(minRem);
  });

  it("потолок назван пределом поддержки, а не требованием доступности", () => {
    // По норме крупнее не хуже: ни 2.5.8, ни 1.4.4 множителем больше единицы не нарушаются.
    // Потолок ограничивает наши обещания и наши пробы, и в поставке сказано именно это.
    expect(DENSITY_CEILING).toBeGreaterThan(Number(DENSITY_DEFAULT));
    expect(MULTIPLIERS).toContain(DENSITY_CEILING);
    expect(MULTIPLIERS).toContain(DENSITY_FLOOR);
    expect(derivedCss()).toContain("ПРЕДЕЛ ПОДДЕРЖКИ");
  });

  it("обе границы объявлены в поставке числами", () => {
    const css = derivedCss();
    expect(css).toContain(`Нижняя граница — ${DENSITY_FLOOR}`);
    expect(css).toContain(`Верхняя — ${DENSITY_CEILING}`);
  });
});

describe("токены без шкалы", () => {
  it("высота строки безразмерна — она множитель кегля, а не длина", () => {
    for (const token of FIXED_TOKENS.filter((item) => item.name.startsWith("leading-"))) {
      expect(token.value, token.name).toMatch(/^\d+(\.\d+)?$/);
    }
  });

  it("начертания — числовой ряд нормы (CSS Fonts 4, §2.3)", () => {
    const weights = FIXED_TOKENS.filter((token) => token.name.startsWith("weight-")).map(
      (token) => Number(token.value),
    );
    expect(weights).toEqual([400, 500, 600, 700]);
  });

  it("минимальный размер цели назван нормой и ничем не масштабируется", () => {
    const target = FIXED_TOKENS.find((token) => token.name === "control-target-min")!;
    expect(target.note).toMatch(/2\.5\.8/);
    expect(DERIVED_TOKENS).not.toContain("control-target-min");
  });
});
