// Шкалы: значение → координата. Своё, потому что здесь считать нечего, кроме арифметики,
// а тянуть ради неё зависимость в поставку — решение, которого не требуется.

/** Шкала величин: линейная, с «круглыми» делениями. */
export interface LinearScale {
  min: number;
  max: number;
  /** Значение → координата в отведённой полосе. */
  at: (value: number) => number;
  /** Деления для оси: круглые числа внутри домена. */
  ticks: (count: number) => number[];
}

/**
 * Округлить шаг до «человеческого»: 1, 2, 5 и их десятки.
 *
 * Ось с делениями 0 · 3.7 · 7.4 формально верна и нечитаема; деления существуют, чтобы по
 * ним считывали величину, а не любовались точностью.
 */
function niceStep(raw: number): number {
  if (raw <= 0) return 1;

  const power = 10 ** Math.floor(Math.log10(raw));
  const rest = raw / power;

  // Пороги геометрические (√2 · √10 · √50), а не «на глаз»: они выбирают ближайшее круглое
  // число по ОТНОШЕНИЮ, а не по разности, — приём известный и проверенный (так делают
  // шкалы d3). Пороги «1 · 2 · 5» без квадратных корней округляют вверх слишком охотно, и
  // ось с четырьмя просимыми делениями получает два.
  const step = rest >= Math.sqrt(50) ? 10 : rest >= Math.sqrt(10) ? 5 : rest >= Math.sqrt(2) ? 2 : 1;
  return step * power;
}

/**
 * Линейная шкала.
 *
 * @param range координаты начала и конца полосы; для вертикальной оси начало НИЖЕ конца —
 *   в системе координат SVG ось Y растёт вниз, и разворот делается здесь, а не в разметке
 */
export function linearScale(min: number, max: number, range: [number, number]): LinearScale {
  // Домен нулевой ширины растянули бы в бесконечность: одна величина рисуется по середине.
  const low = min === max ? min - 1 : min;
  const high = min === max ? max + 1 : max;
  const [from, to] = range;

  return {
    min: low,
    max: high,
    at: (value: number) => from + ((value - low) / (high - low)) * (to - from),
    ticks: (count: number) => {
      const step = niceStep((high - low) / Math.max(1, count));
      const first = Math.ceil(low / step) * step;
      const out: number[] = [];
      for (let value = first; value <= high + step / 1e6; value += step) {
        // Накопленная ошибка сложения даёт «0.30000000000000004» прямо на оси.
        out.push(Number(value.toFixed(10)));
      }
      return out;
    },
  };
}

/** Полосовая шкала: категория по номеру → её полоса. */
export interface BandScale {
  /** Начало полосы категории. */
  at: (index: number) => number;
  /** Ширина полосы под одну категорию. */
  width: number;
  /** Середина полосы — по ней ставят точку и подпись. */
  center: (index: number) => number;
}

/**
 * Полосовая шкала.
 *
 * @param padding доля полосы, уходящая в промежуток между категориями (0…1)
 */
export function bandScale(count: number, range: [number, number], padding = 0.2): BandScale {
  const [from, to] = range;
  const step = count === 0 ? to - from : (to - from) / count;
  const width = step * (1 - padding);
  const offset = (step - width) / 2;

  return {
    at: (index: number) => from + index * step + offset,
    width,
    center: (index: number) => from + index * step + step / 2,
  };
}
