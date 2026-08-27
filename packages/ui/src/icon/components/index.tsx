import type { LucideProps } from "lucide-solid";
import type { Component, JSX } from "solid-js";
import { createMemo, splitProps, untrack } from "solid-js";

import { useAddress } from "../../slot-chain.js";
import { traceLife } from "../../trace.js";
import { anatomyParts } from "../entity/anatomy.js";

// ЗНАЧОК (`PWEB-107`) — первый настоящий компонент рода `icon`. Место под него в паспорте стояло
// с прошлой волны (`accepts: [{kind:"content", genus:"icon"}]` у кнопки и вкладки гармошки), а
// самого значка, который туда легально встаёт, не было.
//
// ## Кит не знает имён значков lucide, и знать не должен
//
// `lucide-solid` — не один компонент с параметром-строкой, а ~1500 отдельных именованных
// (`ChevronDown`, `ArrowRight`, PascalCase). Завести паспорт на каждый значило бы вернуть тот
// самый «говнокод в тысячу строк», от которого кит только что ушёл; просто принять любой JSX
// детьми значило бы оставить `genus: "icon"` декорацией, которую никто не проверяет.
//
// Развилка снимается тем, что `Icon` — обёртка, а не каталог: она принимает уже импортированный
// потребителем компонент значка пропом (`icon={ChevronDown}`) и рендерит его. Тряска дерева
// остаётся на стороне потребителя — он импортирует точечно (`lucide-solid/icons/chevron-down`),
// а кит от списка значков lucide не зависит и не устареет вместе с ним.
//
// ## Остальные пропы — насквозь, тем же приёмом, что у кнопки
//
// `size`, `color`, `strokeWidth`, любой валидный атрибут `<svg>` кит не толкует и не
// переизобретает словарём настроек: значок безголовый, как остальной кит, — ни цвета по
// умолчанию, ни кегля. Решение принято, а не отложено: второй словарь поверх словаря самого
// lucide был бы дублем без пользы.
//
// ## Значок выбирается ДИНАМИЧЕСКИ — тем же приёмом, что `Dynamic`, но без него
//
// `icon` — обычный реактивный проп: потребитель вправе поменять значок в рантайме (переключить
// по состоянию), а простой JSX-тег зафиксировал бы его на момент вызова. Решает эту же задачу
// `Dynamic` из `solid-js/web` — но ЯВНЫЙ импорт рантайма пробил бы ветку `solid` поставки
// (гейт `test/surface.test.ts`, «сырой JSX без рантайм-вызовов Solid»): она обязана остаться
// СЫРОЙ до того, как её транслирует тулчейн потребителя, а вызов функции — уже не синтаксис.
//
// Внутри `Dynamic` для функции-компонента (`createDynamic`, `solid-js/web`) — ровно два вызова
// из обычного `solid-js`: `createMemo`, чтобы реагировать на смену `icon`, и `untrack` вокруг
// самого рендера, чтобы сигналы ВНУТРИ выбранного значка не подписывали НАС на то, что уже
// подписывает его собственный рендер. Тот же приём, без чужого рантайма в исходнике.

/** Пропсы `Icon`: сам значок плюс всё, что примет его `<svg>`-узел. */
export interface IconProps extends LucideProps {
  /** Компонент значка — импортированный потребителем точечно, как обычный значок lucide. */
  readonly icon: Component<LucideProps>;
}

/**
 * Значок — ОДИН узел `<svg>`, которым рисует `lucide-solid`, плюс адрес.
 *
 * @example
 * ```tsx
 * import ChevronDown from "lucide-solid/icons/chevron-down";
 *
 * <AccordionItemIndicator>
 *   <Icon icon={ChevronDown} />
 * </AccordionItemIndicator>
 * ```
 */
export function Icon(props: IconProps): JSX.Element {
  traceLife("ui.icon");

  const [address, withoutAddress] = useAddress(props, anatomyParts.root.attrs);
  // `icon` — наш проп, не значка: останься он в `rest`, утёк бы на `<svg>` лишним атрибутом.
  const [local, rest] = splitProps(withoutAddress, ["icon"]);

  // Адрес — ПОСЛЕДНИМ и не перебивается ничем (`PWEB-46`): это личность узла, а не подсказка
  // оформлению, и `lucide-solid` спредит `rest` на `<svg>` раньше, чем мы поставим `data-scope`.
  //
  // Тип: `createMemo` отдаёт `Accessor<JSX.Element>`, а не `JSX.Element` — сигнатуры компонента
  // Solid этого не ждут (правы: пришедший СНАРУЖИ аксессор был бы уже двойной реактивностью).
  // Здесь ровно тот случай, для которого существует `Dynamic`, — привести можно только приведением.
  const узел = createMemo(() => {
    const Значок = local.icon;

    return untrack(() => <Значок {...rest} {...address} />);
  });

  return узел as unknown as JSX.Element;
}
