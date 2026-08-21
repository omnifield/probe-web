import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../slot-chain.js";
import { traceLife } from "../trace.js";
import { parts } from "./surface.anatomy.js";

// Поверхность — плоскость, отделяющая содержимое от того, что под ним.
//
// ## Чего у кита не было ни одного
//
// Кит до сих пор был целиком интерактивным: кнопки, поля, меню, окна. Плоскости — карточки,
// панели, полки — собирались в приложении своим `<div class="…">`, и вид у них жил там же.
// Значит скин их не одевал и переодеть не мог: адреса нет — правила нет.
//
// ## Ни одного значения по умолчанию
//
// Ни фона, ни рамки, ни тени, ни скругления, ни отступа. Компонент рендерит ОДИН узел с адресом
// и больше не делает ничего — голая поверхность выглядит как ничто, и это её законное рабочее
// состояние (страница «Скин»: нет скина — приложение голое).
//
// Отступ внутри плоскости — тоже вид, и тоже скина: `padding` это то, как плоскость выглядит, а
// не то, чем она является.
//
// ## Тег выбирает потребитель
//
// `as` есть намеренно: плоскость бывает `<section>`, `<article>`, `<aside>`, `<li>` — семантику
// знает тот, кто ставит её на страницу. Прибей мы `<div>` — навязали бы разметку, которую потом
// не снять без мажора.

/**
 * Пропсы `Surface`: всё, что принимает целевой элемент, плюс `as`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SurfaceProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

/**
 * Поверхность — ОДИН узел с адресом и ничем больше.
 *
 * @example
 * ```tsx
 * <Surface data-variant="карточка">
 *   <Flow data-variant="строки">…</Flow>
 * </Surface>
 *
 * <Surface as="section" aria-labelledby="итоги">…</Surface>
 * ```
 */
export const Surface = slotAware(function Surface<T extends ValidComponent = "div">(
  props: SurfaceProps<T>,
) {
  traceLife("ui.surface");

  // Адрес едет через `useAddress`, а не прямым спредом: при композиции `as={…}` с нашим же
  // примитивом адрес принадлежит внутреннему — тому, чем узел является визуально (`PWEB-25`).
  const address = useAddress(props, parts.root.attrs);

  // `as="div"` стоит ДО спреда — это дефолт, который проп потребителя перебивает.
  return <Polymorphic as="div" {...address} {...props} />;
});
