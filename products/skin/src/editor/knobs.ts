// РУЧКИ ЦВЕТА И МЕРЫ — то, что человек крутит, не зная слова «токен».
//
// ## Ручка — это не поле записи
//
// Запись говорит `scales.акцент`, `dimensions.radius`, `dimensions.density`. Человеку это ничего
// не сообщает: он крутит «главный цвет», «округлость», «просторность». Ручка переводит одно в
// другое и делает это в ОБЕ стороны — читает текущее значение и пишет новое.
//
// Чтение обратно обязательно. Ручка, умеющая только писать, показывала бы бодрое положение,
// которому в записи ничего не соответствует, — а человек правил бы вслепую и удивлялся исходу.
//
// ## Границы приходят из механики, а не из вкуса
//
// У плотности и высоты контрола пол ВЫВЕДЕН из нормы (WCAG 2.2, 2.5.8): ниже него нижняя ступень
// перестаёт быть достижимой целью. Механика знает это числом вместе с причиной (`AXES`), поэтому
// ползунок берёт границы у неё. Впиши мы свои — они разъехались бы с нормой на первой же правке
// шкалы, и правым оказался бы тот, кого спросили последним.
//
// ## Текучее семя ползунком не крутится
//
// Семя, объявленное полюсами, — это четыре числа (два значения, две ширины), и одного ползунка
// им мало. Врать одним числом нельзя: человек подвинул бы его и не понял, какой полюс поехал.
// Такие ручки показывают вычисленные края (`6px → 8px`) и отправляют за правкой в тонкую
// настройку — там четыре поля, и каждое названо.

import { axisOf } from "@omnifield/probe-web-style";
import {
  fluidPoles,
  isFluid,
  SCALE_ROLES,
  type DimensionSeed,
  type Palette,
} from "@omnifield/probe-web-skin/model";

/** Как человек зовёт намерение. Имена ролей машинные, а это подписи — им место здесь. */
const ЦВЕТА: Readonly<Record<string, string>> = {
  акцент: "главный",
  нейтраль: "нейтральный",
  опасность: "опасность",
  успех: "успех",
  предупреждение: "предупреждение",
};

/** Как человек зовёт меру, и в каком порядке меры показывать. */
const МЕРЫ: readonly { seed: string; title: string; means: string }[] = [
  { seed: "radius", title: "округлость", means: "насколько скруглены углы" },
  { seed: "density", title: "просторность", means: "сколько воздуха внутри и между" },
  { seed: "border-width", title: "толщина линий", means: "рамки и разделители" },
  { seed: "space", title: "шаг отступов", means: "ритм внутренних отступов" },
  { seed: "font-size", title: "кегль", means: "основной размер текста" },
  { seed: "control-height", title: "высота контролов", means: "кнопки, поля ввода" },
  { seed: "column", title: "ширина колонки", means: "средняя ширина знака" },
  { seed: "tracking", title: "межбуквенный", means: "разрежённость текста" },
];

/** Цветовая ручка: одно намерение. */
export interface ColorKnob {
  readonly role: string;
  readonly title: string;
  /** Семя намерения — то, из чего механика строит всю лестницу. */
  readonly seed: string;
}

/** Границы меры — вместе с причиной, если её назвала норма. */
export interface Bounds {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly unit: string;
  /**
   * Чем держится пол — НОРМА и причина вместе. Пусто, если границу назвала не норма.
   *
   * Обе части: ссылка на критерий отвечает «кто сказал», причина — «почему именно столько».
   * Одна причина без ссылки читается как наше мнение, одна ссылка без причины — как заклинание.
   */
  readonly why?: string;
}

/** Мерная ручка: одно семя размера. */
export interface SizeKnob {
  readonly seed: string;
  readonly title: string;
  readonly means: string;
  /** Число под ползунком; `null` — семя текучее, одним числом его не выразить. */
  readonly amount: number | null;
  /** Единица записи (`rem`, `px`, множитель — пусто). */
  readonly unit: string;
  /** Что показать вместо ползунка у текучего семени: `15px → 16px`. */
  readonly poles: string | null;
  readonly bounds: Bounds | null;
}

