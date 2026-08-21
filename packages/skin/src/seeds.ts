// СЕМЕНА — второй способ объявить значения скина.
//
// ## Что это меняет
//
// Литералами человек пишет обе половины сам. Семенем он называет ОДНО значение, а обе половины
// строит та же механика, что строит их для набора значений: шкала под режим, с назначенными
// ступенями и машинными обещаниями контраста.
//
// Главное здесь не «не делать работу дважды», а то, что скин становится ПЕРЕСЕВАЕМЫМ. Правило
// адресует ступень (`var(--бренд-9)`), а не значение; поменял семя — поменялся весь вид, обе
// половины, с сохранёнными обещаниями.
//
// ## Своего построения здесь нет ни строки
//
// `buildScale`, `buildAlphaScale`, `buildChartScale`, `buildScrim` берутся у зоны значений, где
// они объявлены гейтом. Вторая реализация дала бы два разных ответа на вопрос «какой это цвет»,
// а обещания контраста перестали бы что-либо значить: они проверены на ТОЙ лестнице.
//
// Проверено замером 2026-08-21: 16 семян × 2 режима × все объявленные обещания — 384 пары, ни
// одного нарушения. Обещание «контраст даётся построением» опирается на это, а не на надежду;
// проба зоны держит его дальше (`test/seeds.test.ts`).
//
// ## Два пути смешиваются, и это ОДИН механизм
//
// Литерал по имени перебивает построенное. Отсюда сразу три ответа, которые иначе пришлось бы
// изобретать по отдельности:
//
//   • **одну шкалу семенем, другую литералами — можно.** Это не особый случай, а то же самое
//     наложение: построенного под второе имя просто нет;
//   • **правка человека переживает перегенерацию** — по построению, а не по старанию: она
//     лежит отдельными данными и всегда ложится сверху. Затирать нечего, потому что построенное
//     нигде не хранится;
//   • **правка ПОМЕЧЕНА:** `skinValues` на каждое значение говорит, откуда оно взялось.
//
// Правка светлой половины перебивает только светлую: тёмная остаётся построенной. Иначе поправка
// одного оттенка молча уводила бы за собой вторую половину, которую человек не трогал.
//
// ## Выводится ЦВЕТ, и только он
//
// Перечень того, что НЕ выводится, объявлен данными (`NOT_SEEDED`), а не оставлен сюрпризом:
// молчание здесь читается как «выводится всё», и человек узнаёт правду от тёмной темы.

import {
  buildAlphaScale,
  buildChartScale,
  buildScale,
  buildScrim,
  tryParseColor,
  type ColorRefusal,
  type ScaleMode,
} from "@omnifield/probe-web-style/values";
// Узкий вход, а не корень: корень зоны значений объявляет Solid одноранговым, а трогает его один
// файл — реактивный контроллер темы. Модель скина отдаётся подпутём без отрисовки, и тянуть
// реактивность за построением шкалы ей не за что (`PWEB-44`).

import type { ScaleDeclaration, SeededScale, Skin, SkinVariables } from "./recipe.js";
import { trace } from "./trace.js";

/** Половина скина. */
export type SkinHalf = ScaleMode;

/** Откуда взялось значение. */
export type ValueOrigin = "seed" | "literal";

/** Значение скина вместе с происхождением — то, чем правка человека и помечена. */
export interface SkinValue {
  readonly value: string;
  readonly from: ValueOrigin;
  /** Шкала, из которой значение выросло. Есть только у построенного. */
  readonly scale?: string;
  /** Ступень внутри шкалы: `9`, `contrast`, `a3`, `chart-2`, `scrim`. */
  readonly step?: string;
}

/**
 * Что семенем НЕ выводится — и почему.
 *
 * Объявлено данными, а не абзацем в доке: перечень читает и редактор, чтобы сказать человеку
 * заранее, что эти значения остаются за ним. Форма взята у `NO_PROMISE` зоны значений — там же,
 * где взято само построение, и по той же причине: молчание читается как «сделано».
 */
export const NOT_SEEDED: Readonly<Record<string, string>> = {
  тени: "в тёмном режиме подъём даётся светлотой, а не тенью: вывод из семени дал бы тень, которой там быть не должно",
  полупрозрачности:
    "ведут себя иначе на светлом и тёмном фоне; выводится только объявленный ряд `alpha`, остальное — за человеком",
  шрифты: "не цвет: из цветового семени не выводятся никак",
  скругления: "не цвет",
  плотность: "не цвет",
};

/** Раскладывает объявление шкалы в полную форму. */
function declared(declaration: ScaleDeclaration): SeededScale {
  return typeof declaration === "string" ? { seed: declaration } : declaration;
}

/** Семя, из которого лестницу не построить: имя шкалы и названная причина. */
export interface SeedRefusal {
  readonly scale: string;
  readonly seed: string;
  readonly refusal: ColorRefusal;
  readonly means: string;
}

