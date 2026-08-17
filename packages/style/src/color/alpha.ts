// Разложение цвета на ПОЛУПРОЗРАЧНУЮ вуаль: какой цвет и с какой прозрачностью нужно
// положить поверх фона, чтобы получилась заданная ступень.
//
// ЗАЧЕМ. Сплошная ступень закрывает то, что под ней, — а слою поверх страницы это и нужно
// не всегда: затемнение под диалогом обязано просвечивать, подсветка при наведении ложится
// на произвольный фон, а не на известный. Без альфа-ступеней единственный выход —
// литеральная прозрачность в оформлении, то есть ровно то, что зона `skin` себе запрещает.
//
// КАК. Композиция «источник поверх фона» (Compositing 1, §5.1, оператор `source-over`) для
// непрозрачного фона сводится к покомпонентному `T = C·α + B·(1−α)`. Здесь решается обратная
// задача: известны цель `T` и фон `B`, ищутся `C` и `α`.
//
// Решений бесконечно много (чем выше `α`, тем ближе `C` к `T`), поэтому берётся МИНИМАЛЬНАЯ
// прозрачность, при которой `C` ещё влезает в 0…1 по всем каналам. Минимальная — потому что
// вуаль тем честнее, чем меньше она перекрывает: на произвольном фоне она обязана
// подкрашивать, а не подменять.

import type { Srgb } from "./oklch.js";

export interface Veil {
  /** Цвет вуали. */
  color: Srgb;
  /** Прозрачность 0…1. */
  alpha: number;
}

const CHANNELS = ["r", "g", "b"] as const;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Округление прозрачности ВВЕРХ до трёх знаков — см. `veilOver`. */
const ceilAlpha = (value: number): number => Math.min(1, Math.ceil(value * 1000) / 1000);

/**
 * Раскладывает цель на вуаль поверх фона.
 *
 * Прозрачность округляется ВВЕРХ, а цвет считается уже по округлённой. Разница мелкая —
 * при округлении вниз крайний канал выходит за 0…1 на тысячные и его срезает `clamp`, —
 * но опираться на срез не нужно: вверх цвет уходит ВНУТРЬ диапазона, и композиция сходится
 * без обрезки вообще.
 *
 * @param target цвет, который должен получиться поверх фона
 * @param background непрозрачный фон, поверх которого ляжет вуаль
 * @param minAlpha нижняя отсечка: при `α → 0` цвет вуали улетает в бесконечность, и ступень,
 *   почти совпавшая с фоном, дала бы численный мусор вместо значения
 */
export function veilOver(target: Srgb, background: Srgb, minAlpha = 0.008): Veil {
  // Нижние границы прозрачности по каждому каналу: `C ≥ 0` и `C ≤ 1`.
  let alpha = minAlpha;
  for (const channel of CHANNELS) {
    const t = target[channel];
    const b = background[channel];
    if (b > 0) alpha = Math.max(alpha, (b - t) / b);
    if (b < 1) alpha = Math.max(alpha, (t - b) / (1 - b));
  }

  alpha = ceilAlpha(clamp01(alpha));

  const color = {} as Srgb;
  for (const channel of CHANNELS) {
    color[channel] = clamp01(
      (target[channel] - background[channel] * (1 - alpha)) / alpha,
    );
  }

  return { color, alpha };
}

/** Композиция вуали поверх непрозрачного фона — обратная операция, нужна гейту. */
export function composite(veil: Veil, background: Srgb): Srgb {
  const out = {} as Srgb;
  for (const channel of CHANNELS) {
    out[channel] = clamp01(
      veil.color[channel] * veil.alpha + background[channel] * (1 - veil.alpha),
    );
  }
  return out;
}
