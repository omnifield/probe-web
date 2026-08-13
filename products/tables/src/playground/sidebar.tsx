// СЛЕВА — список кейсов: что бывает, а не как это собрать.
//
// Замысел user 2026-08-13: человеку не объясняют устройство конструктора, ему показывают
// конкретные случаи. Нажал — фильтр собрался сам, и дальше его видно и можно править. Так
// разговор начинается с «мне нужно вот это», а не с «сначала прочитай, как работают условия».
//
// Колонка стоит ТОЛЬКО на странице отбора (решение user): на переходнике разговор про готовые
// отборы посторонний. Поэтому здесь нет и перехода между страницами — собранный фильтр видно
// там же, где на него нажали.
//
// Три вещи на карточке, и ДВЕ ИЗ НИХ СЧИТАЮТСЯ, а не пишутся руками:
//   • подпись и что кейс даёт — текст (`data.ts`);
//   • фраза отбора — из `describeFilter`, той же, что показывает итог;
//   • сколько оставит — из `applyFilter` на текущих строках.
// Написанное руками «оставит 7 строк» назавтра стало бы враньём: строки меняются, текст нет.

import { createMemo, For, Show } from "solid-js";

import { applyFilter, applyPreset, describeFilter, labelsOf } from "../filters/index.js";
import { COLUMNS, PRESETS } from "./data.js";
import type { Stand } from "./stand.js";

const LABELS = labelsOf(COLUMNS);

export interface SidebarProps {
  stand: Stand;
}

export function Sidebar(props: SidebarProps) {
  /** Что кейс сделает с ТЕКУЩИМ набором строк: считается на тех данных, что сейчас на экране. */
  const preview = createMemo(() => {
    const rows = props.stand.rows();
    return new Map(
      PRESETS.map((preset) => [
        preset.id,
        {
          phrase: describeFilter(preset.state, LABELS),
          left: applyFilter(rows, preset.state, { fields: COLUMNS }).rows.length,
          total: rows.length,
        },
      ]),
    );
  });

  return (
    <aside class="page__side" aria-label="Готовые отборы">
      <h2 class="page__side-title">Готовые отборы</h2>
      <p class="page__side-lead">
        Нажми на случай — фильтр соберётся сам. Дальше его можно править как свой: это обычные
        условия, а не особый режим.
      </p>

      <ul class="page__cases">
        <For each={PRESETS}>
          {(preset) => {
            const shown = () => preview().get(preset.id)!;

            return (
              <li>
                <button
                  type="button"
                  class="page__case"
                  data-case={preset.id}
                  onClick={() => props.stand.setFilter(applyPreset(preset))}
                >
                  <span class="page__case-label">{preset.label}</span>
                  <Show when={preset.hint}>
                    {(hint) => <span class="page__case-hint">{hint()}</span>}
                  </Show>
                  <span class="page__case-phrase">{shown().phrase}</span>
                  <span class="page__case-count">
                    оставит {shown().left} из {shown().total}
                  </span>
                </button>
              </li>
            );
          }}
        </For>
      </ul>
    </aside>
  );
}
