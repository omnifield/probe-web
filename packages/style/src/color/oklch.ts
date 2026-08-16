// Цветовая математика OKLCH ↔ sRGB. ВНУТРЕННЕЕ ядро генератора шкал: наружу торчат только
// разбор/сборка строки и отображение в охват, всё остальное — детали.
//
// ЗАЧЕМ СВОЯ МАТЕМАТИКА, А НЕ ПАКЕТ. Шкалы считаются НА СБОРКЕ (`kb:PROBEWEB-12`, пункт 3),
// то есть код обязан уметь превратить `oklch()` в sRGB сам — иначе контраст не посчитать и
// обещание ступени не проверить. Библиотека цвета в ПОСТАВКУ не заезжает (решение architect,
// то же место), а девелоперская зависимость ради двухсот строк матрицы даёт нам чужой
// релизный цикл в гейте контраста. Формулы Oklab опубликованы Бьорном Оттоссоном (2020) и
// повторены в CSS Color 4 §10.3 — это норма, а не наша выдумка (`canons/ui-skin/sources/css-color-4.md`).
//
// ГДЕ ЭТО РАБОТАЕТ: на сборке (генерация `themes.css`) и в рантайме при `createTheme()`.
// Горячего пути рендера тут нет — шкала считается один раз на тему.

/** Цвет в OKLCH: светлота 0…1, цветность (chroma) 0…~0.4, тон в градусах 0…360. */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

