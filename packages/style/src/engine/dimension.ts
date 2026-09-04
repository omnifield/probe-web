export type DerivedStep =
  | { name: string; factor: number }
  | { name: string; offset: string }
  | { name: string; value: string };

export interface DerivedScale {
  seed: string;
  density: boolean;
  snap: boolean;
  basis: string;
  steps: DerivedStep[];
}

export const DERIVED_SCALES: readonly DerivedScale[] = [
  {
    seed: "radius",
    density: false,
    snap: false,
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
    density: true,
    snap: true,
    basis:
      "сетка 0.25rem — семя равно шагу сетки, а имя ступени равно её множителю: `--space-6` это шесть шагов сетки; после умножения плотностью значение возвращается на ту же сетку 0.25rem",
    steps: [
      { name: "space-1", factor: 1 },
      { name: "space-2", factor: 2 },
      { name: "space-3", factor: 3 },
      { name: "space-4", factor: 4 },
      { name: "space-6", factor: 6 },
      { name: "space-8", factor: 8 },
      { name: "space-12", factor: 12 },
      { name: "space-16", factor: 16 },
      { name: "space-24", factor: 24 },
      { name: "space-32", factor: 32 },
    ],
  },
  {
    seed: "font-size",
    density: true,
    snap: false,
    basis:
      "отношения к базовому кеглю; семя в rem — оно масштабируется корневым размером шрифта, то есть уважает настройку пользователя (WCAG 2.2, 1.4.4 Resize Text); умножается плотностью, но на сетку 0.25rem не садится — шаг сетки разрушил бы сами отношения",
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
    seed: "column",
    density: true,
    snap: true,
    basis:
      "читаемая колонка: семя — средняя ширина одного знака при базовом кегле, имя ступени равно числу знаков (`--column-40` — сорок знаков). Из кратности интервалу ширина не выводится: ритм отступов к длине строки отношения не имеет. Верх ряда — 56 знаков, вдвое ниже потолка в 80 знаков (WCAG 2.2, 1.4.8 Visual Presentation, AAA); после умножения плотностью значение возвращается на сетку 0.25rem",
    steps: [
      { name: "column-24", factor: 24 },
      { name: "column-32", factor: 32 },
      { name: "column-40", factor: 40 },
      { name: "column-48", factor: 48 },
      { name: "column-56", factor: 56 },
    ],
  },
  {
    seed: "control-height",
    density: true,
    snap: true,
    basis:
      "отношения к базовой высоте контрола, значение возвращается на сетку 0.25rem; нижняя ступень при плотности 1 даёт 2rem — выше минимального размера цели 24×24 CSS-пикселя (WCAG 2.2, 2.5.8), и не опускается ниже него до самой нижней границы оси",
    steps: [
      { name: "control-height-sm", factor: 0.8 },
      { name: "control-height-md", factor: 1 },
      { name: "control-height-lg", factor: 1.2 },
    ],
  },
  {
    seed: "border-width",
    density: false,
    snap: false,
    basis: "кратные семени; толщина границы не масштабируется плотностью — иначе плотный режим её стирает",
    steps: [
      { name: "border-width-1", factor: 1 },
      { name: "border-width-2", factor: 2 },
      { name: "border-width-4", factor: 4 },
    ],
  },
  {
    seed: "tracking",
    density: false,
    snap: false,
    basis: "смещения от нормального трекинга в em — межбуквенный интервал следует за кеглем",
    steps: [
      { name: "tracking-tight", offset: "- 0.01em" },
      { name: "tracking-normal", offset: "" },
      { name: "tracking-wide", offset: "+ 0.025em" },
    ],
  },
];

export type SpaceRole =
  | "item-stack-gap"
  | "control-inline-gap"
  | "compact-padding-block"
  | "compact-padding-inline"
  | "section-gap"
  | "control-padding-inline"
  | "listbox-inset"
  | "content-container-padding"
  | "card-padding"
  | "panel-padding"
  | "modal-padding"
  | "page-margin-narrow"
  | "page-margin-wide"
  | "layout-gap";

export interface SpaceRoleEntry {
  readonly step: string;
  readonly means: string;
}

