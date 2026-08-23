// КАРТА сетки: часть паспорта → компонент, которым она рисуется (`PWEB-84`).
//
// Имя части и имя компонента расходятся уже здесь: часть зовётся `cell`, компонент —
// `GridCell`. Это и есть тот разрыв, который карта закрывает у поставщика.

import { defineKitComponent } from "../kit-form.js";
import { passport } from "./grid.anatomy.js";
import { Grid, GridCell } from "./grid.jsx";

/** Паспорт сетки вместе с тем, чем рисуется каждая его часть. */
export const kit = defineKitComponent(passport, {
  root: Grid,
  cell: GridCell,
});
