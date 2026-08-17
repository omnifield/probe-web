// РАЗМЕРНЫЕ ШКАЛЫ: интервалы, типографика, высоты контролов, толщины границ, скругления.
// Решение — `kb:PROBEWEB-12`, пункт 5.
//
// ПРИЁМ ТОТ ЖЕ, ЧТО У СКРУГЛЕНИЙ: производная шкала от ОДНОГО значения-семени, а не россыпь
// независимых токенов. Россыпь означает, что правка формы — это правка каждого значения в
// каждой теме; шкала означает, что тема задаёт одно число, а ступени считаем мы.
//
// ГДЕ ЖИВУТ ЗНАЧЕНИЯ. Семена — данные темы (`ThemeTokens`), ступени — `calc()` в `base.css`.
// Сам блок `base.css` ГЕНЕРИРУЕТСЯ из этого файла: иначе перечень ступеней существовал бы
// двумя копиями (данные здесь, текст там) и разъехался бы на первой правке. Отсюда же берутся
// значения по умолчанию в `var(--seed, …)` — второго места, где записан дефолт, нет.
//
// ПЛОТНОСТЬ — ОСЬ, А НЕ НАБОР. `--density` умножает интервалы и высоты контролов; кегль,
// скругления и толщины она НЕ трогает (см. `DENSITY_NOTE`).

/** Ступень производной шкалы. Ровно один из способов задания — множитель, смещение, литерал. */
export type DerivedStep =
  | { name: string; factor: number }
  | { name: string; offset: string }
  | { name: string; value: string };

export interface DerivedScale {
  /** Имя токена-семени (без `--`). */
  seed: string;
  /** Значение семени по умолчанию — оно же подставляется как fallback в `var()`. */
  fallback: string;
  /** Умножается ли шкала осью плотности. */
  density: boolean;
  /** Основание шага — объявленное. Уезжает комментарием в сгенерированный CSS. */
  basis: string;
  steps: DerivedStep[];
}

/**
 * Производные шкалы. Порядок массива = порядок блоков в `base.css`.
 *
 * Об основании шага честно: рынок публикует ЗНАЧЕНИЯ и почти нигде не объявляет, ПОЧЕМУ шаг
 * такой (`canons/ui-skin/gaps/scale-step-basis-and-rhythm.md`). Мы объявляем — но объявляем
 * то, что есть: у интервалов это сетка 4px, у кегля — ряд отношений, а не выведенная из
 * чего-то константа. «Основание объявлено» здесь значит «названо и проверяемо», а не
 * «доказано».
 */