export const SPACE_ROLES: Readonly<Record<SpaceRole, SpaceRoleEntry>> = {
  "item-stack-gap": {
    step: "space-1",
    means: "зазор между соседними пунктами списка/группы — секции аккордеона, пункты меню/селекта, вкладки-список, файлы в списке загрузки",
  },
  "listbox-inset": {
    step: "space-1",
    means: "внешняя рамка панели, несущей СВОИ пункты (список меню/селекта, вкладки-панель) — пункты уже несут собственную набивку",
  },
  "control-inline-gap": {
    step: "space-2",
    means: "зазор между иконкой и подписью внутри ОДНОГО интерактивного контрола",
  },
  "compact-padding-block": {
    step: "space-2",
    means: "вертикальная набивка компактного (sm) контрола или ячейки списка/таблицы",
  },
  "compact-padding-inline": {
    step: "space-3",
    means: "горизонтальная набивка компактного (sm) контрола или ячейки списка/таблицы — в паре с `control-height-sm`",
  },
  "section-gap": {
    step: "space-3",
    means: "зазор между крупными частями ОДНОГО составного компонента — трек/контролы/индикаторы карусели, список/панель вкладок",
  },
  "control-padding-inline": {
    step: "space-4",
    means: "горизонтальная набивка крупного самостоятельного контрола (кнопка, триггер аккордеона/селекта/вкладок/поповера/меню/загрузки файла) — в паре с `control-height-md`",
  },
  "content-container-padding": {
    step: "space-4",
    means: "набивка контейнера свободного содержимого — попап, поверхность",
  },
  "card-padding": {
    step: "space-6",
    means: "набивка карточки — например зона перетаскивания файла",
  },
  "panel-padding": {
    step: "space-8",
    means: "зазор между виджетами на странице",
  },
  "modal-padding": {
    step: "space-12",
    means: "набивка модалки, зазор между секциями страницы",
  },
  "page-margin-narrow": {
    step: "space-16",
    means: "внешние поля страницы на узком экране",
  },
  "page-margin-wide": {
    step: "space-24",
    means: "внешние поля страницы на широком экране",
  },
  "layout-gap": {
    step: "space-32",
    means: "зазор между крупными блоками лэйаута",
  },
};

{
  const spaceStepNames = new Set(
    DERIVED_SCALES.find((scale) => scale.seed === "space")!.steps.map((step) => step.name),
  );

  for (const [role, entry] of Object.entries(SPACE_ROLES)) {
    if (!spaceStepNames.has(entry.step)) {
      throw new Error(`роль отступа «${role}» называет несуществующую ступень «${entry.step}»`);
    }
  }
}

export const CONTROL_TARGET_MIN = {
  name: "control-target-min",
  value: "1.5rem",
  note: "минимальный размер цели 24×24 CSS-пикселя — WCAG 2.2, 2.5.8 Target Size (Minimum), AA. Не масштабируется ничем: это пол нормы, а не наша ступень",
} as const;

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
  CONTROL_TARGET_MIN,
];

export const DENSITY_TOKEN = "density";

export const DENSITY_DEFAULT = "1";

export const GRID_STEP = "0.25rem";

export const GRID_NOTE =
  "значения плотных шкал возвращаются на сетку 0.25rem: произвольный множитель даёт дробь, и соседние элементы, посчитанные от разных ступеней, перестают попадать друг в друга. Кегль на сетку НЕ садится — он задан отношениями к базовому, а шаг сетки эти отношения разрушает: уже при плотности 1 sm совпал бы с md, а lg с xl.";

export const ROUND_SUPPORT_TEST = `(width: round(nearest, 1rem, ${GRID_STEP}))`;

export const ROUND_FALLBACK_NOTE =
  "значение плотной шкалы объявлено дважды. Первым — без округления: его берёт браузер, который round() не поддерживает, и получает дробное, но ЖИВОЕ значение. Вторым, под @supports, — то же значение на сетке 0.25rem: его берёт браузер с поддержкой, потому что @supports специфичности не добавляет и побеждает объявление, стоящее позже. Порядок обязателен именно поэтому. Без подстраховки браузер без round() не получал бы ничего: недействительное значение делает свойство невычислимым, и элемент едет на унаследованном или начальном — геометрия не ухудшается, а исчезает. round() — Baseline newly available с мая 2024 (все три движка), до widely available ещё не дошло.";

export const DENSITY_FLOOR = 0.75;

export const DENSITY_CEILING = 1.5;

export const DENSITY_NOTE =
  "плотность — равномерное изменение всей вещи, поэтому ось берёт и геометрию, и типографику. Умножает: интервалы, высоты контролов, кегль, ширины колонок. Форму она не трогает — скругления, толщины границ и трекинг: это форма, а не размер. Прежнее основание («кегль не трогаем, иначе 1.4.4 Resize Text») снято сознательно и с причиной: 1.4.4 требует возможности увеличить текст вдвое, а не запрещает множитель меньше единицы, и вся шкала выражена в rem — настройка пользователя уважается при любой плотности. Размер текста защищает не запрет оси, а её нижняя граница, и та выведена из нормы 2.5.8, а не назначена.";

export const DERIVED_TOKENS: readonly string[] = DERIVED_SCALES.flatMap((scale) =>
  scale.steps.map((step) => step.name),
);

