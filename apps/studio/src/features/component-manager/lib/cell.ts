export interface Cell {
  /** Позиция в primary-оси — резолвит `primary[index]`, keying `<For>`. */
  readonly index: number;
  /** Стаб под стабильный id (сейчас `String(index)`, позже — variant.name/assembly.name). */
  readonly id: string;
}
