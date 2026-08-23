// Что уезжает из папки компонента наружу.
//
// Две разные вещи и два разных читателя: РАЗМЕТКУ забирает вход примитивов (`src/index.ts`),
// ПАСПОРТ — сборка подпути `./passport`, которая обходит папки и собирает перечень сама.

export { Surface, type SurfaceProps } from "./surface.jsx";
export { anatomy, parts, passport } from "./surface.anatomy.js";
export { kit } from "./surface.kit.js";
