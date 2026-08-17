// Управление панели — НА НАШИХ ЖЕ КОМПОНЕНТАХ.
//
// Решение user 2026-08-17: пояснения убрать в подсказку (появляется при наведении на заголовок и
// не занимает места), а выбор из более чем двух-трёх вариантов делать списком, потому что
// вариантов будет больше и ряды кнопок съедают панель.
//
// Побочная выгода, ради которой это стоило делать и без просьбы: стенд начинает ЕСТЬ СВОЙ КОРМ.
// Подсказка и список выбора здесь — те самые примитивы, которые зона одевает; если у них криво
// с раскладкой в узкой колонке или с длинным значением, я узнаю об этом первым, а не от
// потребителя.
//
// ЦЕНА, названная прямо: при снятом оформлении панель становится голой — она сделана теми же
// компонентами, что и образцы. Управление при этом РАБОТАЕТ (поведение у кита своё, вида оно не
// требует), и это честнее, чем держать для панели вторую копию оформления: копия разошлась бы с
// поставкой на первой же правке.

import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemLabel,
  SelectListbox,
  SelectPortal,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@omnifield/probe-web-ui";
import { Show } from "solid-js";

export interface Option {
  id: string;
  label: string;
}

/**
 * Заголовок раздела панели. Пояснение живёт в подсказке: оно нужно раз в жизни, а место занимало
 * постоянно.
 */
export function KnobLabel(props: { text: string; hint?: string }) {
  return (
    <Show when={props.hint} fallback={<span class="side__label">{props.text}</span>}>
      <Tooltip openDelay={200} placement="right">
        <TooltipTrigger as="span" class="side__label side__label--help">
          {props.text}
          <span class="side__help" aria-hidden="true">
            ?
          </span>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>
            <TooltipArrow />
            {props.hint}
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </Show>
  );
}

/**
 * Выбор одного из нескольких — списком, а не рядом кнопок.
 *
 * Порог назвал user: больше двух-трёх вариантов. Ниже порога ряд кнопок читается быстрее (обе
 * возможности видны сразу), выше — список выигрывает, потому что панель не растёт вместе с
 * числом вариантов.
 */
export function KnobSelect(props: {
  label: string;
  hint?: string;
  options: readonly Option[];
  value: string;
  onChange: (id: string) => void;
}) {
  const ids = () => props.options.map((o) => o.id);
  const labelOf = (id: string | null) =>
    props.options.find((o) => o.id === id)?.label ?? "";

  return (
    <div class="knob">
      <KnobLabel text={props.label} hint={props.hint} />
      <Select
        value={props.value}
        onChange={(id) => id !== null && props.onChange(id)}
        options={ids()}
        disallowEmptySelection
        itemComponent={(itemProps) => (
          <SelectItem item={itemProps.item}>
            <SelectItemLabel>{labelOf(itemProps.item.rawValue)}</SelectItemLabel>
            {/* Отметка выбранного обязательна: без неё в открытом списке не видно, что стоит
                сейчас, — подсветка показывает лишь то, на чём курсор или клавиатура. */}
            <SelectItemIndicator />
          </SelectItem>
        )}
      >
        <SelectTrigger aria-label={props.label}>
          <SelectValue<string>>{(state) => labelOf(state.selectedOption())}</SelectValue>
          <SelectIcon />
        </SelectTrigger>
        <SelectPortal>
          <SelectContent>
            <SelectListbox />
          </SelectContent>
        </SelectPortal>
      </Select>
    </div>
  );
}
