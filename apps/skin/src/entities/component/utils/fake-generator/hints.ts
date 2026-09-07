// Подсказки для полей, которые зод-схема не валидирует (обычный `z.string()`, не email/телефон/
// имя) — zocker тут гадает вслепую, а у поля есть ожидаемая длина, известная только витрине:
// компонент сам её не объявляет и не должен (`label` кнопки и `label` кнопки-в-меню — оба просто
// `z.string()`, но кнопке нужно ~10 символов, а не 30).
//
// Ключ — точечный путь ("items.label"), не только поле верхнего уровня: `generate.ts` спускается
// сквозь object/array/optional/nullable сам, `zocker.supply()` матчит по ссылке на схему
// независимо от глубины.

export interface FieldHint {
  readonly length: number | readonly [number, number];
}

export type ComponentHints = Readonly<Record<string, FieldHint>>;

const HINTS: Readonly<Record<string, ComponentHints>> = {
  button: { label: { length: 10 } },
  avatar: { alt: { length: [10, 20] }, fallback: { length: 2 } },
  select: {
    label: { length: 10 },
    placeholder: { length: [10, 15] },
    "items.label": { length: 10 },
  },
  "segment-group": { label: { length: 10 }, "items.label": { length: 10 } },
  checkbox: { label: { length: [10, 15] } },
  typography: { text: { length: [20, 60] } },
  carousel: {
    "slide1.label": { length: 10 },
    "slide2.label": { length: 10 },
    "slide3.label": { length: 10 },
  },
};

export function hintsFor(component: string): ComponentHints | undefined {
  return HINTS[component];
}
