import type { Component } from "solid-js";
import type { Part } from "./model";

export type PartRenderer<TPart extends Part = Part> = Component<{ readonly part: TPart }>;

// Хранится типостёртым до `PartRenderer<Part>` — сужение `TPart` → `Part` небезопасно формально,
// но безопасно по факту: `rendererOf` всегда ищут по ТОМУ ЖЕ `type`, которым `renderer` был
// зарегистрирован, так что часть на входе рендера всегда нужной формы. Тот же приём, что словарь
// загрузчиков иконок (`packages/ui/src/icon/components/root.tsx`).
const renderers = new Map<string, PartRenderer<Part>>();

/** Точка расширения ядра: фича зовёт один раз (обычно на модуле), дальше `PartView` находит
 *  рендер сама по `part.type` — ядро не правится под новый тип части. Повторная регистрация
 *  того же `type` заменяет предыдущий рендер, порядок вызовов не имеет значения. */
export function registerPart<TPart extends Part>(type: TPart["type"], renderer: PartRenderer<TPart>): void {
  renderers.set(type, renderer as PartRenderer<Part>);
}

export function rendererOf(type: string): PartRenderer<Part> | undefined {
  return renderers.get(type);
}