/** Цвет в sRGB, компоненты 0…1 после гамма-кодирования. */
export interface Srgb {
  r: number;
  g: number;
  b: number;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Гамма-кодирование одной компоненты (sRGB IEC 61966-2-1). Отрицательные значения
 * отражаются: они появляются у цветов ВНЕ охвата, и обрубать их в ноль до проверки охвата
 * значило бы объявить в охвате то, что в него не влезло.
 */
function encodeSrgb(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  return abs <= 0.0031308 ? 12.92 * value : sign * (1.055 * abs ** (1 / 2.4) - 0.055);
}

/** Обратное гамма-кодирование — из sRGB в линейный свет. */
function decodeSrgb(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  return abs <= 0.04045 ? value / 12.92 : sign * ((abs + 0.055) / 1.055) ** 2.4;
}

/** OKLCH → линейный sRGB. Промежуточная точка: значения могут выходить за 0…1 — это охват. */
function oklchToLinear(color: Oklch): [number, number, number] {
  const hueRad = (color.h * Math.PI) / 180;
  const a = color.c * Math.cos(hueRad);
  const b = color.c * Math.sin(hueRad);

  const lCone = (color.l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mCone = (color.l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sCone = (color.l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * lCone - 3.3077115913 * mCone + 0.2309699292 * sCone,
    -1.2684380046 * lCone + 2.6097574011 * mCone - 0.3413193965 * sCone,
    -0.0041960863 * lCone - 0.7034186147 * mCone + 1.707614701 * sCone,
  ];
}

/** Линейный sRGB → OKLCH. */
function linearToOklch(rgb: [number, number, number]): Oklch {
  const [r, g, b] = rgb;

  const lCone = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mCone = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const sCone = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const l = 0.2104542553 * lCone + 0.793617785 * mCone - 0.0040720468 * sCone;
  const aAxis = 1.9779984951 * lCone - 2.428592205 * mCone + 0.4505937099 * sCone;
  const bAxis = 0.0259040371 * lCone + 0.7827717662 * mCone - 0.808675766 * sCone;

  const c = Math.hypot(aAxis, bAxis);
  // Тон у серого не определён (a=b=0): любое значение даст тот же цвет. Отдаём 0, чтобы
  // сравнение шкал не спотыкалось о шум последнего знака.
  const h = c < 1e-6 ? 0 : ((Math.atan2(bAxis, aAxis) * 180) / Math.PI + 360) % 360;

  return { l, c, h };
}

/** Влезает ли цвет в охват sRGB. Допуск — на ошибку последнего знака, а не на «почти влез». */
export function inSrgbGamut(color: Oklch): boolean {
  const eps = 1e-5;
  return oklchToLinear(color).every((value) => value >= -eps && value <= 1 + eps);
}

/**
 * Отображение в охват sRGB УМЕНЬШЕНИЕМ ЦВЕТНОСТИ при сохранённых светлоте и тоне —
 * бинарный поиск по `c` (CSS Color 4 §13.2 описывает тот же приём).
 *
 * Зачем это вообще: в CSS уезжает `oklch()`, и цвет вне охвата браузер обрежет ПО-СВОЕМУ.
 * Обрезка меняет светлоту — а на светлоте держится обещание контраста. Отобразив цвет
 * сами, мы считаем контраст ровно на том, что покажет экран, а не на том, что мы задумали.
 */
export function toSrgbGamut(color: Oklch): Oklch {
  if (inSrgbGamut(color)) return color;

  let low = 0;
  let high = color.c;
  // 24 деления — точность ~1e-7 по цветности, заведомо мельче шага округления при сериализации.
  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) / 2;
    if (inSrgbGamut({ ...color, c: mid })) low = mid;
    else high = mid;
  }
  return { ...color, c: low };
}

/** OKLCH → sRGB, компоненты 0…1. Цвет вне охвата сначала отображается в него. */
export function oklchToSrgb(color: Oklch): Srgb {
  const [r, g, b] = oklchToLinear(toSrgbGamut(color));
  return { r: clamp01(encodeSrgb(r)), g: clamp01(encodeSrgb(g)), b: clamp01(encodeSrgb(b)) };
}

/** sRGB (0…1) → OKLCH. */
export function srgbToOklch(color: Srgb): Oklch {
  return linearToOklch([decodeSrgb(color.r), decodeSrgb(color.g), decodeSrgb(color.b)]);
}

// Округление при сериализации — часть контракта, а не косметика: в CSS уезжает ОКРУГЛЁННОЕ
// значение, и гейт контраста обязан считать по нему же. Поэтому проверка контраста работает
// на разобранной обратно строке, а не на исходных числах в памяти.
const round = (value: number, digits: number): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/**
 * OKLCH → строка `oklch(L C H)`. Цвет вне охвата отображается в охват перед записью.
 *
 * @param color цвет
 * @param alpha прозрачность 0…1; при `undefined` (и при 1) записывается непрозрачный цвет —
 *   `/ 1` в значении ничего не добавляет, но заставляет каждого читателя проверять, не
 *   полупрозрачная ли это ступень
 */
export function formatOklch(color: Oklch, alpha?: number): string {
  const mapped = toSrgbGamut(color);

  // Округление способно вытолкнуть из охвата то, что в него только что вписали: значение на
  // самой границе округляется ВВЕРХ. Дальше цвет обрезал бы браузер — по-своему и по каналам,
  // то есть с другой светлотой, чем считал гейт контраста. Поэтому округлённое значение
  // проверяется ещё раз и при нужде ужимается на шаг сетки округления.
  let c = round(mapped.c, 4);
  while (c > 0 && !inSrgbGamut({ ...mapped, l: round(mapped.l, 4), c })) c = round(c - 1e-4, 4);
  // У ахроматичного цвета тон бессмыслен: печатаем 0, иначе одинаковые серые отличаются
  // текстом и diff темы шумит на пустом месте.
  const h = c === 0 ? 0 : round(mapped.h, 2);
  const opacity = alpha === undefined || alpha >= 1 ? "" : ` / ${round(alpha, 3)}`;
  return `oklch(${round(mapped.l, 4)} ${c} ${h}${opacity})`;
}

const OKLCH_RE =
  /^oklch\(\s*(none|[-\d.]+%?)\s+(none|[-\d.]+%?)\s+(none|[-\d.]+)(?:deg)?\s*\)$/i;
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Число или `none` (CSS Color 4 §4.4 — отсутствующая компонента считается нулём). */
function component(raw: string, scale: number): number {
  if (raw.toLowerCase() === "none") return 0;
  return raw.endsWith("%") ? (Number.parseFloat(raw) / 100) * scale : Number.parseFloat(raw);
}

/**
 * Разбор цвета-семени. Понимает `oklch(L C H)` и `#rgb`/`#rrggbb` — бренд обычно приходит
 * шестнадцатеричным, и заставлять потребителя переводить его руками значит получить
 * перевод с ошибкой.
 *
 * Прозрачность НЕ поддержана намеренно: полупрозрачное семя делает контраст ступени
 * зависимым от того, что под ней, — то есть обещание перестаёт быть проверяемым.
 */
export function parseColor(value: string): Oklch {
  const raw = value.trim();

  const oklch = OKLCH_RE.exec(raw);
  if (oklch) {
    return {
      l: component(oklch[1], 1),
      c: component(oklch[2], 0.4),
      h: component(oklch[3], 1),
    };
  }

  const hex = HEX_RE.exec(raw);
  if (hex) {
    const digits =
      hex[1].length === 3
        ? [...hex[1]].map((digit) => digit + digit).join("")
        : hex[1];
    return srgbToOklch({
      r: Number.parseInt(digits.slice(0, 2), 16) / 255,
      g: Number.parseInt(digits.slice(2, 4), 16) / 255,
      b: Number.parseInt(digits.slice(4, 6), 16) / 255,
    });
  }

  throw new TypeError(
    `цвет-семя «${value}» не разобран: ожидается oklch(L C H) или #rrggbb (без прозрачности)`,
  );
}
