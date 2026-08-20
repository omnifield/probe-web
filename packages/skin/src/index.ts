// ПОВЕРХНОСТЬ пакета: механика скина целиком — модель, проверки и порождение CSS.
//
// Кому порождение не нужно, берёт подпуть `./model`: он тот же самый, но без `@pandacss/core` и
// его спутников.

export * from "./model.js";

export { SkinRefused, generateSketchCss, generateSkinCss } from "./generate.js";
