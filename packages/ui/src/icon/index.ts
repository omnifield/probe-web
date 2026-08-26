// Что уезжает из папки компонента наружу.
//
// Две разные вещи и два разных читателя: РАЗМЕТКУ забирает вход примитивов (`src/index.ts`),
// ПАСПОРТ — сборка подпути `./passport`, которая обходит папки и собирает перечень сама.

export { Icon, type IconProps } from "./icon.jsx";
export { anatomy, parts, passport } from "./icon.anatomy.js";
export { kit } from "./icon.kit.js";
