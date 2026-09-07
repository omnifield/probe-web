
// Плоский объект под нативный `style` (Solid/DOM CSSProperties) — не `StyleObject` движка рецептов:
// тот допускает вложенность (`@media`, состояния) и `readonly`-поля, здесь всегда одна строка на
// свойство, вложенности нет и не будет (`layoutSelf`/`layoutGroup` пишут прямо на элемент, не
// порождают CSS-правило).
export type NativeStyle = Record<string, string>;

export type AlignPosition = "start" | "center" | "end" | "stretch" | "baseline";

export type ContentDistribution = "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly";

export type FlexDirection = "row" | "column";
