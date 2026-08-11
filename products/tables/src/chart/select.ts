// Выделение на графике — ЗАПРОС К ДАННЫМ, а не состояние интерфейса.
//
// Это дословная норма Vega-Lite: «Selection parameters define data queries that are driven by
// direct manipulation user input (e.g., mouse clicks or drags)», и там же выделение
// композируется с `filter`-преобразованием. У нас язык запроса уже есть — это модуль
// фильтров. Значит клик по столбику превращается в УСЛОВИЕ ФИЛЬТРА, и дальше его одинаково
// понимают и таблица, и сам график: одна механика вместо второй ветки логики.
//
// Из этого же следует связь представлений (у Vega-Lite её задаёт `resolve`): нам не нужен
// отдельный механизм «клик на графике меняет таблицу» — обе смотрят в одно состояние отбора.

import { type Condition, nextConditionId } from "../filters/index.js";
import { MISSING_KEY, OTHER_KEY } from "./model.js";
import type { ChartSpec } from "./model.js";

/** Что выделили: категория среза и, если есть, серия. */
export interface ChartSelection {
  key: string;
  label: string;
  seriesKey?: string;
  seriesLabel?: string;
}

/**
 * Превратить выделение в условие отбора.
 *
 * `null` — выделение в условие не переводится: «прочее» это НАШ ярлык для хвоста категорий,
 * а не значение поля, и «нет значения» тоже не значение. Для первого условия пришлось бы
 * перечислять хвост, для второго — спрашивать про отсутствие поля; и то и другое собирается
 * в конструкторе руками и осознанно, а не молча по клику.
 */
export function selectionCondition(spec: ChartSpec, selection: ChartSelection): Condition | null {
  if (selection.key === OTHER_KEY || selection.key === MISSING_KEY) return null;

  return {
    id: nextConditionId(),
    kind: "compare",
    field: spec.slice,
    operator: "eq",
    value: selection.key,
    // Регистр учитываем: ключ взят из самих данных, а не набран человеком, и «Москва» здесь
    // означает ровно то значение, которое в поле лежит.
    sensitive: true,
  };
}

/**
 * Условие по серии — второе измерение выделения.
 *
 * Отдаётся отдельно, а не склеивается с первым: два условия в плоском списке читаются, а
 * склеенное «регион = Москва и статус = новая» одним пунктом — уже нет.
 */
export function seriesCondition(spec: ChartSpec, selection: ChartSelection): Condition | null {
  if (spec.series === undefined || selection.seriesKey === undefined) return null;
  if (selection.seriesKey === MISSING_KEY || selection.seriesKey === "") return null;

  return {
    id: nextConditionId(),
    kind: "compare",
    field: spec.series,
    operator: "eq",
    value: selection.seriesKey,
    sensitive: true,
  };
}
