// ПОВЕРХНОСТЬ пакета: механика скина целиком — модель, проверки, покрытие и порождение CSS.
//
// Порождение отдаёт ВЛОЖЕННУЮ форму, и postcss отсюда не тянется вовсе: браузер разворачивает
// вложенность сам (Baseline Widely Available с 11 июня 2026). Плоская форма — подпуть `./flat`.
//
// Кому не нужна даже печать, берёт `./model`.

export * from "./model.js";

export { SkinRefused, generateSketchCss, generateSkinCss } from "./generate.js";
