/** Лист — незачем спускаться глубже. `Date`/`RegExp` читаются одним значением. */
type Leaf = string | number | boolean | bigint | symbol | null | undefined | Date | RegExp;

/** `T` без опциональности и без одного слоя массива — форма, реально достижимая по имени. */
type Elem<T> = NonNullable<T> extends readonly (infer Item)[] ? Item : NonNullable<T>;

type Prev6 = [never, 0, 1, 2, 3, 4, 5];

/** Каждый путь по имени поля, достижимый от `T`, `/`-joined, без числовых сегментов. */
export type Paths<T, Depth extends number = 6> = unknown extends T
  ? string
  : [Depth] extends [0]
    ? never
    : {
        [K in keyof Elem<T> & string]: Elem<T>[K] extends Leaf ? K : K | `${K}/${Paths<Elem<T>[K], Prev6[Depth]>}`;
      }[keyof Elem<T> & string];

/** Тип на пути `K` внутри `T`. */
type ValueAt<T, K extends string, Depth extends number = 6> = unknown extends T
  ? unknown
  : [Depth] extends [0]
    ? never
    : K extends `${infer Head}/${infer Rest}`
      ? Head extends keyof Elem<T>
        ? ValueAt<Elem<T>[Head], Rest, Prev6[Depth]>
        : never
      : K extends keyof Elem<T>
        ? Elem<T>[K]
        : never;

/** `Paths<T>`, суженный до путей, ведущих в массив — единственная законная форма `repeat.path`. */
export type ArrayPaths<T, Depth extends number = 6> = unknown extends T
  ? string
  : {
      [K in Paths<T, Depth>]: NonNullable<ValueAt<T, K, Depth>> extends readonly unknown[] ? K : never;
    }[Paths<T, Depth>];

/** Данные, которые видит шаблон/дети повтора — тип ЭЛЕМЕНТА массива по `repeat.path`. */
export type ElementAt<T, K extends ArrayPaths<T> | ""> = unknown extends T ? unknown : K extends "" ? Elem<T> : Elem<ValueAt<T, K>>;

/** Снимает ведущий `/`, если есть. */
export type Bare<K extends string> = K extends `/${infer Rest}` ? Rest : K;

/**
 * Путь в формате, которым его реально пишет ЭТА позиция дерева — абсолютный от корня io-схемы
 * до первого `repeat`, относительный внутри него. `""` — легальный третий вариант («сами текущие
 * данные»), тот же маркер, что `resolveDataBinding` разбирает первым.
 */
export type BoundPath<T, AtRoot extends boolean> = unknown extends T ? string : "" | (AtRoot extends true ? `/${Paths<T>}` : Paths<T>);

/** `BoundPath`, суженный до путей-в-массив — формат, которым `repeat.path` пишет себя сам. */
export type RepeatPath<T, AtRoot extends boolean> = unknown extends T
  ? string
  : (NonNullable<T> extends readonly unknown[] ? "" : never) | (AtRoot extends true ? `/${ArrayPaths<T>}` : ArrayPaths<T>);

/** `AtRoot`, наследуемый детьми повтора: `false` для реальной схемы, `true` для непротипизированной. */
export type NextRoot<T> = unknown extends T ? true : false;
