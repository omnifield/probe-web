// ПОВЕРХНОСТЬ пакета: механика сборки целиком — модель, правила, правки и отрисовка.
//
// Кому отрисовка не нужна, берёт подпуть `./model`: он тот же самый, но без Solid.

export * from "./model/index.js";

export type {
  EditOverlayProps,
  ErrorFallbackProps,
  FallbackProps,
  RenderTreeProps,
  SlotEntry,
  SlotPlacement,
} from "./render/index.jsx";
export { RenderTree } from "./render/index.jsx";
