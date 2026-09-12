import type { NativeStyle } from "@web-core/skin";
import type { ComponentFootprint } from "@web-core/skin/editor";
import { footprintOf } from "@web-core/skin/editor";
import { editorInfoOf } from "@web-core/ui/passport";

export type SlotSize = NativeStyle;

// Размер именно CarouselItemGroup (вьюпорт карусели), не слота целиком — слот (заголовок + контрол
// сборок + карусель) всегда виден полностью, без скролла; растёт/скроллится содержимое КАРУСЕЛИ.
// height фиксированная, не min-height: кнопка не должна раздувать вьюпорт под себя, а дерево с
// рекурсивной структурой — до бесконечности; и вьюпорт не должен прыгать при смене данных внутри
// (кол-во элементов листбокса/дерева) — прыгает содержимое ВНУТРИ, не сам вьюпорт и не витрина
// вокруг. Только `overflow-y` (не общий `overflow`) — по X у CarouselItemGroup уже `hidden` из
// рецепта карусели, это часть механики пролистывания страниц; открывать X сломало бы её.
//
// Не токен шкалы скина: footprint — срез паспорта/кита, не палитры, готовой размерной шкалы под
// "сколько места нужно превью" в @web-core/style нет (column-* там про читаемую ширину текста, не
// про высоту блока) — просто rem, подобранные на глаз под каждый футпринт.
const SIZES: Readonly<Record<ComponentFootprint, SlotSize>> = {
  compact: { height: "16rem", "overflow-y": "auto" },
  regular: { height: "24rem", "overflow-y": "auto" },
  wide: { height: "32rem", "overflow-y": "auto" },
};

/** Размер вьюпорта карусели слота — по футпринту компонента (нет среза редактора → как "regular"). */
export function getSize(component: string): SlotSize {
  const editorInfo = editorInfoOf(component);
  const footprint = editorInfo ? footprintOf(editorInfo) : "regular";
  return SIZES[footprint];
}
