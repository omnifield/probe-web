import { describe, expect, it } from "vitest";

import { axisOf } from "../src/axes.js";
import { SIZE_SEEDS } from "./helpers/seeds.js";
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
  ROUND_FALLBACK_NOTE,
  ROUND_SUPPORT_TEST,
  type DerivedScale,
  type DerivedStep,
} from "../src/dimension.js";

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

  const reference = /^var\(--([\w-]+)\)$/.exec(text);
  if (reference) {
    return reference[1] === DENSITY_TOKEN ? density : toRem(SIZE_SEEDS[reference[1]]!);
  }

  return toRem(text);
};

/**
 * Собиратель значения ступени — ИНСТРУМЕНТ ПРОБ, а не поверхность зоны.
 *
 * Такой же жил в зоне (`stepValue`, `snappedValue`) и печатал в базовый слой. Печатать некому:
 * лист везёт один сброс, ступени печатает СКИН своим кодом. Замер показал, что наш и его
 * собиратели совпадали алгоритмом и расходились одним — наш подставлял запасное значение в
 * `var()`. Держать вторую копию печатающего значило бы разъехаться с ним на первой правке.
 *
 * Здесь он остался как инструмент: обязательства ниже — про ЧИСЛА (отношения ряда, пол нормы,
 * посадка на сетку), а числа берутся из выражения, а не из формулы, — иначе проба проверяла бы
 * саму себя.
 */
const stepValue = (scale: DerivedScale, step: DerivedStep): string => {
  if ("value" in step) return step.value;

  const seed = `var(--${scale.seed})`;
  if ("offset" in step) return step.offset ? `calc(${seed} ${step.offset})` : seed;

  const parts = [seed];
  if (step.factor !== 1) parts.push(String(step.factor));
  if (scale.density) parts.push(`var(--${DENSITY_TOKEN})`);
  return parts.length === 1 ? seed : `calc(${parts.join(" * ")})`;
};

const snappedValue = (scale: DerivedScale, step: DerivedStep): string | null =>
  scale.snap ? `round(nearest, ${stepValue(scale, step)}, ${GRID_STEP})` : null;

/**
 * Выражение, которое достаётся браузеру С поддержкой `round()`: второе объявление, если оно
 * есть, иначе единственное. Это и есть «поставляемое значение» для всех проб ниже.
 */
const deliveredValue = (scale: DerivedScale, step: DerivedStep): string =>
  snappedValue(scale, step) ?? stepValue(scale, step);

/** Значение ступени в `rem` при заданной плотности — из выражения, а не из формулы. */
const valueOf = (scale: DerivedScale, step: DerivedStep, density: number): number =>
  evaluate(deliveredValue(scale, step), density);

/** То же, но из ПЕРВОГО объявления — что получает браузер без `round()`. */
const fallbackOf = (scale: DerivedScale, step: DerivedStep, density: number): number =>
  evaluate(stepValue(scale, step), density);

