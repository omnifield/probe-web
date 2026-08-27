// Что уезжает из папки компонента наружу.
//
// Две разные вещи и два разных читателя: РАЗМЕТКУ забирает вход примитивов (`src/index.ts`),
// ПАСПОРТ — сборка подпути `./passport`, которая обходит папки и собирает перечень сама.

export { Flow, FlowItem, type FlowItemProps, type FlowProps } from "./components/index.jsx";
export { kit } from "./components/kit.js";
export { anatomy, anatomyParts, passport } from "./entity";