/**
 * Семена, которые построением не берутся.
 *
 * Спрашивается ВЕТВЛЕНИЕМ, а не перехватом: построение шкалы бросает на негодном семени, и без
 * этой проверки `checkSkin` — обещанный «перечень изъянов значением» — падал бы исключением
 * посреди перечня (`PWEB-45`). Отказ разбора доносится целиком, вместе с его пояснением.
 *
 * @param variables переменные скина
 */
export function seedRefusals(variables: SkinVariables | undefined): readonly SeedRefusal[] {
  const refusals: SeedRefusal[] = [];

  for (const [scale, declaration] of Object.entries(variables?.scales ?? {})) {
    const { seed } = declared(declaration);
    const parsed = tryParseColor(seed);

    if (!parsed.ok) refusals.push({ scale, seed, refusal: parsed.refusal, means: parsed.means });
  }

  return refusals;
}

/**
 * Строит значения ОДНОЙ шкалы под один режим: имя ступени → значение.
 *
 * Имя собирается как в зоне значений — `<шкала>-<ступень>`: скин и набор значений читаются
 * одним взглядом, а правило, написанное против одного, переносится на другой.
 */
function scaleValues(name: string, scale: SeededScale, mode: SkinHalf): Map<string, SkinValue> {
  const values = new Map<string, SkinValue>();
  const put = (step: string, value: string): void => {
    values.set(`${name}-${step}`, { value, from: "seed", scale: name, step });
  };

  for (const [step, value] of Object.entries(buildScale(scale.seed, mode))) put(step, value);

  if (scale.alpha) {
    for (const [step, value] of Object.entries(buildAlphaScale(scale.seed, mode))) put(step, value);
  }

  if (scale.chart) {
    buildChartScale(scale.seed, mode).forEach((value, index) => put(`chart-${index + 1}`, value));
  }

  // Затемнение под слоем от режима не зависит: осветляющая вуаль в тёмной теме подсвечивает то,
  // что должна убрать из фокуса. Это решение зоны значений, и мы его не пересматриваем.
  if (scale.scrim) put("scrim", buildScrim(scale.seed));

  return values;
}

/**
 * Построенные значения всех объявленных шкал под один режим.
 *
 * Шкала с негодным семенем ПРОПУСКАЕТСЯ, а не роняет обход: её отказ — запись в перечне изъянов
 * (`seedRefusals`), и падать посреди счёта из-за одной опечатки нечему.
 */
function seeded(variables: SkinVariables | undefined, mode: SkinHalf): Map<string, SkinValue> {
  const values = new Map<string, SkinValue>();

  for (const [name, declaration] of Object.entries(variables?.scales ?? {})) {
    const scale = declared(declaration);
    if (!tryParseColor(scale.seed).ok) continue;

    for (const [key, value] of scaleValues(name, scale, mode)) values.set(key, value);
  }

  return values;
}

/**
 * ЗНАЧЕНИЯ СКИНА одной половины: построенное семенами плюс литералы поверх.
 *
 * Порядок наложения объявлен и от него зависит всё остальное:
 *
 * ```
 * светлая  =  построенное(светлое)  ⊕  литералы светлой
 * тёмная   =  литералы светлой  ⊕  построенное(тёмное)  ⊕  литералы тёмной
 * ```
 *
 * Литералы светлой стоят в тёмной ПЕРВЫМИ, а не последними, и это не описка. Имя без семени
 * объявлено один раз и действует в обеих половинах — так же, как в CSS, где тёмный блок
 * переопределяет только названное. Имя ИЗ ШКАЛЫ переопределяется построенной тёмной ступенью:
 * поправив светлый оттенок, человек правит светлую половину, а не обе.
 *
 * @param skin скин целиком
 * @param half половина
 * @returns имя без `--` → значение и его происхождение
 */
export function skinValues(skin: Skin, half: SkinHalf): Map<string, SkinValue> {
  const done = trace(`skinValues(${skin.name}, ${half})`);

  const literal = (source: Readonly<Record<string, string>> | undefined): [string, SkinValue][] =>
    Object.entries(source ?? {}).map(([name, value]) => [name, { value, from: "literal" }]);

  const values = new Map<string, SkinValue>(
    half === "light"
      ? [...seeded(skin.variables, "light"), ...literal(skin.variables?.light)]
      : [
          ...literal(skin.variables?.light),
          ...seeded(skin.variables, "dark"),
          ...literal(skin.variables?.dark),
        ],
  );

  done();
  return values;
}

/**
 * Все имена значений скина — обе половины разом.
 *
 * Нужны проверке: ссылка на ступень построенной шкалы обязана считаться известной, иначе
 * `var(--бренд-9)` уезжал бы в изъяны на каждом семенном скине. Имена, а не значения: проверке
 * важно, объявлено ли имя, и только.
 *
 * @param skin скин целиком
 */
export function valueNames(skin: Skin): Set<string> {
  return new Set([...skinValues(skin, "light").keys(), ...skinValues(skin, "dark").keys()]);
}