/** Значение ДО округления — им проверяется вывод границы, а не поставка. */
const unrounded = (scale: DerivedScale, factor: number, density: number): number =>
  Number.parseFloat(SIZE_SEEDS[scale.seed]!) * factor * density;

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
        expect(value, `--${step.name}`).toContain(`var(--${scale.seed})`);
      }
    }
  });

  it("у каждой шкалы объявлено семя, и оно одно на шкалу", () => {
    // Прежде проверялось, что семя входит в контракт ТЕМЫ. Контракта нет — тема как единица
    // отменена (`PWEB-66`). Обязательство осталось про сами данные: шкала называет своё семя,
    // и два семени не совпадают, иначе одна шкала молча правила бы другую.
    const seeds = DERIVED_SCALES.map((scale) => scale.seed);
    for (const seed of seeds) expect(seed, "у шкалы нет семени").toBeTruthy();
    expect(new Set(seeds).size, "два семени совпали").toBe(seeds.length);
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

  it("умножает интервалы, высоты контролов, кегль и ширины колонок", () => {
    expect(byDensity(true).sort()).toEqual(["column", "control-height", "font-size", "space"]);
  });

  it("НЕ трогает форму — скругления, толщины границ и трекинг", () => {
    // Плотность — равномерное изменение всей ВЕЩИ, а форма при этом не меняется: скругление
    // и толщина границы это не размер, а очертание.
    expect(byDensity(false).sort()).toEqual(["border-width", "radius", "tracking"]);
  });

  it("имя оси и её умолчание объявлены ДАННЫМИ — печатает их тот, кому нужна шкала", () => {
    // Прежде проверялось, что ось объявлена в нашем листе. Лист печатает только сброс
    // (`PWEB-66`), а имя оси и умолчание остались на поверхности: из них печатает скин.
    // Обязательство «умолчание есть, и оно одно» никуда не делось — спрашивается прямее.
    expect(DENSITY_TOKEN).toBeTruthy();
    expect(DENSITY_TOKEN.startsWith("--"), "имя оси хранится без дефисов").toBe(false);
    expect(Number(DENSITY_DEFAULT)).toBeGreaterThan(0);
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
      column: "ширины колонок",
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
    expect(snapped.map((scale) => scale.seed).sort()).toEqual(["column", "control-height", "space"]);
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
        expect(snappedValue(scale, step), `--${step.name}`).toMatch(
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

  it("посадка на сетку законна только там, где она не схлопывает ступени", () => {
    // Общее правило, из которого исключение кегля — частный случай (`kb:PROBEWEB-16`): сетка
    // держит геометрию и разрушает шкалы, чьи ступени сравнимы с её шагом. Проверяется при
    // плотности 1 — в умолчании, у всех; схождение на КРАЮ диапазона это цена сетки и
    // отдельная проба ниже.
    for (const scale of snapped) {
      const values = scale.steps.map((step) => valueOf(scale, step, 1));
      expect(new Set(values).size, `шкала ${scale.seed} при плотности 1`).toBe(scale.steps.length);
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

  it("у сетки названа причина, и она живёт данными", () => {
    // Причина копировалась комментарием в наш лист; печати нет, но объяснение исчезнуть не
    // должно — иначе следующий печатающий посадит на сетку то, что сажать нельзя.
    expect(GRID_NOTE).toContain(GRID_STEP);
    expect(GRID_NOTE.length, "причина сетки пуста").toBeGreaterThan(40);
  });
});

describe("подстраховка round(): данные остались, печать ушла", () => {
  // Браузер без `round()` не ухудшает геометрию, а ТЕРЯЕТ её: недействительное значение делает
  // свойство невычислимым. Поэтому значение печатается ДВАЖДЫ, и порядок объявлений — часть
  // решения, а не оформление (`kb:PROBEWEB-16`; `tasker:PROBEWEB-63`).
  //
  // ПОРЯДОК ТЕПЕРЬ НЕ НАШ. Лист печатает только сброс (`PWEB-66`), шкалы печатает скин — там же
  // и обязан стеречься порядок блоков, в зоне печатающего. Здесь остаётся то, без чего он
  // этого не сделает: две РАЗНЫЕ формы значения на каждую посаженную ступень и условие, по
  // которому между ними выбирают.
  //
  // Разделение проверяемо с обеих сторон: сотри форму — краснеет здесь; переставь блоки при
  // печати — краснеет у печатающего.

  const snappedSteps = DERIVED_SCALES.filter((scale) => scale.snap).flatMap((scale) =>
    scale.steps.map((step) => ({ scale, step })),
  );

  it("у каждой посаженной ступени ДВЕ формы: без округления и с ним", () => {
    expect(snappedSteps.length, "посаженных ступеней нет вовсе").toBeGreaterThan(10);

    for (const { scale, step } of snappedSteps) {
      const fallback = stepValue(scale, step);
      const snapped = snappedValue(scale, step);

      expect(fallback, `подстраховка --${step.name} округляет`).not.toContain("round(");
      expect(snapped, `посадки на сетку у --${step.name} нет`).not.toBeNull();
      expect(snapped as string, `посадка --${step.name} не округляет`).toContain("round(");
      expect(snapped).not.toBe(fallback);
    }
  });

  it("перечень посаженных считается из данных, а не ведётся вторым списком", () => {
    // Шкала, у которой сняли `snap`, теряет вторую форму — а не остаётся сиротой, которую
    // никто не заметит.
    for (const scale of DERIVED_SCALES) {
      if (scale.snap) continue;
      for (const step of scale.steps) {
        expect(snappedValue(scale, step), `шкала ${scale.seed} без snap`).toBeNull();
      }
    }
  });

  it("проверяется именно `round()` и в том виде, в каком он используется", () => {
    // Условие обязано ловить ту самую возможность, а не соседнюю: проба на `calc()` или на
    // «математические функции вообще» включала бы подстраховку не по тому признаку.
    expect(ROUND_SUPPORT_TEST).toContain(GRID_STEP);

    const tested = /^\(([\w-]+): ([a-z]+)\(nearest, /.exec(ROUND_SUPPORT_TEST);
    expect(tested, `условие не проверяет функцию со стратегией nearest: ${ROUND_SUPPORT_TEST}`)
      .not.toBeNull();

    // Кастомное свойство принимает почти любой поток токенов — такая проба истинна всегда.
    expect(tested![1].startsWith("--"), "проба стоит на кастомном свойстве").toBe(false);
    // Объявление с `var()` считается действительным на разборе — проба снова была бы вечной.
    expect(ROUND_SUPPORT_TEST, "в пробе есть var()").not.toContain("var(");

    // И это ровно та функция, которой пользуются ступени.
    const used = snappedValue(snappedSteps[0].scale, snappedSteps[0].step) as string;
    expect(used).toContain(`${tested![2]}(nearest,`);
  });

  it("подстраховка сохраняет отношения ступеней — она значение, а не заглушка", () => {
    // Без округления ступень остаётся произведением семени, множителя и плотности. Значит
    // отношения ряда целы: вид у браузера без `round()` не садится на сетку, но остаётся
    // тем же видом, а не набором случайных чисел.
    for (const scale of DERIVED_SCALES.filter((item) => item.snap)) {
      const first = scale.steps[0];
      for (const density of MULTIPLIERS) {
        for (const step of scale.steps) {
          const ratio = fallbackOf(scale, step, density) / fallbackOf(scale, first, density);
          expect(ratio, `--${step.name} при плотности ${density}`).toBeCloseTo(
            factorOf(step) / factorOf(first),
            10,
          );
        }
      }
    }
  });

  it("пол оси не пересматривается: без округления норма тоже держится", () => {
    // Там, где округления нет, значение не может оказаться НИЖЕ выведенного порога: округление
    // вниз съедало запас, а без него запас остаётся. `DENSITY_FLOOR` вычислен после округления
    // и потому строже — подстраховка его не трогает (`tasker:PROBEWEB-63`, «Границы»).
    const control = scaleBySeed("control-height");
    const smallest = stepByName(control, "control-height-sm");
    const minRem = Number.parseFloat(
      FIXED_TOKENS.find((token) => token.name === "control-target-min")!.value,
    );

    for (const density of MULTIPLIERS) {
      expect(
        fallbackOf(control, smallest, density),
        `подстраховка нижней ступени контрола при плотности ${density}`,
      ).toBeGreaterThanOrEqual(minRem);
    }
  });

  it("в умолчании браузер без `round()` не расходится с остальными ни на пиксель", () => {
    // Семена и множители подобраны так, что при плотности 1 значение уже лежит на сетке.
    // Отсюда честная граница риска: подстраховка видна только тому, кто крутил плотность.
    for (const { scale, step } of snappedSteps) {
      expect(fallbackOf(scale, step, 1), `--${step.name} при плотности 1`).toBeCloseTo(
        valueOf(scale, step, 1),
        10,
      );
    }
  });

  it("причина подстраховки названа данными, а не комментарием в чужом файле", () => {
    expect(ROUND_FALLBACK_NOTE.length, "причина подстраховки пуста").toBeGreaterThan(40);
  });
});

describe("шкала ширин поверхностей", () => {
  const column = scaleBySeed("column");

  /** Ширина ступени в знаках при заданной плотности — то, чем шкала и задана. */
  const glyphs = (name: string, density: number): number =>
    valueOf(column, stepByName(column, name), density) /
    (Number.parseFloat(SIZE_SEEDS[column.seed]!) * density);

  it("имя ступени равно числу знаков", () => {
    // Считается из данных, как у интервалов: имя, которое не равно множителю, — это имя,
    // которое врёт, и врать оно начинает молча.
    for (const step of column.steps) {
      expect(step.name, `ступень ${step.name}`).toBe(`column-${factorOf(step)}`);
    }
  });

  it("основание — читаемая колонка, а не кратность интервалу", () => {
    // Требование `kb:PROBEWEB-16`: основание, взятое у соседней шкалы ради красоты вывода, —
    // фикция, только записанная. `basis` уезжает комментарием в поставку.
    expect(column.basis).toMatch(/читаемая колонка/);
    expect(column.basis).toMatch(/знак/);
    expect(column.basis).not.toMatch(/space|интервал\w* кратн/);
    // Потолок колонки назван нормой честно — он AAA и он про длину строки, а не про семя.
    expect(column.basis).toMatch(/1\.4\.8/);
  });

  it("колонка держит число знаков на любой плотности", () => {
    // Смысл `density: true` у этой шкалы: кегль едет плотностью, и не поехала бы за ним
    // колонка — в ту же ширину влезало бы больше знаков, чем названо в имени ступени.
    for (const density of MULTIPLIERS) {
      for (const step of column.steps) {
        // Допуск — половина знака: столько может съесть посадка на сетку (0.125rem), и это
        // единственное расхождение, которое здесь законно.
        expect(glyphs(step.name, density), `--${step.name} при плотности ${density}`).toBeCloseTo(
          factorOf(step),
          0,
        );
      }
    }
  });

  it("ряд ровный — ни одна ступень не подогнана под случай", () => {
    // Шаг лестницы одинаков по всей длине. Ступень, стоящая ближе соседей, — это ступень,
    // заведённая ради одного места; такая шкала перестаёт быть шкалой на втором случае.
    const steps = column.steps.map(factorOf);
    const gaps = steps.slice(1).map((value, index) => value - steps[index]);
    expect(new Set(gaps).size, `шаги ряда: ${gaps.join("·")}`).toBe(1);
  });

  it("верхняя ступень укладывается в потолок нормы по длине строки", () => {
    // 1.4.8 Visual Presentation (AAA): строка не длиннее 80 знаков. Это ПОТОЛОК, а не наш ряд:
    // из нормы он не выводится, но выходить за неё не должен.
    expect(Math.max(...column.steps.map(factorOf))).toBeLessThanOrEqual(80);
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
    // Потолок ограничивает наши обещания и наши пробы, и сказано это ДАННЫМИ: прежде та же
    // фраза копировалась комментарием в лист, а листа с комментариями больше нет (`PWEB-66`).
    expect(DENSITY_CEILING).toBeGreaterThan(Number(DENSITY_DEFAULT));
    expect(MULTIPLIERS).toContain(DENSITY_CEILING);
    expect(MULTIPLIERS).toContain(DENSITY_FLOOR);

    // Само РАЗЛИЧЕНИЕ живёт в `AXES` — там у границы есть род, и он проверяемый. Прежде та же
    // фраза копировалась комментарием в лист; листа с комментариями больше нет (`PWEB-66`), и
    // спрашивать надо данные, а не их копию.
    expect(axisOf(DENSITY_TOKEN)?.ceiling.kind).toBe("предел поддержки");
    expect(axisOf(DENSITY_TOKEN)?.ceiling.norm, "потолок назван требованием нормы").toBeNull();
  });

  it("обе границы названы числами и разведены по роду", () => {
    const axis = axisOf(DENSITY_TOKEN);
    expect(axis?.floor.value).toBe(DENSITY_FLOOR);
    expect(axis?.ceiling.value).toBe(DENSITY_CEILING);
    // Пол — норма, потолок — нет: у пола названа статья, у потолка её быть не может.
    expect(axis?.floor.kind).toBe("норма");
    expect(axis?.floor.norm, "пол не сослался на норму").toBeTruthy();
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