/** Разбирает `0.5rem` на число и единицу. Не разобралось — значит крутить нечем. */
function measure(value: string): { amount: number; unit: string } | null {
  const match = /^\s*(-?\d*\.?\d+)\s*([a-z%]*)\s*$/iu.exec(value);
  const amount = match ? Number(match[1]) : Number.NaN;

  return Number.isFinite(amount) ? { amount, unit: match?.[2] ?? "" } : null;
}

/** Семя намерения — строкой, чем бы оно ни было объявлено. */
function seedOf(declaration: unknown): string {
  return typeof declaration === "string" ? declaration : String((declaration as { seed?: string })?.seed ?? "");
}

/**
 * Цветовые ручки палитры — по одной на намерение словаря.
 *
 * Перечень словарный, а не наш: заведи механика шестое намерение — ручка появится сама, а не
 * после того, как мы про неё вспомним.
 *
 * @param palette палитра под правкой
 */
export function colorKnobs(palette: Palette): ColorKnob[] {
  return SCALE_ROLES.map((role) => ({
    role,
    title: ЦВЕТА[role] ?? role,
    seed: seedOf(palette.scales?.[role]),
  }));
}

/**
 * Границы меры — из механики. `null`, если ось безгранична с обеих сторон.
 *
 * Шаг ползунка берётся от единицы: `rem` крутится сотыми, пиксели — целыми. Это единственное
 * число, придуманное здесь, и придумано оно про удобство руки, а не про законность значения.
 */
function boundsOf(seed: string, unit: string): Bounds | null {
  const axis = axisOf(seed);

  if (!axis) return null;

  const пол = axis.floor.value;
  const потолок = axis.ceiling.value;
  const шаг = unit === "px" ? 1 : unit === "" ? 0.05 : 0.0625;

  return {
    min: пол ?? 0,
    max: потолок ?? (unit === "px" ? 24 : unit === "" ? 2 : 4),
    step: шаг,
    unit,
    ...(axis.floor.kind === "норма"
      ? { why: `${axis.floor.norm ?? "норма"}. ${axis.floor.why}` }
      : {}),
  };
}

/**
 * Мерные ручки палитры — по одной на семя размера.
 *
 * @param palette палитра под правкой
 */
export function sizeKnobs(palette: Palette): SizeKnob[] {
  return МЕРЫ.map(({ seed, title, means }) => {
    const declaration: DimensionSeed | undefined = palette.dimensions?.[seed];

    if (declaration !== undefined && isFluid(declaration)) {
      const отчёт = fluidPoles(seed, declaration);

      return {
        seed,
        title,
        means,
        amount: null,
        unit: "",
        poles: отчёт ? `${отчёт.narrow.px}px → ${отчёт.wide.px}px` : "текучее",
        bounds: null,
      };
    }

    const разобрано = declaration === undefined ? null : measure(declaration);

    return {
      seed,
      title,
      means,
      amount: разобрано?.amount ?? null,
      unit: разобрано?.unit ?? "",
      poles: null,
      bounds: разобрано ? boundsOf(seed, разобрано.unit) : null,
    };
  });
}

/**
 * Меняет семя намерения — новой палитрой, старая не трогается.
 *
 * @param palette палитра
 * @param role имя намерения
 * @param seed новое семя
 */
export function withColor(palette: Palette, role: string, seed: string): Palette {
  return { ...palette, scales: { ...palette.scales, [role]: seed } };
}

/**
 * Меняет меру — новой палитрой.
 *
 * Единица сохраняется от прежнего значения: крутится ЧИСЛО, а не запись. Подставь мы `px` там,
 * где было `rem`, лестница перестала бы следовать за настройкой кегля у человека — и он узнал бы
 * об этом не здесь, а у себя в браузере.
 *
 * @param palette палитра
 * @param seed имя семени
 * @param amount новое число
 * @param unit единица записи
 */
export function withSize(palette: Palette, seed: string, amount: number, unit: string): Palette {
  return {
    ...palette,
    dimensions: { ...palette.dimensions, [seed]: `${Number(amount.toFixed(4))}${unit}` },
  };
}
