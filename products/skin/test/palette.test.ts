// ПРОБА ПАЛИТРЫ: смягчение тёмной пары не сломало обещания контраста.
//
// Палитра сдвигает три крайние ступени тёмной шкалы вручную — значит она вышла из-под
// машинной проверки базы, которая держит обещания только для СГЕНЕРИРОВАННЫХ шкал. Проверяем
// теми же обещаниями и теми же порогами: `CONTRAST_PROMISES` и `contrastRatio` берутся из
// базы, а не переписываются сюда.
//
// Без этой пробы «сделали помягче» однажды окажется «увели продукт из соответствия», и узнаем
// мы об этом от аудитора.

import { AA_TEXT, CONTRAST_PROMISES, contrastRatio } from "@omnifield/probe-web-style";
import { describe, expect, it } from "vitest";

import { SOFTENED_STEPS, TWITTER_THEME } from "../src/theme/twitter.js";

const modes = [
  { name: "светлая", tokens: TWITTER_THEME.light },
  { name: "тёмная", tokens: TWITTER_THEME.dark! },
] as const;

/** Значение ступени шкалы в палитре: `neutral`, `1` → `--neutral-1`. */
function step(tokens: Record<string, string>, scale: string, key: string): string {
  const value = tokens[`${scale}-${key}`];
  if (!value) throw new Error(`в палитре нет ступени ${scale}-${key}`);
  return value;
}

describe("палитра держит обещания контраста базы", () => {
  it("обещания и пороги прочитаны из базы", () => {
    // Если база сменит форму обещаний, проба обязана упасть здесь, а не молча всё пропускать.
    expect(CONTRAST_PROMISES.length).toBeGreaterThan(0);
    expect(AA_TEXT).toBeGreaterThan(0);
  });

  for (const mode of modes) {
    for (const scale of ["neutral", "brand", "danger"]) {
      for (const promise of CONTRAST_PROMISES) {
        for (const against of promise.against) {
          it(`${mode.name}: ${scale}-${promise.step} к ${scale}-${against} ≥ ${promise.min} (${promise.criterion})`, () => {
            const ratio = contrastRatio(
              step(mode.tokens, scale, promise.step),
              step(mode.tokens, scale, against),
            );

            expect(
              Number(ratio.toFixed(2)),
              `${scale}-${promise.step} на ${scale}-${against} в ${mode.name} паре`,
            ).toBeGreaterThanOrEqual(promise.min);
          });
        }
      }
    }
  }

  it("смягчение не тронуло ничего, кроме объявленных ступеней", () => {
    // Список сдвинутых ступеней публикуется палитрой. Проба сверяет, что он не разошёлся с
    // тем, что действительно сдвинуто: молчаливая правка соседней ступени прошла бы мимо
    // обещаний и мимо отчёта.
    expect(SOFTENED_STEPS).toEqual(["neutral-1", "neutral-2", "neutral-8", "neutral-12"]);
  });

  it("тёмный фон не чёрный, а текст не чистый белый", () => {
    // Прямая проверка того, ради чего смягчение делалось (решение user 2026-08-16).
    const dark = TWITTER_THEME.dark!;
    const bg = /oklch\(([\d.]+)/.exec(step(dark, "neutral", "1"))?.[1];
    const fg = /oklch\(([\d.]+)/.exec(step(dark, "neutral", "12"))?.[1];

    expect(Number(bg), "фон тёмной пары ушёл в чёрный").toBeGreaterThan(0.19);
    expect(Number(fg), "текст тёмной пары ушёл в чистый белый").toBeLessThan(0.94);
  });

  it("основной текст читается на фоне приложения с запасом к норме", () => {
    // Роль `--text` это ступень 12, роль `--surface` — ступень 1. Порог 4.5:1 — WCAG 2.2,
    // 1.4.3 Contrast (Minimum), AA.
    for (const mode of modes) {
      const ratio = contrastRatio(
        step(mode.tokens, "neutral", "12"),
        step(mode.tokens, "neutral", "1"),
      );
      expect(ratio, `${mode.name} пара: текст на фоне`).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });
});
