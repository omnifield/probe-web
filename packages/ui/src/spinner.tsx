import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

/**
 * Пропсы `Spinner`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type SpinnerProps<T extends ValidComponent = "span"> = PolymorphicProps<T>;

/**
 * Индикатор ожидания — ОДИН узел с `role="status"`.
 *
 * **Он ничего не рисует, и это не пробел, а следствие контракта.** Вращающееся кольцо — это
 * CSS: рамка, радиус, `animation`. Ноль презентационных стилей по умолчанию значит, что
 * рисует потребитель — по зацепке `[data-slot="spinner"]` или своему классу. В оракуле
 * спиннер вёз `animate-spin rounded-full border-2 …`, то есть жёстко требовал Tailwind и
 * конкретную тему; пакет, который так делает, стилизуемым не является.
 *
 * Что примитив даёт взамен: `role="status"` — живую область, которую скринридер объявляет
 * сам, и точку, где это объявление не забудут поставить.
 *
 * Единственного узла хватает: `<span role="status" aria-label="…" />` уже озвучивается. Двух
 * узлов (внешний со `role`, внутренний с `aria-hidden`) оракулу требовала именно рамка-кольцо
 * — нет кольца, нет и второго узла.
 *
 * @example
 * ```tsx
 * <Spinner aria-label="Загрузка" />
 * <Spinner>Загружаем отчёт…</Spinner>
 * ```
 * ```css
 * [data-slot="spinner"] { display: inline-block; width: 1em; height: 1em;
 *   border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%;
 *   animation: spin 1s linear infinite; }
 * ```
 */
export function Spinner<T extends ValidComponent = "span">(props: SpinnerProps<T>) {
  traceLife("ui.spinner");

  // `role` стоит ДО спреда — дефолт, а не печать: `role="progressbar"` с `aria-valuenow`
  // потребитель поставит своим пропом, и он выиграет.
  return <Polymorphic as="span" role="status" data-slot="spinner" {...props} />;
}
