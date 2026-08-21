import { describe, expect, it } from "vitest";

import { contrastRatio } from "../src/color/contrast.js";
import { NAMED_COLORS, NAMED_COLOR_COUNT } from "../src/color/named.js";
import { oklchToSrgb } from "../src/color/oklch.js";
import { parseColor, tryParseColor } from "../src/color/parse.js";

// РАЗБОР КОРМИТ ГЕЙТ, и ошибка здесь делает ЗЕЛЁНЫМ несоответствие — хуже красного прогона.
// Поэтому проверяется не «функция что-то вернула», а совпадение с ВТОРЫМ ИСТОЧНИКОМ и известные
// точки нормы.
//
// ## Откуда взяты ожидания
//
// Таблица ниже снята с живого Chromium 2026-08-21: страница ставила каждое значение в
// `style.color` и читала `getComputedStyle`. Браузер здесь не «ещё одна реализация», а тот, кто
// в итоге и красит: разойдись мы с ним — посчитали бы одно, а человек увидел бы другое.
//
// ## Почему сверка с допуском, а не побайтово
//
// Браузер ПЕЧАТАЕТ цвет восемью битами на канал: `getComputedStyle` отдаёт целые 0…255. Значение
// же нередко попадает между уровнями — `hsl(210 40% 25%)` это ровно 38.25, а `hwb(90 60% 60%)`
// ровно 127.5, — и браузер их округляет при печати, а не при вычислении.
//
// Округлять у себя мы НЕ стали, и это решение: наш собственный путь `oklch()` восемью битами не
// квантуется, и введи мы квантование только для sRGB-записей — один и тот же цвет, написанный
// двумя способами, дал бы два разных ответа. Ровно от этого гейт и защищает.
//
// Поэтому допуск — половина уровня, то есть предел печати браузера. Замер: худшее отличие по
// всей таблице 0.500115 уровня, и каждое из них ровно доля уровня (0.25 или 0.5). Хвост 1.15e-4
// — шум обхода sRGB→OKLCH→sRGB; на целых значениях браузера тот же обход не теряет НИ ОДНОГО
// уровня (проверено отдельно, расхождений ноль).
const BROWSER: readonly (readonly [value: string, rgb: readonly [number, number, number] | null])[] = [
  ["#fff", [255, 255, 255]],
  ["#ffff", [255, 255, 255]],
  ["#ff0000", [255, 0, 0]],
  ["#0a0a0aff", [10, 10, 10]],
  ["#12345678", null],
  ["rgb(255, 0, 0)", [255, 0, 0]],
  ["rgb(255 0 0)", [255, 0, 0]],
  ["rgb(100%, 0%, 0%)", [255, 0, 0]],
  ["rgb(12 34 56)", [12, 34, 56]],
  ["rgba(1, 2, 3, 1)", [1, 2, 3]],
  ["rgb(0 0 0 / 50%)", null],
  ["rgb(255 128 0 / 1)", [255, 128, 0]],
  ["hsl(210, 40%, 25%)", [38, 64, 89]],
  ["hsl(210 40% 25%)", [38, 64, 89]],
  ["hsl(210deg 40% 25%)", [38, 64, 89]],
  ["hsl(0.5turn 100% 50%)", [0, 255, 255]],
  ["hsl(210 40 25)", [38, 64, 89]],
  ["hsla(210, 40%, 25%, 1)", [38, 64, 89]],
  ["hsl(400 50% 50%)", [191, 149, 64]],
  ["hsl(-30 50% 50%)", [191, 64, 128]],
  ["hsl(200grad 50% 50%)", [64, 191, 191]],
  ["hsl(3.14159rad 50% 50%)", [64, 191, 191]],
  ["hwb(210 20% 30%)", [51, 115, 179]],
  ["hwb(0 0% 0%)", [255, 0, 0]],
  ["hwb(90 60% 60%)", [128, 128, 128]],
  ["hwb(45 10% 10%)", [230, 179, 26]],
  ["white", [255, 255, 255]],
  ["black", [0, 0, 0]],
  ["rebeccapurple", [102, 51, 153]],
  ["whitesmoke", [245, 245, 245]],
  ["tomato", [255, 99, 71]],
  ["MidnightBlue", [25, 25, 112]],
  ["transparent", null],
];

