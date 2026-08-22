// Токен-КОНТРАКТ стилевого слоя: тема — это ДАННЫЕ по этому контракту, а не «что нашлось
// в CSS». Оформлен типом намеренно — набор токенов проверяется компилятором и тестом, а не
// договорённостью на словах.
//
// ДВА УРОВНЯ (`kb:PROBEWEB-12`, пункты 1–2). Тема несёт ШКАЛЫ — сырьё со ступенями. РОЛИ
// (`src/roles.ts`) ссылаются на ступени и в тему не входят: они одинаковы для всех тем, и
// хранить их в каждой значило бы объявить разделение и тут же его отменить.
//
// ГОТОВОГО НАБОРА ЗНАЧЕНИЙ ЗДЕСЬ НЕТ (`PWEB-50`). Были `DEFAULT_SEEDS`, `DEFAULT_LIGHT`,
// `DEFAULT_DARK` — три семени и посчитанные из них половины, то есть палитра фреймворка.
// Палитра без рецептов — половина скина, отгруженная фреймворком, а половин у скина не бывает:
// он единица. Пока она была, «нет скина — приложение голое» оставалось неправдой.
//
// Осталось то, чем значения ПОЛУЧАЮТ: контракт имён, построение половины из семени, сборка
// темы из чужих семян. Ушёл набор, а не язык — семя называет тот, кто делает скин.

import { DERIVED_SCALES } from "./dimension.js";
import {
  CHART_SLOTS,
  SCALE_STEPS,
  type ScaleMode,
  buildAlphaScale,
  buildChartScale,
  buildScale,
  buildScrim,
} from "./scale.js";
import { trace } from "./trace.js";

/** Имена шкал темы. Каждая строится из ОДНОГО значения-семени. */
export const SCALE_NAMES = ["neutral", "brand", "danger"] as const;
export type ScaleName = (typeof SCALE_NAMES)[number];

/**
 * Токены одной шкалы: двенадцать сплошных ступеней, столько же ПАРАЛЛЕЛЬНЫХ альфа-ступеней
 * и подпись на сплошной ступени. Альфа-ряд не украшение: сплошная ступень закрывает то, что
 * под ней, и слоем поверх страницы её не выразить.
 */
const scaleTokens = (name: ScaleName): string[] => [
  ...SCALE_STEPS.map((step) => `${name}-${step}`),
  ...SCALE_STEPS.map((step) => `${name}-a${step}`),
  `${name}-contrast`,
];

/** Категориальные цвета данных. Не роль и не ступень — отдельный ряд рядоразличимых тонов. */
export const CHART_TOKENS = Array.from(
  { length: CHART_SLOTS },
  (_, index) => `chart-${index + 1}`,
);

/**
 * ЦВЕТОВЫЕ ТОКЕНЫ ТЕМЫ — обязательное ядро. Это СЫРЬЁ (ступени), а не назначения: роли
 * объявлены отдельно и на тему не ложатся.
 */
export const SCALE_TOKENS = [
  ...SCALE_NAMES.flatMap(scaleTokens),
  ...CHART_TOKENS,
  // Затемнение под модальным слоем. Не ступень и не роль — самостоятельное назначение,
  // которое от режима НЕ зависит: осветляющая вуаль в тёмной теме подсвечивает то, что
  // должна убрать из фокуса.
  "scrim",
] as const;

/**
 * Прежнее имя `SCALE_TOKENS`.
 *
 * @deprecated с 0.3.0 — набор перестал быть «палитрой ролей» и стал набором ступеней. Имя
 * оставлено, чтобы поставка не ломала импорт молча; удаление — мажорным поднятием версии.
 */
export const PALETTE_TOKENS = SCALE_TOKENS;

/**
 * Мета-токены темы — шрифты, тени и СЕМЕНА размерных шкал. Опциональны: тема, которая их не
 * задала, получает значение по умолчанию из `base.css` (`var(--seed, …)`), а не сломанную
 * страницу.
 *
 * Семена перечислены не списком руками, а взяты из описания шкал: список ступеней и список
 * семян обязаны совпадать по построению, иначе шкала считается от токена, которого в
 * контракте нет.
 */
export const THEME_META_TOKENS = [
  "font-sans",
  "font-serif",
  "font-mono",
  ...DERIVED_SCALES.map((scale) => scale.seed),
  "shadow-2xs",
  "shadow-xs",
  "shadow-sm",
  "shadow",
  "shadow-md",
  "shadow-lg",
  "shadow-xl",
  "shadow-2xl",
] as const;

export type ScaleToken = (typeof SCALE_TOKENS)[number];
export type ThemeMetaToken = (typeof THEME_META_TOKENS)[number];

/**
 * Прежнее имя `ScaleToken`.
 *
 * @deprecated с 0.3.0 — см. `PALETTE_TOKENS`.
 */
export type PaletteToken = ScaleToken;

/** НАШ набор значений как данные: полное цветовое ядро обязательно, мета — по желанию. */
export type ThemeTokens = Record<ScaleToken, string> &
  Partial<Record<ThemeMetaToken, string>>;

/**
 * Значения палитры: имя кастом-свойства БЕЗ `--` → значение. Состав любой.
 *
 * Тип широкий НАМЕРЕННО (`PWEB-3`). Наш набор значений — один из поставщиков, а не
 * фундамент: палитрой вправе быть чужой набор со своими именами, и механика тем обязана
 * возить его так же, как наш. Пока здесь стоял `ThemeTokens`, «мы один из поставщиков» было
 * словом — чужую палитру не пропускал ТИП, хотя отрисовка её печатала без единой правки.
 *
 * Строгость от этого не теряется, она переезжает туда, где ей место: наш собственный набор
 * остаётся `ThemeTokens` — полное ядро обязательно, и генератор шкал отдаёт именно его.
 * Проверять чужой состав нашим контрактом бессмысленно: это чужой товар.
 */
