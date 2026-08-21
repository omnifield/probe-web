// Контраст по WCAG 2.2 (Recommendation, 12 December 2024). Это ГЕЙТ, а не утилита: на нём
// держится обещание ступени из `kb:PROBEWEB-12`, пункт 4.
//
// Пороги нормы: текст — 4.5:1 (критерий 1.4.3 Contrast (Minimum), уровень AA);
// нетекстовые элементы, включая индикатор фокуса и границы контролов, — 3:1
// (критерий 1.4.11 Non-text Contrast, AA). Выписка — `canons/ui-skin/sources/wcag-2.2.md`.
//
// Формулы (relative luminance и contrast ratio) взяты из словаря WCAG дословно. Своих
// коэффициентов здесь нет и быть не может: «примерно как в норме» в гейте соответствия
// означает, что соответствие проверяется не по норме.

import { type Oklch, oklchToSrgb } from "./oklch.js";
import { parseColor } from "./parse.js";

/** Порог AA для текста — WCAG 2.2, критерий 1.4.3. */
export const AA_TEXT = 4.5;

/** Порог AA для нетекстовых элементов и индикатора фокуса — WCAG 2.2, критерий 1.4.11. */
export const AA_NON_TEXT = 3;

/**
 * Относительная яркость по WCAG 2.2. Порог кусочной функции — 0.03928, как в норме
 * (в самом sRGB IEC 61966-2-1 он 0.04045; разница на пятом знаке, но переписывать норму
 * «как правильнее» в гейте соответствия нельзя).
 */
function relativeLuminance(color: Oklch): number {
  const { r, g, b } = oklchToSrgb(color);
  const channel = (value: number): number =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Коэффициент контраста двух цветов — от 1:1 (одинаковые) до 21:1 (чёрный и белый).
 * Порядок аргументов не важен: норма определяет отношение через светлейший и темнейший.
 *
 * Принимает и разобранный цвет, и строку — гейт считает по ТОМУ ЖЕ тексту, который уезжает
 * в CSS, иначе проверяется задумка, а не поставка.
 */
export function contrastRatio(a: Oklch | string, b: Oklch | string): number {
  const first = relativeLuminance(typeof a === "string" ? parseColor(a) : a);
  const second = relativeLuminance(typeof b === "string" ? parseColor(b) : b);
  const [light, dark] = first >= second ? [first, second] : [second, first];
  return (light + 0.05) / (dark + 0.05);
}
