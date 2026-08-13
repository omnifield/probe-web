// Страница «Фильтры»: конструктор отбора и его результат.
//
// Про то, откуда приехали строки, страница не знает ничего — этим занята соседняя. В этом и
// утверждение стенда: отбор одинаков поверх любой формы данных, потому что словарь полей один.
//
// Готовые сборки конструктору НЕ передаём: они живут кейсами в сайдбаре (`sidebar.tsx`). Одна
// и та же вещь в двух местах экрана разъехалась бы на первой правке, а человек гадал бы, чем
// список слева отличается от чипов в панели. Шаблоны остаются здесь: они сначала спрашивают
// значения, и без конструктора им негде это сделать.

import { COLUMNS, TEMPLATES } from "../data.js";
import { FilterBuilder } from "../../filters/index.js";
import { StandResult } from "../result.jsx";
import type { Stand } from "../stand.js";

export function FiltersPage(props: { stand: Stand }) {
  return (
    <>
      <section class="page__panel">
        <FilterBuilder
          fields={COLUMNS}
          rows={props.stand.rows()}
          state={props.stand.filter()}
          onChange={props.stand.setFilter}
          templates={TEMPLATES}
        />
      </section>

      <StandResult stand={props.stand} />
    </>
  );
}
