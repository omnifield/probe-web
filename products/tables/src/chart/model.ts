// Модель графика.
//
// Форма взята ПО ОБРАЗЦУ Vega-Lite — ближайшего к нам внешнего канона (проектная
// спецификация UW IDL, не свод органа; так и помечено в фонде). Заимствуется МОДЕЛЬ, а не
// код: данные → преобразование (отбор и сведение) → кодирование (что на какую ось) →
// выделение как ЗАПРОС К ДАННЫМ. Разбор — `TABLES-7`.
//
// Из грамматики взяты три вещи, каждая с дословной опорой:
//   • «Selection parameters define data queries…» — выделение это запрос к данным, а не
//     состояние интерфейса; поэтому клик по столбику у нас превращается в УСЛОВИЕ ФИЛЬТРА;
//   • «Aggregate summarizes a table as one record for each group» — сведение делается ДО
//     отрисовки, а не внутри неё;
//   • «all fields without aggregation function specified are treated as group-by fields» —
//     поле без функции сведения есть поле группировки; у нас это `slice`.
//
// Обязательной формы данных на входе рынок НЕ задаёт (пробел фонда, перебраны Vega, Arrow,
// CSVW, Tidy Data) — значит форму входа задаём мы, и она та же, что у таблицы: строки плюс
// словарь полей.

import type { AggregateKind, FieldRef } from "../dataset/index.js";

export type { AggregateKind, FieldRef, FieldSpec, Row } from "../dataset/index.js";

/**
 * Чем рисуем.
 *
 * Три марки первой волны. `bar` — сравнение величин по срезу, `line` — ход величины вдоль
 * упорядоченного среза, `point` — то же без связи между точками. Круговую диаграмму сюда не
 * берём: она сравнивает углы, а угол человек читает хуже длины, и на четырёх и более долях
 * ошибается систематически. Понадобится — заводится отдельным решением, а не «заодно».
 */
export type Mark = "bar" | "line" | "point";

/** Как упорядочить категории на оси среза. */
export type ChartOrder = "natural" | "label" | "value-asc" | "value-desc";

/** Версия формата описания графика. Поднимается при несовместимом изменении формы. */
export const CHART_FORMAT_VERSION = 1;

/** Мера: что считаем и чем сводим. Для `count` поле не нужно — считаются члены группы. */
export interface MeasureSpec {
  field?: FieldRef;
  aggregate: AggregateKind;
}

export interface ChartSpec {
  version: typeof CHART_FORMAT_VERSION;
  mark: Mark;
  /**
   * ИЗМЕРЕНИЕ — поле, по которому режем. Оно же ось категорий.
   *
   * Термины «измерение» и «мера» пришли не из грамматики графики: Vega-Lite их не вводит.
   * Как объявленную модель их даёт семантический слой (dbt MetricFlow и родня), и это
   * вендорские спецификации, а не свод органа — вендор-нейтральной нормы у рынка нет.
   */
  slice: FieldRef;
  measure: MeasureSpec;
  /** Разбивка на серии. Без неё серия одна. */
  series?: FieldRef;
  order?: ChartOrder;
  /** Сколько категорий показывать. Остальные сводятся в одну — «прочее». */
  limit?: number;
}

export const MARK_LABELS: Record<Mark, string> = {
  bar: "столбики",
  line: "линия",
  point: "точки",
};

export const ORDER_LABELS: Record<ChartOrder, string> = {
  natural: "как в данных",
  label: "по названию",
  "value-asc": "по возрастанию",
  "value-desc": "по убыванию",
};

/** Ключ категории, в которой собраны строки БЕЗ значения среза. */
export const MISSING_KEY = "\u0000missing";

/** Подпись такой категории. Пустоту показываем, а не выбрасываем молча. */
export const MISSING_LABEL = "нет значения";

/** Ключ категории «прочее», в которую сведён хвост за пределами `limit`. */
export const OTHER_KEY = "\u0000other";

export const OTHER_LABEL = "прочее";