export const DERIVED_SCALES: readonly DerivedScale[] = [
  {
    seed: "radius",
    fallback: "0.5rem",
    density: false,
    basis:
      "смещения от семени в px: форма скругления не должна плыть вместе с кеглем и плотностью",
    steps: [
      { name: "radius-xs", offset: "- 6px" },
      { name: "radius-sm", offset: "- 4px" },
      { name: "radius-md", offset: "- 2px" },
      { name: "radius-lg", offset: "" },
      { name: "radius-xl", offset: "+ 4px" },
      { name: "radius-2xl", offset: "+ 8px" },
      { name: "radius-3xl", offset: "+ 16px" },
      { name: "radius-full", value: "9999px" },
    ],
  },
  {
    seed: "space",
    fallback: "0.25rem",
    density: true,
    basis: "сетка 4px (семя 0.25rem); ступени кратны ей — 4·8·12·16·24·32·48·64·96·128",
    steps: [
      { name: "space-1", factor: 1 },
      { name: "space-2", factor: 2 },
      { name: "space-3", factor: 3 },
      { name: "space-4", factor: 4 },
      { name: "space-5", factor: 6 },
      { name: "space-6", factor: 8 },
      { name: "space-7", factor: 12 },
      { name: "space-8", factor: 16 },
      { name: "space-9", factor: 24 },
      { name: "space-10", factor: 32 },
    ],
  },
  {
    // Семя названо `--font-size`, а не `--text`: `--text-*` заняли бы то же пространство
    // имён, что цветовые роли текста, и `--text-muted` рядом с `--text-sm` читались бы как
    // одна шкала. Контракт, в котором имя не говорит, что это — цвет или размер, не контракт.
    seed: "font-size",
    fallback: "1rem",
    density: false,
    basis:
      "отношения к базовому кеглю; семя в rem — оно масштабируется корневым размером шрифта, то есть уважает настройку пользователя (WCAG 2.2, 1.4.4 Resize Text)",
    steps: [
      { name: "font-size-xs", factor: 0.75 },
      { name: "font-size-sm", factor: 0.875 },
      { name: "font-size-md", factor: 1 },
      { name: "font-size-lg", factor: 1.125 },
      { name: "font-size-xl", factor: 1.25 },
      { name: "font-size-2xl", factor: 1.5 },
      { name: "font-size-3xl", factor: 1.875 },
      { name: "font-size-4xl", factor: 2.25 },
    ],
  },
  {
    seed: "control-height",
    fallback: "2.5rem",
    density: true,
    basis:
      "отношения к базовой высоте контрола; нижняя ступень при плотности 1 даёт 32px — выше минимального размера цели 24×24 (WCAG 2.2, 2.5.8)",
    steps: [
      { name: "control-height-sm", factor: 0.8 },
      { name: "control-height-md", factor: 1 },
      { name: "control-height-lg", factor: 1.2 },
    ],
  },
  {
    seed: "border-width",
    fallback: "1px",
    density: false,
    basis: "кратные семени; толщина границы не масштабируется плотностью — иначе плотный режим её стирает",
    steps: [
      { name: "border-width-1", factor: 1 },
      { name: "border-width-2", factor: 2 },
      { name: "border-width-4", factor: 4 },
    ],
  },
  {
    // Семя переименовано из `--tracking-normal` в `--tracking`: прежнее имя было И семенем,
    // И ступенью, а токен, объявленный через самого себя, — это цикл, и браузер объявляет
    // такое свойство недействительным (CSS Variables 1, §3). Ступень `--tracking-normal`
    // осталась на месте — переименовано семя, а не то, за что цепляется потребитель.
    seed: "tracking",
    fallback: "0em",
    density: false,
    basis: "смещения от нормального трекинга в em — межбуквенный интервал следует за кеглем",
    steps: [
      { name: "tracking-tight", offset: "- 0.01em" },
      { name: "tracking-normal", offset: "" },
      { name: "tracking-wide", offset: "+ 0.025em" },
    ],
  },
];

/**
 * Токены, у которых шкалы НЕТ и не должно быть.
 *
 * Высота строки и начертание — ОТНОШЕНИЯ и нормированный ряд, а не размеры: высота строки
 * безразмерна намеренно (наследуется как множитель, а не как посчитанная длина), начертания
 * заданы нормой (CSS Fonts 4, §2.3, ряд 100…900). Выводить их из семени значило бы придумать
 * шкалу там, где значения не наши.
 */
export const FIXED_TOKENS: readonly { name: string; value: string; note: string }[] = [
  { name: "leading-none", value: "1", note: "высота строки — безразмерное отношение" },
  { name: "leading-tight", value: "1.25", note: "заголовки" },
  { name: "leading-snug", value: "1.375", note: "плотный текст" },
  { name: "leading-normal", value: "1.5", note: "основной текст" },
  { name: "leading-relaxed", value: "1.625", note: "длинные абзацы" },
  { name: "weight-normal", value: "400", note: "CSS Fonts 4, §2.3 — числовой ряд начертаний" },
  { name: "weight-medium", value: "500", note: "" },
  { name: "weight-semibold", value: "600", note: "" },
  { name: "weight-bold", value: "700", note: "" },
  {
    name: "control-target-min",
    value: "1.5rem",
    note: "минимальный размер цели 24×24 CSS-пикселя — WCAG 2.2, 2.5.8 Target Size (Minimum), AA. Не масштабируется ничем: это пол нормы, а не наша ступень",
  },
];

