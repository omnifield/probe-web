// ПРОБА ПРЕСЕТОВ: каждый держит обещания контраста и уезжает в приложение целиком.
//
// Пресет — отчуждаемый артефакт: его подключают в чужом приложении одним указанием. Значит
// проверять надо не «стенд не упал», а два свойства, от которых зависит чужой продукт:
//
//   1. КАЖДЫЙ пресет проходит нормы контраста в ОБЕИХ парах. Пресет задаёт семена, из которых
//      база строит ступени, — но правки тёмной пары делает сам, и вот они уже вне её машинной
//      проверки. Ровно на этом мы один раз поймали 2.84 при пороге 3:1.
//   2. CSS пресета содержит ВСЁ, что нужно для вида. Если в нём не окажется плотности или
//      скругления, приложение получит половину пресета и не узнает об этом: недостающие значения
//      молча возьмутся из базы.

import { AA_NON_TEXT, AA_TEXT, CONTRAST_PROMISES, contrastRatio } from "@omnifield/probe-web-style";
import { describe, expect, it } from "vitest";

import { BUILT_IN, DEFAULT_PRESET_ID } from "../src/presets/built-in.js";
import { cssOf, isDirty, type Preset, stateOf, themeOf } from "../src/presets/model.js";

/** Ступень из половины темы: `neutral`, `1` → значение. */
function step(tokens: Record<string, string>, scale: string, key: string): string {
  const value = tokens[`${scale}-${key}`];
  if (!value) throw new Error(`в пресете нет ступени ${scale}-${key}`);
  return value;
}

describe("встроенные пресеты", () => {
  it("семя ровно одно, и дефолтный — оно", () => {
    // Пресеты живут в СЛУЖБЕ (решение user 2026-08-17), локального перечня нет. Здесь остаётся
    // одно семя: им засевается пустая служба, из него же рождается файл поставки. Второй
    // «встроенный» означал бы локальный перечень рядом со служебным — а два перечня расходятся
    // молча, и расходятся в сторону того, кто смотрит на код, а не на службу.
    expect(BUILT_IN.length, "локальный перечень вернулся — их должно быть ровно одно").toBe(1);
    expect(BUILT_IN.some((p) => p.id === DEFAULT_PRESET_ID)).toBe(true);
  });

  it("идентификаторы уникальны и годятся для атрибута и имени файла", () => {
    // Идентификатор уезжает в `data-theme` и в имя файла: пробел или заглавная буква сломают
    // одно из двух, а дубль тихо перекроет чужой пресет.
    const ids = BUILT_IN.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  for (const preset of BUILT_IN) {
    describe(`пресет «${preset.title}»`, () => {
      const theme = themeOf(preset);
      const halves = [
        { name: "светлая", tokens: theme.light as Record<string, string> },
        { name: "тёмная", tokens: (theme.dark ?? {}) as Record<string, string> },
      ];

      for (const half of halves) {
        for (const scale of ["neutral", "brand", "danger"]) {
          for (const promise of CONTRAST_PROMISES) {
            for (const against of promise.against) {
              it(`${half.name}: ${scale}-${promise.step} к ${scale}-${against} ≥ ${promise.min}`, () => {
                const ratio = contrastRatio(
                  step(half.tokens, scale, promise.step),
                  step(half.tokens, scale, against),
                );
                expect(Number(ratio.toFixed(2))).toBeGreaterThanOrEqual(promise.min);
              });
            }
          }
        }

        it(`${half.name}: основной текст на фоне приложения ≥ ${AA_TEXT}`, () => {
          const ratio = contrastRatio(
            step(half.tokens, "neutral", "12"),
            step(half.tokens, "neutral", "1"),
          );
          expect(ratio).toBeGreaterThanOrEqual(AA_TEXT);
        });

        it(`${half.name}: сильная граница различима на фоне ≥ ${AA_NON_TEXT}`, () => {
          const ratio = contrastRatio(
            step(half.tokens, "neutral", "8"),
            step(half.tokens, "neutral", "1"),
          );
          expect(ratio).toBeGreaterThanOrEqual(AA_NON_TEXT);
        });
      }

      it("CSS несёт и ступени, и плотность, и селектор темы", () => {
        const css = cssOf(preset);

        expect(css, "нет селектора темы").toContain(`[data-theme="${preset.id}"]`);
        expect(css, "нет тёмной пары").toContain(`[data-theme="${preset.id}"].dark`);
        expect(css, "нет плотности — приложение возьмёт её из базы и не узнает").toContain(
          "--density:",
        );
        expect(css, "нет ступеней бренда").toMatch(/--brand-9:/);
        expect(css, "нет ступеней нейтрали").toMatch(/--neutral-1:/);
        expect(css, "нет ступеней опасного").toMatch(/--danger-9:/);
      });

      it("CSS не содержит ни одного значения мимо OKLCH", () => {
        // Ступени считает база в OKLCH. Появившийся hex или rgb означал бы, что значение пришло
        // не оттуда — то есть кто-то вписал цвет руками, минуя шкалу и её обещания.
        const css = cssOf(preset);
        const colors = [...css.matchAll(/--(?:neutral|brand|danger)-[a-z0-9]+:\s*([^;]+);/g)].map(
          ([, value]) => value.trim(),
        );

        expect(colors.length).toBeGreaterThan(20);
        expect(colors.filter((value) => !value.startsWith("oklch("))).toEqual([]);
      });
    });
  }
});

describe("состояние пресета", () => {
  const preset: Preset = BUILT_IN[0]!;

  it("свежеподключённый пресет не изменён", () => {
    // Иначе плашка «изменён» висела бы всегда и перестала быть сообщением.
    expect(isDirty(preset, stateOf(preset))).toBe(false);
  });

  it("правка любой ручки делает его изменённым", () => {
    const base = stateOf(preset);

    expect(isDirty(preset, { ...base, brand: "#7c3aed" })).toBe(true);
    expect(isDirty(preset, { ...base, radius: "0rem" })).toBe(true);
    expect(isDirty(preset, { ...base, density: "0.8" })).toBe(true);
  });

  it("правка уезжает в CSS — унесённый пресет совпадает с тем, что на экране", () => {
    // Самая дорогая ошибка этого механизма: на стенде одно, в приложении другое.
    const changed = { ...stateOf(preset), density: "0.8", radius: "0rem" };
    const css = cssOf(preset, changed);

    expect(css).toContain("--density: 0.8;");
    expect(css).toContain("--radius: 0rem;");
  });
});
