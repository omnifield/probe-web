// Design notes: ./README.md#presets
//
// Отдельная точка входа НАМЕРЕННО: единственная из всех, что тянет за собой сеть (`fetch`) и тип
// из `@omnifield/probe-web-runtime` (`SkinSource`) — тот же шов, что и у `./model`/`./flat`:
// точки входа делит не тема, а то, что из-за них едет в бандл потребителя. Тому, кому нужна
// только модель или только печать CSS, сетевой провод не должен доставаться бесплатно.

export { createPresetsSkinSource, PresetsDown, PresetsRefused, type PresetsSkinSourceOptions } from "./presets/source.js";
