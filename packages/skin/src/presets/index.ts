// Единственная точка входа, тянущая сеть (fetch). Разбор — FAQ.md.

export { createPresetsSkinSource, type PresetsSkinSourceOptions } from "./source.js";
export {
  createPresetsClient,
  PRESET_KIND,
  type PresetKind,
  type PresetRecord,
  type PresetsClient,
  type PresetsClientOptions,
} from "./client.js";
export { PresetsDown, PresetsRefused } from "./wire.js";
