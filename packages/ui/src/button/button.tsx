import { Root as KobalteButton, type ButtonRootProps } from "@kobalte/core/button";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useAddress, useSlot, slotAware } from "../slot-chain.js";
import { traceLife } from "../trace.js";
import { parts } from "./button.anatomy.js";

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
 * **Ноль стилей.** Класса по умолчанию нет — стилизует потребитель. Адрес для скина кнопка
 * ставит АТРИБУТАМИ ИЗ АНАТОМИИ (`data-scope=button` + `data-part=root`, `button.anatomy.ts`):
 * скин цепляется селектором из того же объявления, и разъехаться им негде по построению.
 * Состояния отдаются атрибутами: `data-disabled`, `aria-disabled`.
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
 * <Button variant="главная">Сохранить</Button>
 * ```
 */
export const Button = slotAware(function Button<T extends ValidComponent = "button">(props: ButtonProps<T>) {
  traceLife("ui.button");

  const [slot, rest] = useSlot(props, "button");
  const [address, clean] = useAddress(rest, parts.root.attrs);

  // Порядок спреда — часть контракта, и половины у него РАЗНЫЕ.
  //
  // `data-slot` идёт ПЕРВЫМ: это дефолт, и явная зацепка потребителя обязана его перебить —
  // имена-зацепки подсказка оформлению, а не обещание о том, чем узел является.
  //
  // Адрес идёт ПОСЛЕДНИМ и не перебивается ничем (`PWEB-46`): это личность узла. Пришедший
  // снаружи адрес `useAddress` уже снял — от кого бы он ни пришёл, от потребителя или от чужого
  // внешнего звена, которое спредит свои пропы на вставленную кнопку.
  //
  // Своего адреса кнопка не ставит только когда узел рисует не она: `<Button as={ToggleGroupItem}>`
  // отдаёт адрес внутреннему — тому, чем узел является визуально (`PWEB-25`).
  //
  // `data-slot` пока остаётся рядом с адресом анатомии: имена слотов — обязательство зоны
  // (`kb:PROBEWEB-12`, п.7), и снять его без мажора нельзя. Уедет он вместе с переездом
  // оформления на адреса анатомии — это выпуск architect'а, а не побочная правка кита.
  return <KobalteButton {...slot} {...(clean as ButtonRootProps)} {...address} />;
});
