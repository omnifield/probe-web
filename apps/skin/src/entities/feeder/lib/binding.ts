export interface FieldBinding {
  readonly value: () => unknown;
  readonly onChange: (value: unknown) => void;
}

/** Binding одного элемента списка по индексу — читает/пишет `items()[index]`, запись уходит через
 *  `listBinding.onChange` целым новым массивом (индексы в путь не входят, элемент меняется только
 *  так). */
export function itemBinding(listBinding: FieldBinding, items: () => readonly unknown[], index: number): FieldBinding {
  return {
    value: () => items()[index],
    onChange: (next) => listBinding.onChange(items().map((current, i) => (i === index ? next : current))),
  };
}
