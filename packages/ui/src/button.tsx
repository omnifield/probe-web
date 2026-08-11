import { Root as KobalteButton, type ButtonRootProps } from "@kobalte/core/button";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

/**
 * Пропсы `Button`: всё, что принимает целевой элемент, плюс `as` и `disabled`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type ButtonProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  ButtonRootProps<T>
>;

/**
 * Кнопка — ОДИН узел, по умолчанию нативный `<button type="button">`.
 *
 * Работу делает `@kobalte/core/button` (паттерн WAI-ARIA Button), и делает её ровно там, где
 * нативного элемента не хватает: при `as="div"`/`as="a"` он сам ставит `role="button"`,
 * `tabindex`, `aria-disabled` и гасит активацию с клавиатуры у отключённой кнопки. Ради этого
 * примитив и стоит на ките, а не на голом `<button>`.
 *
 * `type="button"` по умолчанию — тоже kobalte: без него кнопка внутри формы отправляет её при
 * первом же нажатии, и это самый частый скрытый дефект кнопок.
 *
 * **Ноль стилей.** Класса по умолчанию нет — стилизует потребитель, зацепка `[data-slot=button]`
 * либо свой `class`. Состояния отдаются атрибутами: `data-disabled`, `aria-disabled`.
 *
 * **Загрузка** отдельным пропом НЕ заводится: `<Button disabled aria-busy="true"><Spinner /></Button>`
 * собирается из того, что уже есть, а проп-сахар заморозил бы в поверхности решение о том,
 * что кнопка при загрузке прячет содержимое (в оракуле именно так и было).
 *
 * @example
 * ```tsx
 * <Button onClick={save}>Сохранить</Button>
 * <Button as="a" href="/docs">Документация</Button>
 * <Button disabled aria-busy="true"><Spinner /></Button>
 * <Button ref={setEl} class="my-button">Свой класс</Button>
 * ```
 */
export function Button<T extends ValidComponent = "button">(props: ButtonProps<T>) {
  traceLife("ui.button");

  // `data-slot` стоит ДО спреда: это ДЕФОЛТ-зацепка, а не наша печать поверх. Потребитель,
  // которому нужна своя, перебивает её своим пропом — иначе «открытый API» был бы на словах.
  return <KobalteButton data-slot="button" {...(props as ButtonRootProps)} />;
}