/** Половина уровня 0…255 в долях единицы — предел, с которым браузер печатает цвет. */
const HALF_LEVEL = 0.5 / 255;

describe("разбор сверен с браузером", () => {
  it.each(BROWSER.filter(([, rgb]) => rgb !== null))("%s читается как браузер", (value, rgb) => {
    const parsed = tryParseColor(value);
    expect(parsed.ok, `«${value}» не разобран`).toBe(true);

    const srgb = oklchToSrgb((parsed as { color: Parameters<typeof oklchToSrgb>[0] }).color);
    const expected = (rgb as readonly [number, number, number]).map((level) => level / 255);

    for (const [i, channel] of [srgb.r, srgb.g, srgb.b].entries()) {
      expect(Math.abs(channel - expected[i]), `канал ${i} у «${value}»`).toBeLessThanOrEqual(
        HALF_LEVEL + 1e-6,
      );
    }
  });

  it.each(BROWSER.filter(([, rgb]) => rgb === null))(
    "%s браузер считает прозрачным — и разбор отказывает именно поэтому",
    (value) => {
      const parsed = tryParseColor(value);
      expect(parsed.ok).toBe(false);
      expect((parsed as { refusal: string }).refusal).toBe("translucent");
    },
  );
});

describe("одна и та же краска, записанная по-разному", () => {
  // Если бы записи расходились, ответ про читаемость зависел бы от того, как человек набрал
  // цвет, — то есть гейт мерил бы не цвет, а синтаксис.
  it("красный: шестнадцатеричный, доли, имя, тон-насыщенность, тон-белизна", () => {
    const forms = ["#ff0000", "#f00", "rgb(255, 0, 0)", "rgb(255 0 0)", "red", "hsl(0 100% 50%)", "hwb(0 0% 0%)"];
    const first = parseColor(forms[0]);
    for (const form of forms.slice(1)) {
      const other = parseColor(form);
      expect(other.l, form).toBeCloseTo(first.l, 9);
      expect(other.c, form).toBeCloseTo(first.c, 9);
      expect(other.h, form).toBeCloseTo(first.h, 7);
    }
  });

  it("oklab и oklch — одна модель в двух координатах, перевод точный", () => {
    // a = C·cos H, b = C·sin H. Перевода между пространствами тут нет вовсе, есть смена
    // координат, поэтому сходиться обязано до последних знаков, а не «примерно».
    const c = 0.17;
    const h = 262;
    const a = c * Math.cos((h * Math.PI) / 180);
    const b = c * Math.sin((h * Math.PI) / 180);

    const viaLab = parseColor(`oklab(0.55 ${a} ${b})`);
    expect(viaLab.l).toBeCloseTo(0.55, 12);
    expect(viaLab.c).toBeCloseTo(c, 12);
    expect(viaLab.h).toBeCloseTo(h, 10);
  });

  it("серый в oklab получает тон нулём, а не шум последнего знака", () => {
    expect(parseColor("oklab(0.5 0 0)")).toEqual({ l: 0.5, c: 0, h: 0 });
  });
});

describe("наша собственная запись читается как прежде", () => {
  it("читает `oklch(L C H)`", () => {
    expect(parseColor("oklch(0.55 0.17 262)")).toEqual({ l: 0.55, c: 0.17, h: 262 });
  });

  it("читает проценты и `none` — CSS Color 4 допускает обе формы", () => {
    expect(parseColor("oklch(55% 0.17 262)").l).toBeCloseTo(0.55, 10);
    expect(parseColor("oklch(0.55 none none)")).toEqual({ l: 0.55, c: 0, h: 0 });
  });

  it("угол принимает единицу, а не только градусы", () => {
    expect(parseColor("oklch(0.5 0.1 0.5turn)").h).toBeCloseTo(180, 9);
    expect(parseColor("oklch(0.5 0.1 200grad)").h).toBeCloseTo(180, 9);
  });
});

