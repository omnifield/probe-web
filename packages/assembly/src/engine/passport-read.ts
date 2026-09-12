// см. README.md / FAQ.md

import type { SelfAssembly } from "./self-assembly.js";

// Литеральные объединения, не вычисляемые дженериком по чужой io-схеме — форма скопирована из
// `@web-core/skin/editor`'s `PassportGenus`/`PassportComponentGenus`/`PassportAdmission`, но
// объявлена своя, не импортирована: узкая структурная копия ровно того, что здесь читается, тем
// же приёмом, каким `ReadablePassport` ниже уже избегает импорта целого `ComponentPassport`
// (ROADMAP.yaml, `assembly-drop-skin-devdependency` — цикл `assembly ⇄ skin` подтверждён
// прогоном, эта форма снимает СВОЮ половину).
export type Genus = "text" | "icon";

export type ComponentGenus = "icon" | "component";

export type Admission =
  | { readonly kind: "content"; readonly genus: Genus }
  | { readonly kind: "component"; readonly genus?: ComponentGenus; readonly name?: string };

export interface ReadablePart {
  readonly name: string;
  readonly accepts?: readonly Admission[];
}

export interface ReadablePassport {
  readonly component: string;
  readonly genus: ComponentGenus;
  readonly anatomy: { keys: () => string[] };
  readonly root: string;
  readonly parts: readonly ReadablePart[];
  readonly selfAssembly?: SelfAssembly;
}

// Срез `ReadablePassport`, которого хватает росту дерева по шаблону (`baseAssemblyOf`,
// `expand.ts`) — три поля, не весь паспорт. `Registry`/`ReadableComponent` (`registry.ts`)
// реально используют `genus`/`parts`/`.accepts` для допуска и вложенности; `baseAssemblyOf` их не
// читает НИ РАЗУ (сверено чтением тела функции, не по аналогии с `readable()`, которой они
// нужны). Любой `ReadablePassport` уже удовлетворяет этому срезу структурно — сужение только
// ограничивает, что функция ОБЯЗАНА прочитать, не то, что ей можно передать.
export interface GrowablePassport {
  readonly component: string;
  readonly anatomy: { keys: () => string[] };
  readonly root: string;
}

export interface AdmissionRule {
  admits(part: ReadablePart, candidate: Admission): boolean;
}

export function partOf(passport: ReadablePassport, name: string): ReadablePart | undefined {
  return passport.parts.find((part) => part.name === name);
}
