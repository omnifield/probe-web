import type { ComponentFootprint } from "@web-core/skin/editor";
import { footprintOf } from "@web-core/skin/editor";
import { editorInfoOf } from "@web-core/ui/passport";

export interface SlotSize {
  readonly width: string;
  readonly height: string;
}

// Заготовка — значения одинаковые для всех трёх футпринтов, реальные размеры под каждый
// продумываем следующим заходом. Сейчас важна сама привязка (footprint → размер), не числа.
const SIZES: Readonly<Record<ComponentFootprint, SlotSize>> = {
  compact: { width: "auto", height: "auto" },
  regular: { width: "auto", height: "auto" },
  wide: { width: "auto", height: "auto" },
};

/** Размер слота показа для компонента — по его футпринту (нет среза редактора → как "regular"). */
export function slotSizeOf(component: string): SlotSize {
  const editorInfo = editorInfoOf(component);
  const footprint = editorInfo ? footprintOf(editorInfo) : "regular";
  return SIZES[footprint];
}