/** Имя токена-оси плотности. */
export const DENSITY_TOKEN = "density";

/** Значение оси по умолчанию. */
export const DENSITY_DEFAULT = "1";

/**
 * Нижняя граница оси плотности. Считается из нормы, а не назначается: при плотности `d`
 * нижняя ступень контрола даёт `2.5rem × 0.8 × d`, и она обязана остаться не ниже
 * минимального размера цели 24×24 (WCAG 2.2, 2.5.8) → `d ≥ 24 / 32 = 0.75`.
 *
 * Это граница, а не рекомендация: ниже неё оформление перестаёт соответствовать норме, и
 * узнаёт об этом не тот, кто крутил ручку.
 */
export const DENSITY_FLOOR = 0.75;

/** Что ось плотности меняет и, главное, чего НЕ меняет. */
export const DENSITY_NOTE =
  "плотность умножает интервалы и высоты контролов. Кегль она НЕ трогает: уменьшенный плотным режимом текст ломает 1.4.4 Resize Text и читаемость, а плотность нужна ради количества строк на экране, а не ради мелкого шрифта. Скругления и толщины границ — тоже нет: они форма, а не размер.";

const seedRef = (scale: DerivedScale): string => `var(--${scale.seed}, ${scale.fallback})`;

const densityRef = `var(--${DENSITY_TOKEN}, ${DENSITY_DEFAULT})`;

/** Значение одной ступени — выражение, которое уедет в CSS. */
export function stepValue(scale: DerivedScale, step: DerivedStep): string {
  if ("value" in step) return step.value;

  const seed = seedRef(scale);

  if ("offset" in step) {
    // Смещение нулевое — это само семя. `calc(var(--radius))` работал бы, но лишняя обёртка
    // в контракте читается как «здесь что-то считается», а здесь ничего не считается.
    return step.offset ? `calc(${seed} ${step.offset})` : seed;
  }

  const parts = [seed];
  if (step.factor !== 1) parts.push(String(step.factor));
  if (scale.density) parts.push(densityRef);
  return parts.length === 1 ? seed : `calc(${parts.join(" * ")})`;
}

/** Полный перечень имён производных ступеней — для контракта и доки. */
export const DERIVED_TOKENS: readonly string[] = DERIVED_SCALES.flatMap((scale) =>
  scale.steps.map((step) => step.name),
);

/** Генерация CSS-блока производных шкал для `base.css`. */
export function derivedCss(): string {
  const blocks = DERIVED_SCALES.map((scale) => {
    const head = `  /* ${scale.seed}: ${scale.basis}${scale.density ? "; масштабируется плотностью" : ""} */`;
    const lines = scale.steps.map((step) => `  --${step.name}: ${stepValue(scale, step)};`);
    return [head, ...lines].join("\n");
  });

  const fixed = [
    "  /* Без шкалы намеренно — отношения и нормированные ряды, а не размеры. */",
    ...FIXED_TOKENS.map((token) => `  --${token.name}: ${token.value};`),
  ].join("\n");

  // Ось плотности объявлена ЗДЕСЬ, а не в теме: это не значение палитры, а ручка, которую
  // потребитель крутит на контейнере. Объявление в `:root` даёт ей видимое значение по
  // умолчанию, переопределение на любом предке перебивает его наследованием.
  const density = [
    `  /* Ось плотности: ${DENSITY_NOTE} Нижняя граница — ${DENSITY_FLOOR}. */`,
    `  --${DENSITY_TOKEN}: ${DENSITY_DEFAULT};`,
  ].join("\n");

  return `:root {\n${[density, ...blocks, fixed].join("\n\n")}\n}`;
}
