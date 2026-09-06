// Подсказки для полей, которые зод-схема не валидирует (обычный `z.string()`, не email/телефон/
// имя) — zocker тут гадает вслепую, а у поля есть ожидаемая длина, известная только витрине:
// компонент сам её не объявляет и не должен (`label` кнопки и `label` кнопки-в-меню — оба просто
// `z.string()`, но кнопке нужно ~10 символов, а не 30).

export interface FieldHint {
  readonly length: number | readonly [number, number];
}

export type ComponentHints = Readonly<Record<string, FieldHint>>;

const HINTS: Readonly<Record<string, ComponentHints>> = {
  button: { label: { length: 10 } },
};

export function hintsFor(component: string): ComponentHints | undefined {
  return HINTS[component];
}
