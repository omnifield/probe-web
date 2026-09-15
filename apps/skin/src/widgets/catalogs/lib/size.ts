import type { NativeStyle } from "@web-core/skin";

export type SlotSize = NativeStyle;

// Размер именно CarouselItemGroup (вьюпорт карусели), не слота целиком — слот (заголовок + контрол
// сборок + карусель) всегда виден полностью, без скролла; растёт/скроллится содержимое КАРУСЕЛИ.
// height фиксированная, не min-height: кнопка не должна раздувать вьюпорт под себя, а дерево с
// рекурсивной структурой — до бесконечности; и вьюпорт не должен прыгать при смене данных внутри
// (кол-во элементов листбокса/дерева) — прыгает содержимое ВНУТРИ, не сам вьюпорт и не витрина
// вокруг. Только `overflow-y` (не общий `overflow`) — по X у CarouselItemGroup уже `hidden` из
// рецепта карусели, это часть механики пролистывания страниц; открывать X сломало бы её.
//
// Список свой, слота — не чужой паспорт/футпринт (widgets сущностей не знает, см. DBP.md). Кто
// вызывает Slot, сам решает, какое имя из этого списка подходит его данным — контракт "как это имя
// выбирается" пока не придуман, имена оставлены такими же, как были у прежнего footprint-словаря.
export const SLOT_SIZES = {
  compact: { height: "16rem", "overflow-y": "auto" },
  regular: { height: "24rem", "overflow-y": "auto" },
  wide: { height: "32rem", "overflow-y": "auto" },
} as const satisfies Record<string, SlotSize>;

export type SlotSizeName = keyof typeof SLOT_SIZES;