export type PaletteValues = Record<string, string>;

export interface ThemeDefinition {
  /** Имя палитры → селектор `[data-theme="<name>"]`. */
  name: string;
  light: PaletteValues;
  /** Без dark-варианта палитра работает только в светлом режиме. */
  dark?: PaletteValues;
}

/**
 * Семена темы — по одному значению на шкалу. Ровно то, ради чего вводилась модель: смена
 * бренда это ОДНО изменённое значение, а не тридцать переписанных.
 */
export type ThemeSeeds = Record<ScaleName, string>;

// Мета одинакова для обеих половин пары: шрифт и геометрия от режима не зависят. Семена
// размерных шкал берутся из их же описания — второго места, где записан дефолт, нет.
const SHARED_META: Partial<Record<ThemeMetaToken, string>> = {
  "font-sans": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  "font-serif": 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  "font-mono": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  ...Object.fromEntries(DERIVED_SCALES.map((scale) => [scale.seed, scale.fallback])),
  "shadow-2xs": "0 1px 2px 0px oklch(0 0 0 / 0.03)",
  "shadow-xs": "0 1px 2px 0px oklch(0 0 0 / 0.05)",
  "shadow-sm": "0 1px 2px 0px oklch(0 0 0 / 0.05), 0 1px 3px 0px oklch(0 0 0 / 0.1)",
  shadow: "0 1px 3px 0px oklch(0 0 0 / 0.1), 0 1px 2px -1px oklch(0 0 0 / 0.1)",
  "shadow-md": "0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -2px oklch(0 0 0 / 0.1)",
  "shadow-lg": "0 10px 15px -3px oklch(0 0 0 / 0.1), 0 4px 6px -4px oklch(0 0 0 / 0.1)",
  "shadow-xl": "0 20px 25px -5px oklch(0 0 0 / 0.1), 0 8px 10px -6px oklch(0 0 0 / 0.1)",
  "shadow-2xl": "0 25px 50px -12px oklch(0 0 0 / 0.25)",
};

/** Собирает половину темы: три шкалы + ряд графиков + мета. */
export function buildThemeTokens(
  seeds: ThemeSeeds,
  mode: ScaleMode,
  meta: Partial<Record<ThemeMetaToken, string>> = {},
): ThemeTokens {
  const tokens: Record<string, string> = {};

  for (const name of SCALE_NAMES) {
    const scale = buildScale(seeds[name], mode);
    for (const [key, value] of Object.entries(scale)) tokens[`${name}-${key}`] = value;

    const alpha = buildAlphaScale(seeds[name], mode);
    for (const [key, value] of Object.entries(alpha)) tokens[`${name}-${key}`] = value;
  }

  buildChartScale(seeds.brand, mode).forEach((value, index) => {
    tokens[CHART_TOKENS[index]] = value;
  });

  tokens.scrim = buildScrim(seeds.neutral);

  return { ...tokens, ...SHARED_META, ...meta } as ThemeTokens;
}

export interface CreateThemeOptions extends ThemeSeeds {
  /** Имя палитры → селектор `[data-theme="<name>"]`. */
  name: string;
  /** Переопределение мета-токенов: шрифты, тени, семена размерных шкал. */
  meta?: Partial<Record<ThemeMetaToken, string>>;
}

/**
 * Тема из семян. Обе половины пары считаются СВОИМИ лестницами: тёмная — не инверсия
 * светлой, иначе фон элемента становится текстом (`kb:PROBEWEB-12`, пункт 1).
 *
 * ```ts
 * createTheme({ name: "ocean", brand: "#0f6fde", neutral: "#71717a", danger: "#e5484d" });
 * ```
 *
 * СЕМЕНА ОБЯЗАТЕЛЬНЫ ВСЕ ТРИ (`PWEB-50`). Прежде незаданная шкала бралась из дефолтной пары,
 * и это было удобно ровно до того момента, как выяснилось, чем оно является: незаданный бренд
 * молча приносил НАШ бренд, то есть палитру фреймворка. Дефолтной пары больше нет — не потому
 * что убрали удобство, а потому что удобством был отгружен вид.
 *
 * @param options имя палитры и семя на каждую шкалу
 */
export function createTheme(options: CreateThemeOptions): ThemeDefinition {
  const done = trace(`createTheme(${options.name})`);

  const seeds: ThemeSeeds = {
    neutral: options.neutral,
    brand: options.brand,
    danger: options.danger,
  };

  const theme: ThemeDefinition = {
    name: options.name,
    light: buildThemeTokens(seeds, "light", options.meta),
    dark: buildThemeTokens(seeds, "dark", options.meta),
  };

  done();
  return theme;
}

/**
 * Сериализация набора значений в CSS-блок для селектора. Форматирование блока — и только
 * оно: КАКОЙ селектор получает палитра, решает `paletteSelector()` (`src/palette.ts`), и
 * единственный вызывающий здесь — `paletteCss()` оттуда же.
 *
 * НА ПОВЕРХНОСТЬ НЕ ВЫХОДИТ (`kb:PROBEWEB-18`, следствие 4): свободный селектор, доступный
 * снаружи, — это второй способ объявить палитру, и правило «палитра принимает имя»
 * держалось бы при нём обещанием, а не машиной. Внутри зоны функция живёт дальше: запрет
 * касается поверхности и вызывающих, а не самого форматирования.
 */
export function themeToCss(selector: string, tokens: PaletteValues): string {
  const lines = Object.entries(tokens)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join("\n");
  return `${selector} {\n${lines}\n}`;
}
