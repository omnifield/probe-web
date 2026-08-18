// Полный перечень семейств стенда, упорядоченный ПО ГРУППАМ.
//
// Порядок здесь — порядок вкладок и разделов витрины. Сортировка по группе, внутри группы —
// порядок объявления: сначала то, что появилось раньше и потому привычнее.

import { CONTROL_SPECIMENS } from "./controls.jsx";
import { FEEDBACK_SPECIMENS } from "./feedback.jsx";
import { FORM_SPECIMENS } from "./forms.jsx";
import { ICON_SPECIMENS } from "./icons.jsx";
import { INPUT2_SPECIMENS } from "./inputs2.jsx";
import { GROUPS, type Group, type Specimen } from "./model.js";
import { OVERLAY_SPECIMENS } from "./overlays.jsx";
import { STRUCTURE_SPECIMENS } from "./structure.jsx";

export type { Case, Group, Specimen } from "./model.js";
export { GROUPS } from "./model.js";

const ALL: Specimen[] = [
  ...CONTROL_SPECIMENS,
  ...FORM_SPECIMENS,
  ...INPUT2_SPECIMENS,
  ...FEEDBACK_SPECIMENS,
  ...OVERLAY_SPECIMENS,
  ...STRUCTURE_SPECIMENS,
  ...ICON_SPECIMENS,
];

export const SPECIMENS: Specimen[] = GROUPS.flatMap((group) =>
  ALL.filter((specimen) => specimen.group === group),
);

/** Семейства одной группы — для разделов витрины и разметки полосы вкладок. */
export function byGroup(group: Group): Specimen[] {
  return SPECIMENS.filter((specimen) => specimen.group === group);
}

/** Все зацепки, которые стенд показывает хотя бы одним кейсом. */
export const SHOWN_SLOTS: readonly string[] = [...new Set(SPECIMENS.flatMap((s) => s.slots))];
