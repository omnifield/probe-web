// Что уезжает из папки компонента наружу.
//
// Две разные вещи и два разных читателя: РАЗМЕТКУ забирает вход примитивов (`src/index.ts`),
// ПАСПОРТ — сборка подпути `./passport`, которая обходит папки и собирает перечень сама.

export { Grid, GridCell, type GridCellProps, type GridProps } from "./grid.jsx";
export { anatomy, parts, passport } from "./grid.anatomy.js";
export { kit } from "./grid.kit.js";
