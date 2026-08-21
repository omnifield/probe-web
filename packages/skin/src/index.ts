// ПОВЕРХНОСТЬ пакета: механика скина целиком — модель, проверки, покрытие и порождение CSS.
//
// Порождение отдаёт ВЛОЖЕННУЮ форму, и postcss отсюда не тянется вовсе: браузер разворачивает
// вложенность сам (Baseline Widely Available с 11 июня 2026). Плоская форма — подпуть `./flat`.
//
// Кому не нужна даже печать, берёт `./model`.

export * from "./model.js";

export { SkinRefused, generateSketchCss, generateSkinCss } from "./generate.js";

// Читаемость живёт ЗДЕСЬ, а не в `./model`, и это то же правило: делит входы то, что попадёт в
// сборку потребителя. Формула контраста берётся у зоны значений (иначе «проверено» у нас и у
// того, кто ставит свой бренд, означало бы разное), а та зона тянет за собой Solid. Хранилищу,
// которому нужна только форма записи, платить за это не за что.
export type {
  ContrastAddress,
  ContrastNote,
  ContrastQuestion,
  ContrastReport,
  UncheckedQuestion,
  UnreckonableReason,
} from "./contrast.js";
export { INDISTINCT, skinContrast } from "./contrast.js";
