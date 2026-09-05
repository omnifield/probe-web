
import type { PassportGenus } from "./admission.js";
import type { DispatchAction, DynamicValue } from "./binding.js";
import type { ArrayPaths, Bare, BoundPath, ElementAt, NextRoot, RepeatPath } from "./paths.js";

// `node` называет ЛИБО свою часть анатомии, ЛИБО чужой компонент реестра — одним полем.
// `Data`/`AtRoot` типизируют путь `bind`/`repeat.path`/`value` по реальной io-схеме узла вместо
// голой строки; `AtRoot` решает формат строки (абсолютный/относительный — см. `paths.ts`).
// Разбор дженериков — FAQ.md.
interface ElementFields<Part extends string, Registry extends string, Data, AtRoot extends boolean> {
  readonly node: Part | Registry;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly bind?: Readonly<Record<string, BoundPath<Data, AtRoot>>>;
  readonly on?: Readonly<Record<string, DispatchAction<Data, AtRoot>>>;
  /** Накопленный индекс повтора (`[0, 2, 1]`) — структурный факт дерева, не путь к данным. */
  readonly indexPathBind?: string;
  /** Рекурсия как поведение обхода: узел вкладывает себя же, если собственные данные вложены. */
  readonly recur?: { readonly path: string; readonly into: Part | Registry };
}

// Один вариант НА КАЖДЫЙ легальный литерал `repeat.path`: `bind`/`children` этого же узла уже
// читают данные ПОСЛЕ повтора, и это можно выразить только индексацией mapped-типа по его же
// ключу, не плоским полем рядом. Разбор — FAQ.md.
type RepeatedElement<Part extends string, Registry extends string, Data, AtRoot extends boolean> = {
  [K in RepeatPath<Data, AtRoot>]: ElementFields<Part, Registry, ElementAt<Data, Bare<K> & (ArrayPaths<Data> | "")>, NextRoot<Data>> & {
    readonly repeat: { readonly path: K };
    readonly children?: readonly PassportAssemblyNode<Part, Registry, ElementAt<Data, Bare<K> & (ArrayPaths<Data> | "")>, NextRoot<Data>>[];
  };
}[RepeatPath<Data, AtRoot>];

type PlainElement<Part extends string, Registry extends string, Data, AtRoot extends boolean> = ElementFields<
  Part,
  Registry,
  Data,
  AtRoot
> & {
  readonly repeat?: undefined;
  readonly children?: readonly PassportAssemblyNode<Part, Registry, Data, AtRoot>[];
};

export type PassportAssemblyElement<
  Part extends string = string,
  Registry extends string = string,
  Data = unknown,
  AtRoot extends boolean = true,
> = PlainElement<Part, Registry, Data, AtRoot> | RepeatedElement<Part, Registry, Data, AtRoot>;

export interface PassportAssemblyContent<Data = unknown, AtRoot extends boolean = true> {
  readonly genus: PassportGenus;
  readonly value: DynamicValue<Data, AtRoot>;
}

export interface PassportSelfAssembly<Part extends string = string, Registry extends string = string, Data = unknown> {
  readonly tree: PassportAssemblyElement<Part, Registry, Data, true>;
}

// Старая обёрточная форма `{repeat, template}` — жива рядом с полевой, тем же приёмом типизации.
export type PassportAssemblyRepeat<
  Part extends string = string,
  Registry extends string = string,
  Data = unknown,
  AtRoot extends boolean = true,
> = {
  [K in RepeatPath<Data, AtRoot>]: {
    readonly repeat: { readonly path: K };
    readonly template: PassportAssemblyNode<Part, Registry, ElementAt<Data, Bare<K> & (ArrayPaths<Data> | "")>, NextRoot<Data>>;
  };
}[RepeatPath<Data, AtRoot>];

export function isAssemblyRepeat<
  Part extends string = string,
  Registry extends string = string,
  Data = unknown,
  AtRoot extends boolean = true,
>(node: PassportAssemblyNode<Part, Registry, Data, AtRoot>): node is PassportAssemblyRepeat<Part, Registry, Data, AtRoot> {
  return "template" in node;
}

export type PassportAssemblyNode<
  Part extends string = string,
  Registry extends string = string,
  Data = unknown,
  AtRoot extends boolean = true,
> =
  | PassportAssemblyElement<Part, Registry, Data, AtRoot>
  | PassportAssemblyContent<Data, AtRoot>
  | PassportAssemblyRepeat<Part, Registry, Data, AtRoot>;

export function isAssemblyContent(node: PassportAssemblyNode): node is PassportAssemblyContent {
  return "genus" in node;
}
