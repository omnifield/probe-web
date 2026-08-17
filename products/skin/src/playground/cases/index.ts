// Полный перечень семейств стенда. Порядок здесь — порядок вкладок и порядок на «Всё».

import { CONTROL_SPECIMENS } from "./controls.jsx";
import { FORM_SPECIMENS } from "./forms.jsx";
import type { Specimen } from "./model.js";
import { OVERLAY_SPECIMENS } from "./overlays.jsx";

export type { Case, Specimen } from "./model.js";

export const SPECIMENS: Specimen[] = [
  ...CONTROL_SPECIMENS,
  ...FORM_SPECIMENS,
  ...OVERLAY_SPECIMENS,
];

/** Все зацепки, которые стенд показывает хотя бы одним кейсом. */
export const SHOWN_SLOTS: readonly string[] = [
  ...new Set(SPECIMENS.flatMap((s) => s.slots)),
];