describe("отказ НАЗЫВАЕТСЯ — и причин две, потому что чинятся они разным", () => {
  it("полупрозрачное отвергается как полупрозрачное, а не как мусор", () => {
    // Прежде такое значение не разбиралось ВООБЩЕ и было неотличимо от опечатки. Человеку это
    // говорило «здесь не цвет», хотя чинить надо другое — назвать, что под ним.
    for (const value of ["oklch(0.5 0.1 200 / 0.5)", "rgba(0, 0, 0, 0.06)", "#12345678", "transparent", "hsl(0 0% 0% / 30%)"]) {
      const parsed = tryParseColor(value);
      expect(parsed.ok, value).toBe(false);
      expect((parsed as { refusal: string }).refusal, value).toBe("translucent");
    }
  });

  it("полностью непрозрачное проходит — прозрачность объявлена и ничего не отнимает", () => {
    for (const value of ["rgb(1 2 3 / 1)", "rgb(1, 2, 3, 100%)", "#010203ff", "oklch(0.5 0.1 200 / 1)"]) {
      expect(tryParseColor(value).ok, value).toBe(true);
    }
  });

  it("незнакомая запись называется незнакомой — «нечем посчитать» никуда не делось", () => {
    for (const value of ["не цвет", "#12345", "rgb(1 2)", "color-mix(in oklch, red, blue)", "light-dark(#fff, #000)", "lab(50% 40 59)", "color(display-p3 1 0 0)", "var(--что-то)"]) {
      const parsed = tryParseColor(value);
      expect(parsed.ok, value).toBe(false);
      expect((parsed as { refusal: string }).refusal, value).toBe("unknown-notation");
    }
  });

  it("у отказа есть человеческий текст, а не только код", () => {
    const parsed = tryParseColor("бурый");
    expect(parsed.ok).toBe(false);
    expect((parsed as { means: string }).means).toMatch(/не разобран/);
    expect(() => parseColor("бурый")).toThrow(/не разобран/);
  });

  it("бросающая и не бросающая формы отвечают одинаково", () => {
    // Две двери в один разбор: разойдись они, «проверено» через одну и через другую значило бы
    // разное — ровно то, от чего гейт и защищает.
    for (const value of ["#ff0000", "red", "hsl(210 40% 25%)", "oklch(0.5 0.1 200)"]) {
      expect(parseColor(value)).toEqual((tryParseColor(value) as { color: unknown }).color);
    }
  });
});

describe("таблица именованных цветов", () => {
  it("везёт все 148 имён нормы", () => {
    expect(Object.keys(NAMED_COLORS)).toHaveLength(NAMED_COLOR_COUNT);
    expect(NAMED_COLOR_COUNT).toBe(148);
  });

  it("каждое значение — шестизначная шестнадцатеричная запись в нижнем регистре", () => {
    // Форма одна, потому что читает её машина: разнобой пришлось бы разбирать при каждом чтении.
    for (const [name, value] of Object.entries(NAMED_COLORS)) {
      expect(value, name).toMatch(/^#[0-9a-f]{6}$/);
      expect(name).toBe(name.toLowerCase());
    }
  });

  it("`transparent` в таблицу НЕ входит — иначе проехал бы за чёрный", () => {
    expect(NAMED_COLORS["transparent"]).toBeUndefined();
  });

  it("имя читается независимо от регистра — норма объявляет их нечувствительными", () => {
    expect(parseColor("MidnightBlue")).toEqual(parseColor("midnightblue"));
  });

  it("известные точки: белый, чёрный и тот, что назван в самой норме", () => {
    expect(NAMED_COLORS["white"]).toBe("#ffffff");
    expect(NAMED_COLORS["black"]).toBe("#000000");
    expect(NAMED_COLORS["rebeccapurple"]).toBe("#663399");
  });
});

describe("гейт формулы не тронут", () => {
  it("чёрный на белом по-прежнему даёт 21:1", () => {
    // Остаток порядка 1.5e-6 — шум обхода sRGB→OKLCH→sRGB, он был здесь и до правки (тем же
    // путём ходила шестнадцатеричная запись) и на четыре порядка мельче шага 0.01, которым
    // ответ округляет механика. Допуск назван числом, а не подогнан под прогон.
    expect(Math.abs(contrastRatio("#000000", "#ffffff") - 21)).toBeLessThan(1e-5);
  });

  it("формула считает по ЛЮБОЙ понятой записи одинаково", () => {
    // Иначе «проверено» зависело бы от того, каким синтаксисом написан скин.
    const one = contrastRatio("white", "black");
    expect(contrastRatio("#ffffff", "rgb(0 0 0)")).toBeCloseTo(one, 9);
    expect(contrastRatio("hsl(0 0% 100%)", "hwb(0 0% 100%)")).toBeCloseTo(one, 9);
  });
});
