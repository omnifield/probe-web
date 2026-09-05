import {
  CONTROL_TARGET_MIN,
  DENSITY_CEILING,
  DENSITY_FLOOR,
  DENSITY_TOKEN,
  DERIVED_SCALES,
} from "./dimension.js";

export type BoundKind =
  | "норма"
  | "предел поддержки"
  | "практический предел"
  | "границы нет";

export interface AxisBound {
  value: number | null;
  kind: BoundKind;
  norm: string | null;
  why: string;
}

export interface Axis {
  token: string;
  unit: string;
  floor: AxisBound;
  ceiling: AxisBound;
  continuous: boolean;
}

const controlSmallest = DERIVED_SCALES.find((scale) => scale.seed === "control-height")!.steps.find(
  (step) => step.name === "control-height-sm",
)!;

const CONTROL_FACTOR = "factor" in controlSmallest ? controlSmallest.factor : Number.NaN;

const CONTROL_SEED_FLOOR = Number.parseFloat(CONTROL_TARGET_MIN.value) / CONTROL_FACTOR;

const unbounded = (why: string): AxisBound => ({ value: null, kind: "границы нет", norm: null, why });

export const AXES: readonly Axis[] = [
  {
    token: DENSITY_TOKEN,
    unit: "множитель",
    floor: {
      value: DENSITY_FLOOR,
      kind: "норма",
      norm: "WCAG 2.2, 2.5.8 Target Size (Minimum), AA",
      why: "нижняя ступень контрола (`семя × 0.8 × плотность`) обязана остаться не ниже минимального размера цели 24×24 CSS-пикселя. При нынешнем семени 2.5rem это даёт ровно 0.75, и запаса на этой границе нет: она посчитана, а не выбрана",
    },
    ceiling: {
      value: DENSITY_CEILING,
      kind: "предел поддержки",
      norm: null,
      why: "верх диапазона, на котором прогоняются пробы и который зона обещает. Крупнее ничего не нарушает — норма сверху не ограничивает вовсе; выше просто кончаются наши проверки, а не законность значения",
    },
    continuous: true,
  },
  {
    token: "radius",
    unit: "rem",
    floor: unbounded(
      "прямой угол (0) законен и требований к скруглению нет ни одного. Отрицательного радиуса не бывает по правилам CSS, но это правило языка, а не наша граница",
    ),
    ceiling: {
      value: null,
      kind: "практический предел",
      norm: null,
      why: "радиус больше половины меньшей стороны элемента даёт пилюлю — дальше форма не меняется. Это свойство геометрии, а НЕ требование доступности, и числом база его назвать не может: половина зависит от элемента, а не от токена",
    },
    continuous: true,
  },
  {
    token: "space",
    unit: "rem",
    floor: unbounded(
      "шаг ритма отступов ничем не нормирован. Разнесение целей 2.5.8 нормирует, но нормирует оно ЦЕЛИ в готовом оформлении, а не шаг шкалы: расстояние между целями складывается у потребителя, и отвечает за него он",
    ),
    ceiling: unbounded("сверху ритм не ограничен ничем: просторнее не хуже"),
    continuous: true,
  },
  {
    token: "font-size",
    unit: "rem",
    floor: unbounded(
      "минимального кегля у WCAG 2.2 нет ВОВСЕ (сверено 2026-08-18). Единственный критерий про размер текста — 1.4.4 Resize Text — требует возможности увеличить текст вдвое, а не запрещает мелкий; вся шкала выражена в rem, поэтому настройка пользователя уважается при любом семени. Мелкий кегль остаётся решением того, кто его поставил",
    ),
    ceiling: unbounded("крупнее не хуже: сверху ни один критерий не ограничивает"),
    continuous: true,
  },
  {
    token: "column",
    unit: "rem",
    floor: unbounded(
      "семя — средняя ширина знака у гарнитуры темы, а не выбор вида: связывающей нормы у него нет и быть не может. Поставить его неверно можно — тогда число в имени ступени перестанет соответствовать действительности, но это расхождение с фактом шрифта, а не с нормой",
    ),
    ceiling: unbounded(
      "сверху семя не ограничено. Ограничена сама КОЛОНКА, и не нашим потолком: 1.4.8 Visual Presentation (AAA) держит строку не длиннее 80 знаков — это про ступени, а не про семя, и верхняя ступень ряда (56 знаков) в этот потолок укладывается вдвое",
    ),
    continuous: true,
  },
  {
    token: "control-height",
    unit: "rem",
    floor: {
      value: CONTROL_SEED_FLOOR,
      kind: "норма",
      norm: "WCAG 2.2, 2.5.8 Target Size (Minimum), AA",
      why: "нижняя ступень равна `семя × 0.8` и обязана быть не ниже 1.5rem уже при плотности 1 → семя ≥ 1.875rem. Пол ПОДВИЖЕН: он растёт вместе с уменьшением плотности, и на нижней границе оси (0.75) равен 2.5rem — ровно нынешнему семени. Крутить семя и плотность вниз ОДНОВРЕМЕННО нельзя: границы не складываются, они перемножаются",
    },
    ceiling: unbounded("выше нормы нет: цель крупнее минимума нормой не ограничена"),
    continuous: true,
  },
  {
    token: "border-width",
    unit: "px",
    floor: unbounded(
      "толщина границы нормой не связана. 1.4.11 Non-text Contrast говорит про КОНТРАСТ различимой границы, а не про её толщину — тонкая, но контрастная граница норму держит",
    ),
    ceiling: unbounded(
      "сверху нормой не ограничена: толстая граница ничего не нарушает. Разумный верх задаёт сам элемент — граница шире половины его меньшей стороны съедает содержимое, но это геометрия, а не норма",
    ),
    continuous: true,
  },
  {
    token: "tracking",
    unit: "em",
    floor: unbounded(
      "межбуквенный интервал нормой не связан. 1.4.12 Text Spacing требует, чтобы содержимое не ломалось, когда ПОЛЬЗОВАТЕЛЬ выставит свой интервал (0.12em) поверх нашего — это требование к вёрстке потребителя, а не граница нашего семени",
    ),
    ceiling: unbounded(
      "сверху не ограничен: разреженный текст нормы не нарушает. Где он перестаёт читаться — вопрос вкуса и гарнитуры, а не критерия, и решает его тот, кто крутил",
    ),
    continuous: true,
  },
];

export function axisOf(token: string): Axis | undefined {
  return AXES.find((axis) => axis.token === token);
}

