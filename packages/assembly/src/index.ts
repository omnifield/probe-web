// ПОВЕРХНОСТЬ пакета: механика сборки целиком — модель, правила, правки и отрисовка.
//
// Кому отрисовка не нужна, берёт подпуть `./model`: он тот же самый, но без Solid.

export * from "./model.js";

export type {
  EditOverlayProps,
  ErrorFallbackProps,
  FallbackProps,
  RenderTreeProps,
} from "./render.jsx";
export { RenderTree } from "./render.jsx";
