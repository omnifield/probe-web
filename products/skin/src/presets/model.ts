// ПРЕСЕТ — полный набор значений вида, отчуждаемый от стенда.
//
// Решение user 2026-08-17: подключается не «палитра» и не «радиус» по отдельности, а ПРЕСЕТ
// целиком. Дальше его можно крутить ручками — тогда он становится изменённым, — и сохранить как
// свой. Свой пресет виден в списке наравне со встроенными.
//
// ЗАЧЕМ ЭТО НУЖНО ЗА ПРЕДЕЛАМИ СТЕНДА, и это главное: пультов будет много, они похожи, но делают
// разное. Вид для них должен задаваться ОДНИМ указанием — «поставь этот пресет», — а не
// переносом десятка настроек руками. Механика приложения при этом не меняется: как персонажу
// меняют одежду, а не тело.
//
// ЧТО ВХОДИТ В ПРЕСЕТ:
//   • семена шкал — из каждого база строит двенадцать ступеней с обещаниями контраста;
//   • правки отдельных ступеней тёмной пары, если пресет их смягчает;
//   • мета: скругление, шаг интервалов, базовый кегль, высота контрола, толщина границы, трекинг;
//   • плотность.
//
// ЧТО НЕ ВХОДИТ:
//   • светлый/тёмный режим — это выбор пользователя, а не свойство пресета: один и тот же пресет
//     обязан работать в обоих;
//   • подключено ли оформление вообще — это состояние стенда;
//   • варианты кнопок и прочая поверхность зоны — они одинаковы для всех пресетов, иначе пресет
//     менял бы не вид, а поведение.

import type { ScaleMode, ThemeDefinition, ThemeMetaToken } from "@omnifield/probe-web-style";
import { buildThemeTokens } from "@omnifield/probe-web-style";

/** Семена шкал: по одному значению на шкалу. */
export interface PresetSeeds {
  brand: string;
  neutral: string;
  danger: string;
}

/** Мета-значения пресета. Пусто — берётся умолчание базы. */
export type PresetMeta = Partial<Record<ThemeMetaToken, string>>;

export interface Preset {
  /** Устойчивый идентификатор: он уезжает в атрибут `data-theme` и в имя файла. */
  id: string;
  title: string;
  /** Откуда пресет взялся. Нужно для отчёта и для запрета правки встроенных. */
  origin: "встроенный" | "свой";
  seeds: PresetSeeds;
  meta?: PresetMeta;
  /** Правки ступеней тёмной пары: вкус конкретного пресета, а не лестницы базы. */
  darkOverrides?: Record<string, string>;
  /** Множитель интервалов и высот. Единица — как в базе. */
  density: string;
}

/** Значения пресета, которые меняются ручками. По ним же считается «изменён». */
export interface PresetState {
  brand: string;
  radius: string | undefined;
  density: string;
}

/** Состояние, в котором пресет находится сразу после подключения. */
export function stateOf(preset: Preset): PresetState {
  return {
    brand: preset.seeds.brand,
    radius: preset.meta?.radius,
    density: preset.density,
  };
}

/** Изменён ли пресет: сравниваются ровно те значения, которыми крутят ручки. */
export function isDirty(preset: Preset, state: PresetState): boolean {
  const base = stateOf(preset);
  return (
    base.brand !== state.brand || base.radius !== state.radius || base.density !== state.density
  );
}

/**
 * Тема пресета для регистрации в слое `style`.
 *
 * Ступени считает БАЗА из семян: у неё закреплено назначение ступеней и проверены обещания
 * контраста. Пресет добавляет только правки тёмной пары, и за них отвечает проба зоны.
 */
export function themeOf(preset: Preset, state?: PresetState): ThemeDefinition {
  const seeds = { ...preset.seeds, brand: state?.brand ?? preset.seeds.brand };
  const meta = { ...preset.meta, ...(state?.radius ? { radius: state.radius } : {}) };

  const half = (mode: ScaleMode) => {
    const tokens = buildThemeTokens(seeds, mode, meta);
    return mode === "dark" && preset.darkOverrides
      ? ({ ...tokens, ...preset.darkOverrides } as typeof tokens)
      : tokens;
  };

  return { name: preset.id, light: half("light"), dark: half("dark") };
}

/**
 * Пресет как CSS — форма, в которой он уезжает в приложение.
 *
 * ПОЧЕМУ ИМЕННО CSS ПЕРВИЧЕН. «Указать пресет и поставить» должно работать без сборки и без
 * единой строки JS: подключил файл, поставил атрибут — получил вид. JSON-описание остаётся
 * источником, из которого этот файл рождается, но потребителю нужен именно файл.
 *
 * Плотность попадает в тот же блок: она такое же значение вида, как скругление, и разделять их
 * означало бы, что пресет переносится в два приёма и половина может отстать.
 */
export function cssOf(preset: Preset, state?: PresetState): string {
  const theme = themeOf(preset, state);
  const density = state?.density ?? preset.density;

  const block = (selector: string, tokens: Record<string, string>, extra?: string): string => {
    const lines = Object.entries(tokens).map(([name, value]) => `  --${name}: ${value};`);
    if (extra) lines.push(extra);
    return `${selector} {\n${lines.join("\n")}\n}`;
  };

  return [
    `/* Пресет «${preset.title}» — оформление probe-web/skin.`,
    `   Подключение: этот файл плюс атрибут data-theme="${preset.id}" на <html>.`,
    `   Тёмная пара включается классом dark, как и у базовой темы. */`,
    "",
    block(`[data-theme="${preset.id}"]`, theme.light as Record<string, string>, `  --density: ${density};`),
    "",
    block(
      `[data-theme="${preset.id}"].dark, [data-theme="${preset.id}"] .dark`,
      (theme.dark ?? {}) as Record<string, string>,
    ),
    "",
  ].join("\n");
}
