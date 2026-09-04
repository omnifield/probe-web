// Design notes: ./README.md#solid
//
// ПОВЕРХНОСТЬ SOLID-ОБВЕСА — тот же приём, что у `@web-core/style/solid`: движок (`.`, `./wear`)
// фреймворка не знает и не тянет, `solid-js` — опциональный peer ровно этого подпути. Появится
// обвес под другой фреймворк — ляжет рядом своим подпутём, а не сюда.

export { createSkinConnection, type SkinConnection } from "./solid/connection.js";
