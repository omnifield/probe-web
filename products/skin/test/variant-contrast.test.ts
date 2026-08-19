// ПРОБА: подпись каждого варианта читается на своём фоне.
//
// Вариант — это подобранная пара ролей, и подобрать её можно неверно: `soft` ставит брендовый
// текст на брендовую подложку, `danger-outline` — опасный текст поверх поверхности. На глаз
// разница между 4.6:1 и 4.2:1 не видна, а норма проходит ровно посередине (WCAG 2.2, 1.4.3
// Contrast (Minimum), AA — 4.5:1 для обычного текста).
//
// ПАРЫ ЧИТАЮТСЯ ИЗ САМОГО CSS, а не переписаны в пробу списком. Первая редакция держала список
// пар рядом с проверкой — и была бесполезна: подмена роли в оформлении её не роняла, потому что
// проба продолжала проверять СВОЙ список. Проверять надо то, что уедет потребителю.
//
// Прозрачный фон варианта — это фон, на котором он стоит: контраст считается к поверхности.

import { AA_TEXT, contrastRatio } from "@omnifield/probe-web-style";
import { describe, expect, it } from "vitest";

import { resolveToken, skinFile, stripComments } from "./css.js";

/** Роль фона, когда у варианта фон прозрачный: кнопка стоит на поверхности страницы. */
const SURFACE = "--surface";

interface Pair {
  variant: string;
  text: string;
  bg: string;
}

/**
 * Собирает фактические пары «подпись на фоне» из `button.css`.
 *
 * Базовое правило задаёт дефолт, правило варианта его перекрывает — так же, как это сделает
 * браузер. Наследование учитывается: вариант, не назначивший цвет текста, берёт базовый.
 */
function pairsFromCss(): Pair[] {
  const css = stripComments(skinFile("button.css"));

  const ruleOf = (selector: string): string => {
    const at = css.indexOf(selector);
    if (at < 0) return "";
    const open = css.indexOf("{", at);
    const close = css.indexOf("}", open);
    return css.slice(open + 1, close);
  };

  const valueOf = (rule: string, property: string): string | undefined => {
    const found = new RegExp(`(?:^|;|\\s)${property}\\s*:\\s*([^;]+)`).exec(rule)?.[1]?.trim();
    if (!found) return undefined;
    const token = /var\(\s*(--[a-z0-9-]+)/.exec(found)?.[1];
    if (token) return token;
    return found === "transparent" ? SURFACE : undefined;
  };

  const base = ruleOf('[data-slot~="button"] {');
  const baseText = valueOf(base, "color");
  const baseBg = valueOf(base, "background-color");

  const pairs: Pair[] = [
    { variant: "основной (без атрибута)", text: baseText!, bg: baseBg! },
  ];

  for (const [, name] of css.matchAll(/\[data-variant="([a-z-]+)"\]\s*\{/g)) {
    if (pairs.some((p) => p.variant === name)) continue;
    const rule = ruleOf(`[data-variant="${name}"] {`);
    pairs.push({
      variant: name,
      text: valueOf(rule, "color") ?? baseText!,
      bg: valueOf(rule, "background-color") ?? baseBg!,
    });
  }

  const disabled = ruleOf('[data-slot~="button"]:disabled {');
  pairs.push({
    variant: "отключённая",
    text: valueOf(disabled, "color") ?? baseText!,
    bg: valueOf(disabled, "background-color") ?? baseBg!,
  });

  return pairs;
}

describe("контраст подписи в каждом варианте", () => {
  const pairs = pairsFromCss();

  it("пары собраны из CSS, а не из ожиданий", () => {
    // Если разбор перестанет находить правила (сменилась форма файла), проба обязана упасть
    // здесь, а не молча проверять пустой список.
    expect(pairs.length).toBeGreaterThanOrEqual(6);
    for (const pair of pairs) {
      expect(pair.text, `у варианта ${pair.variant} не найден цвет текста`).toBeTruthy();
      expect(pair.bg, `у варианта ${pair.variant} не найден фон`).toBeTruthy();
    }
  });

  for (const mode of ["light", "dark"] as const) {
    const modeName = mode === "light" ? "светлая" : "тёмная";

    for (const pair of pairs) {
      it(`${modeName}: ${pair.variant} — подпись на фоне ≥ ${AA_TEXT}`, () => {
        const fg = resolveToken(pair.text, mode);
        const bg = resolveToken(pair.bg, mode);

        expect(fg, `роль ${pair.text} не разрешилась`).toBeDefined();
        expect(bg, `роль ${pair.bg} не разрешилась`).toBeDefined();

        const ratio = contrastRatio(fg!, bg!);
        expect(
          Number(ratio.toFixed(2)),
          `${pair.variant}: ${pair.text} на ${pair.bg} (${modeName} пара)`,
        ).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }
  }
});
